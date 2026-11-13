"""3D sahne için gerçek DEM pencereleri (F1). Çıktı: site/public/data/dem/<id>.bin.gz + dem/index.json
Düzen (gzip): Int16 LE yükseklik [111x111] + Uint8 eğim [111x111].
 - Yükseklik: 30 m pencerenin 3x3 nanmean'i (90 m görüntü ızgarası); geçerli < 5/9 ise yok (-32768).
 - Eğim: Horn 3x3 (terrain.py, 30 m'de) -> 3x3 nanmean -> 0.25 derece adım, Uint8 (yok = 255). Tarayıcıda eğim HESAPLANMAZ.
Pencereler: Ay Site04/01/07, Mars R2 (merkeze en yakın pencere), Dünya adayları (profil ve bölge başına en iyi K)."""
import gzip, json, sys, warnings
from pathlib import Path
import numpy as np, rasterio
from rasterio.crs import CRS
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling

sys.path.insert(0, str(Path(__file__).parent))
import terrain as T, earth_scan as E
from window_test import moon_window, N

OUT = Path("site/public/data/dem"); OUT.mkdir(parents=True, exist_ok=True)
K, G, B = 40, 111, 3
warnings.filterwarnings("ignore", category=RuntimeWarning)


def block(a, need=5):
    b = a.reshape(G, B, G, B).transpose(0, 2, 1, 3).reshape(G, G, B * B)
    m = np.nanmean(b, axis=2); m[np.isfinite(b).sum(2) < need] = np.nan
    return m


def save(wid, z30, meta):
    sl = T.horn_slope_deg(z30)
    e, s = block(z30), block(sl)
    ei = np.where(np.isfinite(e), np.round(e), -32768).astype("<i2")
    si = np.where(np.isfinite(s), np.clip(np.round(s / 0.25), 0, 254), 255).astype("u1")
    with gzip.open(OUT / f"{wid}.bin.gz", "wb", 9) as f:
        f.write(ei.tobytes() + si.tobytes())
    meta.update(z_min=float(np.nanmin(e)), z_max=float(np.nanmax(e)), valid_fraction=round(float(np.isfinite(e).mean()), 4),
                slope_p50_view=round(float(np.nanmedian(s)), 2))
    return meta


def jl(p):
    """data/ JSON'ları farklı betiklerde utf-8 veya Windows varsayılan kodlamasıyla yazılmış; ikisini de dene."""
    raw = Path(p).read_bytes()
    try:
        return json.loads(raw.decode("utf-8"))
    except UnicodeDecodeError:
        return json.loads(raw.decode("cp1254"))


idx = {"grid": G, "cell_m": 30 * B, "window_km": 10.0, "slope_step_deg": 0.25, "slope_nodata": 255, "z_nodata": -32768,
       "processing": "30 m pencere -> 3x3 ortalama (90 m görüntü ızgarası). Eğim: Horn 3x3 (30 m), sonra 3x3 ortalama.", "windows": {}}

# ---- Ay referansları
rm = jl("data/reference_moon.json"); rw = jl("data/reference_windows_moon.json")
for w in rm["windows"]:
    c = rw[w["id"]]
    z = moon_window(c["centroid_x_m"], c["centroid_y_m"], npy="data_raw/lola_pole_90km.npy", half_px=2250)
    idx["windows"][w["id"]] = save(w["id"], z, {"kind": "ref_moon", "title": f"{w['id']} ({w['name']})", "lat": w["lat"], "lon": w["lon_E"],
        "product": "LOLA LDEM_80S_20M (M1, NASA PDS), 20 m -> 30 m ortalama"})
    print("ref", w["id"])

# ---- Mars referansı R2
rs = jl("data/reference_mars.json")
with rasterio.open("data_raw/mars/R2.tif") as ds:
    z = ds.read(1).astype("float32"); tr, crs, b = ds.transform, ds.crs, ds.bounds
R = 3396190.0
lon0, lat0 = np.degrees((b.left + b.right) / 2 / R), np.degrees((b.top + b.bottom) / 2 / R)
dcrs = CRS.from_proj4(f"+proj=laea +lat_0={lat0} +lon_0={lon0} +a={R} +b={R} +units=m +no_defs")
Wd, Hd = 1120, 1060
zz = np.full((Hd, Wd), np.nan, dtype="float32")
reproject(z, zz, src_transform=tr, src_crs=crs, dst_transform=from_origin(-Wd * 15.0, Hd * 15.0, 30.0, 30.0), dst_crs=dcrs, dst_nodata=np.nan, resampling=Resampling.average)
best = min(rs["windows"], key=lambda w: abs(w["row0"] + N / 2 - Hd / 2) + abs(w["col0"] + N / 2 - Wd / 2))
idx["windows"]["R2"] = save("R2", zz[best["row0"]:best["row0"] + N, best["col0"]:best["col0"] + N],
    {"kind": "ref_mars", "title": f"R2 (Jezero, pencere {best['id']})", "lat": float(lat0), "lon": float(lon0),
     "product": "USGS Mars 2020 TRN CTX DTM 20 m (R2) -> 30 m ortalama"})
print("ref R2", best["id"])

# ---- Dünya adayları
want = {}
for prof in ("moon", "mars"):
    fs = jl(f"data/candidates_{prof}.geojson")["features"]
    byreg = {}
    for f in fs:
        byreg.setdefault(f["properties"]["region"], []).append(f["properties"])
    for reg, ps in byreg.items():
        for p in sorted(ps, key=lambda p: p["rank"])[:K]:
            want[p["id"]] = (p["region"], p["center_lat"], p["center_lon"])
strips = {}
for wid in want:
    reg, si, ci = wid.split("_")[0], int(wid.split("_")[1][1:]), int(wid.split("_")[2][1:])
    strips.setdefault((reg, si), []).append((wid, ci))
for (reg, si), items in strips.items():
    z, nn, _ = E.read_strip(reg, si)
    for wid, ci in items:
        c0 = ci * E.STEP
        w = z[0:N, c0:c0 + N]
        idx["windows"][wid] = save(wid, w, {"kind": "earth", "title": f"Dünya · {wid}", "lat": want[wid][1], "lon": want[wid][2],
                                            "product": "NASADEM_HGT v001 (NASA LP DAAC), 30 m, bölgesel LAEA"})
    print("strip", reg, si, len(items))
json.dump(idx, open(OUT / "index.json", "w", encoding="utf-8"), ensure_ascii=False)
tot = sum(f.stat().st_size for f in OUT.glob("*.bin.gz"))
print("windows", len(idx["windows"]), "toplam MB", round(tot / 1e6, 2))
