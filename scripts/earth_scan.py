"""Dünya aday pencereleri: bölge başına LAEA 30 m şerit-şerit tarama, 10 km pencere, adım 5 km (167 px).
Her pencere için P10/P50/P90, geçerli oran, NUM sınıf oranları, iki referansa (Ay, Mars) karşı O_k ve d_k/D.
d_k yalnızca tüm O_k >= 0.25 ise hesaplanır (duyarlılık testi için en gevşek eşik). Çıktı: data/windows_earth.parquet"""
import csv, io, json, os, sys, zipfile, numpy as np, pandas as pd
from functools import lru_cache
from multiprocessing import Pool
from pathlib import Path
import rasterio
from pyproj import Transformer, CRS as PCRS
from rasterio.crs import CRS
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
sys.path.insert(0, str(Path(__file__).parent))
import terrain as T, sim as S

N, STEP = 333, 167
REG = {f["properties"]["code"]: f["properties"]["bbox_wsen"] for f in json.load(open("data/regions.geojson"))["features"]}
TILES = {}
for r in csv.DictReader(open("data/nasadem_tiles.csv", encoding="utf-8")):
    TILES.setdefault(r["region"], []).append(r["granule"].replace("NASADEM_HGT_", ""))
REFS = None


def init():
    global REFS
    REFS = {}
    for p in ("moon", "mars"):
        z = np.load(f"data_raw/ref_{p}.npz"); REFS[p] = S.make_ref({k: z[k] for k in S.VARS})


def tile_ll(name):
    ns, lat, ew, lon = name[0], int(name[1:3]), name[3], int(name[4:7])
    return (lat if ns == "n" else -lat), (lon if ew == "e" else -lon)


@lru_cache(maxsize=12)
def load_tile(name):
    with zipfile.ZipFile(f"data_raw/nasadem_zip/NASADEM_HGT_{name}.zip") as z:
        h = np.frombuffer(z.read(f"{name}.hgt"), dtype=">i2").reshape(3601, 3601).astype("float32")
        n = np.frombuffer(z.read(f"{name}.num"), dtype="u1").reshape(3601, 3601)
    h[(h == -32768) | (n == 0)] = np.nan          # boşluk ve su maskelenir (kural 3)
    return h, n.astype("float32")


def grid_for(code):
    w, s, e, n = REG[code]
    lat0, lon0 = (s + n) / 2, (w + e) / 2
    crs = CRS.from_proj4(f"+proj=laea +lat_0={lat0} +lon_0={lon0} +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs")
    tf = Transformer.from_crs("EPSG:4326", crs.to_proj4(), always_xy=True)
    xs, ys = [], []
    for t in np.linspace(0, 1, 50):
        for lo, la in ((w + t * (e - w), s), (w + t * (e - w), n), (w, s + t * (n - s)), (e, s + t * (n - s))):
            x, y = tf.transform(lo, la); xs.append(x); ys.append(y)
    x0, y1 = np.floor(min(xs) / 30) * 30, np.ceil(max(ys) / 30) * 30
    W, H = int((max(xs) - x0) // 30), int((y1 - min(ys)) // 30)
    return crs, x0, y1, W, H


def read_strip(code, si):
    """Bir şeridin 30 m DEM'i (z) ve NUM (nn) dizileri. strip_task ve DEM dışa aktarımı ortak kullanır."""
    crs, x0, y1, W, H = grid_for(code)
    r0 = si * STEP
    top = y1 - r0 * 30
    tr = from_origin(x0, top, 30, 30)
    z = np.full((N, W), np.nan, dtype="float32"); nn = np.full((N, W), np.nan, dtype="float32")
    inv = Transformer.from_crs(crs.to_proj4(), "EPSG:4326", always_xy=True)
    pts = [inv.transform(x0 + i * (W * 30) / 20, top - j * (N * 30) / 4) for i in range(21) for j in range(5)]
    lats, lons = [p[1] for p in pts], [p[0] for p in pts]
    for name in TILES[code]:
        la, lo = tile_ll(name)
        if la + 1 < min(lats) - 0.01 or la > max(lats) + 0.01 or lo + 1 < min(lons) - 0.01 or lo > max(lons) + 0.01:
            continue
        h, n = load_tile(name)
        st = from_origin(lo - 0.5 / 3600, la + 1 + 0.5 / 3600, 1 / 3600, 1 / 3600)
        reproject(h, z, src_transform=st, src_crs="EPSG:4326", src_nodata=np.nan, dst_transform=tr, dst_crs=crs,
                  dst_nodata=np.nan, resampling=Resampling.average, init_dest_nodata=False)
        reproject(n, nn, src_transform=st, src_crs="EPSG:4326", dst_transform=tr, dst_crs=crs, dst_nodata=np.nan,
                  resampling=Resampling.nearest, init_dest_nodata=False)
    return z, nn, (crs, x0, top, W, inv)


def strip_task(args):
    code, si = args
    z, nn, (crs, x0, top, W, inv) = read_strip(code, si)
    if not np.isfinite(z).any():
        return []
    d = T.derive(z)
    recs = []
    for ci, c0 in enumerate(range(0, W - N + 1, STEP)):
        sl = (slice(0, N), slice(c0, c0 + N))
        vf = float(np.isfinite(z[sl]).mean())
        if vf < 0.9:
            continue
        cx, cy = x0 + (c0 + N / 2) * 30, top - N / 2 * 30
        lon, lat = inv.transform(cx, cy)
        nw = nn[sl]; fin = np.isfinite(nw)
        rec = {"region": code, "row": si, "col": ci, "lat": round(lat, 5), "lon": round(lon, 5), "valid_fraction": round(vf, 4),
               "num_srtm": round(float((fin & (nw >= 1) & (nw <= 94)).mean()), 4),
               "num_fill": round(float((fin & (nw >= 110)).mean()), 4),
               "z_min": float(np.nanmin(z[sl])), "z_max": float(np.nanmax(z[sl]))}
        pix = {k: d[k][sl] for k in S.VARS}
        for k in S.VARS:
            p = S.pcts(pix[k])
            if p is None:
                break
            rec.update({f"{k}_p10": p[10], f"{k}_p50": p[50], f"{k}_p90": p[90]})
        else:
            for prof in ("moon", "mars"):
                ov = {k: S.overlap(S.pcts(pix[k]), REFS[prof][k]["p"]) for k in S.VARS}
                for k in S.VARS:
                    rec[f"{prof}_O_{k}"] = round(ov[k], 4)
                if min(ov.values()) >= 0.25:
                    sc = S.score(pix, REFS[prof], thr=0.0)
                    for k in S.VARS:
                        rec[f"{prof}_d_{k}"] = sc["d"][k]
                    rec[f"{prof}_D"] = sc["D"]
            recs.append(rec)
    return recs


if __name__ == "__main__":
    tasks = []
    for code in REG:
        crs, x0, y1, W, H = grid_for(code)
        tasks += [(code, si) for si in range(0, (H - N) // STEP + 1)]
    print("şerit sayısı", len(tasks), flush=True)
    with Pool(max(1, min(6, (os.cpu_count() or 2) - 1)), initializer=init) as p:
        out = []
        for i, r in enumerate(p.imap_unordered(strip_task, tasks, chunksize=1)):
            out += r
            if i % 25 == 0:
                print(i, "/", len(tasks), "pencere", len(out), flush=True)
    df = pd.DataFrame(out)
    df.to_parquet("data/windows_earth.parquet", index=False)
    print(df.groupby("region").size().to_dict(), "toplam", len(df))
