"""Referans dağılımları: Ay (Site04/Site01/Site07, LOLA) ve Mars (R2, CTX DTM). Çıktı: data/reference_{moon,mars}.json + data_raw/ref_*.npz"""
import json, sys, numpy as np, rasterio
from pathlib import Path
from rasterio.warp import reproject, Resampling
from rasterio.crs import CRS
from rasterio.transform import from_origin
sys.path.insert(0, str(Path(__file__).parent))
import terrain as T, sim as S
from window_test import moon_window, N, dst_grid

refs = json.load(open("data/reference_windows_moon.json"))
HIST = {"slope": np.linspace(0, 45, 46), "relief": np.linspace(0, 600, 61), "rough": np.linspace(0, 10, 51)}


def summarize_ref(pix, label, windows):
    ref = S.make_ref(pix)
    out = {"label": label, "windows": windows, "grid_m": T.PIX, "window_px": N,
           "variables": {k: {"p10": ref[k]["p"][10], "p25": ref[k]["p"][25], "p50": ref[k]["p"][50], "p75": ref[k]["p"][75],
                              "p90": ref[k]["p"][90], "iqr": ref[k]["p"][75] - ref[k]["p"][25], "n_pixels": ref[k]["n"],
                              "hist_counts": np.histogram(S.valid(pix[k]), bins=HIST[k])[0].tolist(), "hist_bins": HIST[k].tolist()}
                         for k in S.VARS}}
    return ref, out


def loo(per_window):
    """§7.5 referans iç yayılımı: biri dışarıda, kalanlar referans."""
    res = {}
    for w in per_window:
        rest = {k: np.concatenate([S.valid(per_window[o][k]) for o in per_window if o != w]) for k in S.VARS}
        sc = S.score(per_window[w], S.make_ref(rest), thr=0.0)
        res[w] = {"D": sc["D"], "d": sc["d"], "O": sc["O"]}
    return res


# ---------------- MOON
per = {}
for site in ("Site04", "Site01", "Site07"):
    c = refs[site]
    z = moon_window(c["centroid_x_m"], c["centroid_y_m"], npy="data_raw/lola_pole_90km.npy", half_px=2250)
    d = T.derive(z); per[site] = {k: d[k] for k in S.VARS}
    print("moon", site, T.summarize(d))
pool = {k: np.concatenate([S.valid(per[s][k]) for s in per]) for k in S.VARS}
ref_m, js = summarize_ref(pool, "Lunar Base Analogs (Shackleton çevresi)",
                          [{"id": s, "name": refs[s]["name"], "center_xy_m": [refs[s]["centroid_x_m"], refs[s]["centroid_y_m"]],
                            "lat": refs[s]["lat_deg"], "lon_E": refs[s]["lon_deg_E"], "source": refs[s]["source"]} for s in per])
js["internal_spread_leave_one_out"] = loo(per)
js["dem"] = "LOLA LDEM_80S_20M (M1), 20 m -> 30 m ortalama; LM1 dışarıda (ROI shapefile yok)"
js["limitations"] = ["L01_psr_mask_missing", "L02_roughness_low_reliability", "L03_lola_interpolation"]
json.dump(js, open("data/reference_moon.json", "w"), indent=1, ensure_ascii=False)
np.savez_compressed("data_raw/ref_moon.npz", **{k: pool[k].astype("float32") for k in S.VARS})

# ---------------- MARS
with rasterio.open("data_raw/mars/R2.tif") as ds:
    z = ds.read(1).astype("float32"); tr, crs, b = ds.transform, ds.crs, ds.bounds
R = 3396190.0
cx, cy = (b.left + b.right) / 2, (b.top + b.bottom) / 2
lon0 = np.degrees(cx / R); lat0 = np.degrees(cy / R)           # Eqc, lat_ts=0
dcrs = CRS.from_proj4(f"+proj=laea +lat_0={lat0} +lon_0={lon0} +a={R} +b={R} +units=m +no_defs")
W, H = 1120, 1060                                               # ~33.6 x 31.8 km @30 m
grid = from_origin(-W * 15.0, H * 15.0, 30.0, 30.0)
zz = np.full((H, W), np.nan, dtype="float32")
reproject(z, zz, src_transform=tr, src_crs=crs, dst_transform=grid, dst_crs=dcrs, dst_nodata=np.nan, resampling=Resampling.average)
valid_cols = np.where(np.isfinite(zz).any(0))[0]; valid_rows = np.where(np.isfinite(zz).any(1))[0]
print("mars valid extent px", valid_cols.min(), valid_cols.max(), valid_rows.min(), valid_rows.max())
D_ = T.derive(zz)
step = 167
wins, per_m, union = [], {}, np.zeros(zz.shape, bool)
for r0 in range(valid_rows.min(), valid_rows.max() - N + 2, step):
    for c0 in range(valid_cols.min(), valid_cols.max() - N + 2, step):
        sl = (slice(r0, r0 + N), slice(c0, c0 + N))
        if np.isfinite(zz[sl]).mean() >= 0.9:
            dw = T.derive(zz[sl]); name = f"R2_{r0}_{c0}"
            per_m[name] = {k: dw[k] for k in S.VARS}; union[sl] = True
            wins.append({"id": name, "row0": r0, "col0": c0, "valid_fraction": round(float(np.isfinite(zz[sl]).mean()), 4)})
print("mars windows", len(wins))
poolm = {k: D_[k][union & np.isfinite(D_[k])] for k in S.VARS}   # birleşim: tekil pikseller
ref_r, jr = summarize_ref(poolm, "Martian Landing & Exploration (Jezero, R2)", wins)
jr["internal_spread_leave_one_out"] = loo(per_m)
jr["dem"] = "USGS Mars 2020 TRN CTX DTM 20 m (R2), LAEA 30 m ortalama"
jr["coverage_km"] = [round((b.right - b.left) / 1000, 2), round((b.top - b.bottom) / 1000, 2)]
jr["note"] = "25 pencere %50 örtüşür; referans dağılımı pencere birleşimindeki tekil piksellerdir. Kapsam küçük (~32x30 km): referans tek bir arazi çevresini temsil eder."
jr["limitations"] = ["L02_roughness_low_reliability"]
json.dump(jr, open("data/reference_mars.json", "w"), indent=1, ensure_ascii=False)
np.savez_compressed("data_raw/ref_mars.npz", **{k: poolm[k].astype("float32") for k in S.VARS})
for nm, j in (("MOON", js), ("MARS", jr)):
    print(nm, {k: (round(v["p10"], 2), round(v["p50"], 2), round(v["p90"], 2), "IQR", round(v["iqr"], 2)) for k, v in j["variables"].items()})
    print(nm, "LOO D:", {w: x["D"] for w, x in list(j["internal_spread_leave_one_out"].items())[:6]})
