"""Dünya termal (SPEC 2.3): MYD11A2.061, 2023, 46 kompozit. Etiketler: Observed = LST_Day/Night_1km (K); Derived = dT_dn, T_mean2.
dT_dn  = LST_Day - LST_Night   (hücre başına yıllık MEDYAN; "günlük aralık vekili, iki örnek")
T_mean2= (LST_Day + LST_Night)/2 (hücre başına yıllık ORTALAMA; "iki örnek ortalaması, gerçek günlük ortalama değil")
QC: QC_Day/QC_Night bit 0-1 == 00 (LAADS MOD11A2 V6.1 şartnamesi: 00 = LST iyi kalitede üretildi). Kompozit QC'si günlük QC'lerin çoğunluğudur (filtre yok).
Hücre koşulu (işlem seçimi, ürün özelliği değil): yıl içinde >= MIN_COMP geçerli kompozit. Pencere: aday pencerenin 10x10 km karesi (bölge LAEA), hücre merkezi içeride.
Çıktı: data/thermal_earth.json  (anahtar: pencere id; candidates_*.geojson'daki tüm pencereler)"""
import glob, json, sys, numpy as np, re
from pathlib import Path
from pyhdf.SD import SD, SDC
from pyproj import Transformer
sys.path.insert(0, str(Path(__file__).parent))
import earth_scan as E

R, TS = 6371007.181, 1111950.5196666666          # sinüzoidal küre yarıçapı ve karo kenarı (StructMetadata ile doğrulandı: h08v05 UL = -11119505.2, 4447802.08)
MIN_COMP, NCOMP = 23, 46
SINU = f"+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +R={R} +units=m +no_defs"


def tile_ul(h, v):
    return -20015109.354 + h * TS, 10007554.677 - v * TS


def read(f, name):
    s = SD(f, SDC.READ).select(name); a = s.attributes()
    raw = s.get().astype("float64")
    return raw, a


def annual(tile, files):
    D, N, QD, QN, VD, VN = [], [], [], [], [], []
    for f in files:
        sd = SD(f, SDC.READ)
        g = lambda n: sd.select(n).get().astype("float64")
        D.append(g("LST_Day_1km")); N.append(g("LST_Night_1km"))
        QD.append(g("QC_Day").astype("int64") & 3); QN.append(g("QC_Night").astype("int64") & 3)
        VD.append(g("Day_view_time")); VN.append(g("Night_view_time"))
    D, N, QD, QN, VD, VN = (np.array(x) for x in (D, N, QD, QN, VD, VN))
    okd = (D >= 7500) & (QD == 0); okn = (N >= 7500) & (QN == 0)
    ok = okd & okn
    day = np.where(ok, D * 0.02, np.nan); night = np.where(ok, N * 0.02, np.nan)
    with np.errstate(all="ignore"):
        dT = np.nanmedian(day - night, axis=0)
        Tm = np.nanmean((day + night) / 2, axis=0)
        vd = np.nanmedian(np.where(ok & (VD <= 240), VD * 0.1, np.nan), axis=0)
        vn = np.nanmedian(np.where(ok & (VN <= 240), VN * 0.1, np.nan), axis=0)
    nc = ok.sum(axis=0)
    bad = nc < MIN_COMP
    for a in (dT, Tm, vd, vn):
        a[bad] = np.nan
    return {"dT": dT, "Tm": Tm, "vd": vd, "vn": vn, "nc": nc}


if __name__ == "__main__":
    groups = {}
    for f in sorted(glob.glob("data_raw/modis/MYD11A2.A2023*.hdf")):
        t = f.split(".")[2]; groups.setdefault(t, []).append(f)
    short = {t: len(v) for t, v in groups.items() if len(v) != NCOMP}
    print("karo", len(groups), "eksik/fazla kompozit:", short, flush=True)
    ann = {}
    for t, fs in groups.items():
        if len(fs) < NCOMP:
            continue                                   # eksik karo kullanılmaz
        ann[t] = annual(t, fs); print("yıllık hesap", t, flush=True)
    feats = {}
    for prof in ("moon", "mars"):
        for ft in json.load(open(f"data/candidates_{prof}.geojson", encoding="utf-8"))["features"]:
            feats[ft["properties"]["id"]] = ft["properties"]
    out = {}
    cache = {}
    for wid, p in feats.items():
        reg = p["region"]
        if reg not in cache:
            crs = E.grid_for(reg)[0]
            cache[reg] = Transformer.from_crs("EPSG:4326", crs.to_proj4(), always_xy=True)
        tf = cache[reg]
        cx, cy = tf.transform(p["center_lon"], p["center_lat"])
        sx, sy = Transformer.from_crs("EPSG:4326", SINU, always_xy=True).transform(p["center_lon"], p["center_lat"])
        vals = {"dT": [], "Tm": [], "vd": [], "vn": [], "nc": []}
        ncell = 0
        for t, a in ann.items():
            h, v = int(t[1:3]), int(t[4:6])
            ulx, uly = tile_ul(h, v)
            res = TS / 1200
            c0, c1 = int((sx - 15000 - ulx) // res), int((sx + 15000 - ulx) // res) + 1
            r0, r1 = int((uly - (sy + 15000)) // res), int((uly - (sy - 15000)) // res) + 1
            if c1 < 0 or r1 < 0 or c0 > 1199 or r0 > 1199:
                continue
            c0, c1, r0, r1 = max(c0, 0), min(c1, 1200), max(r0, 0), min(r1, 1200)
            cc, rr = np.meshgrid(np.arange(c0, c1), np.arange(r0, r1))
            X, Y = ulx + (cc + 0.5) * res, uly - (rr + 0.5) * res
            inv = Transformer.from_crs(SINU, "EPSG:4326", always_xy=True)
            lo, la = inv.transform(X, Y)
            px, py = tf.transform(lo, la)
            ins = (np.abs(px - cx) <= 5000) & (np.abs(py - cy) <= 5000)
            ncell += int(ins.sum())
            for k in vals:
                vals[k].append(a[k][rr, cc][ins])
        vals = {k: np.concatenate(v) if v else np.array([]) for k, v in vals.items()}
        fin = np.isfinite(vals["dT"])
        rec = {"n_cells_in_window": ncell, "n_cells_valid": int(fin.sum())}
        if fin.sum() >= 5:
            rec.update({"dT_dn_K_median": round(float(np.median(vals["dT"][fin])), 2),
                        "dT_dn_K_p10_p90": [round(float(np.percentile(vals["dT"][fin], q)), 2) for q in (10, 90)],
                        "T_mean2_K_median": round(float(np.median(vals["Tm"][fin])), 2),
                        "day_view_time_h_median": round(float(np.median(vals["vd"][fin])), 1),
                        "night_view_time_h_median": round(float(np.median(vals["vn"][fin])), 1),
                        "valid_composites_median_of_46": float(np.median(vals["nc"][fin]))})
        else:
            rec["status"] = "Veri eksik (geçerli 1 km hücre < 5)"
        out[wid] = rec
    meta = {"product": "MYD11A2 v061 (MODIS/Aqua LST/Emissivity 8-Day L3 Global 1km SIN)", "doi": "10.5067/MODIS/MYD11A2.061", "year": 2023, "n_composites": NCOMP,
            "qc_rule": "QC_Day ve QC_Night bit 0-1 == 00 (LAADS MOD11A2 V6.1 spec); kompozit QC'si günlük QC çoğunluğu",
            "cell_rule": f"hücre başına >= {MIN_COMP} geçerli kompozit (işlem seçimi)", "labels": {"observed": "LST_Day_1km, LST_Night_1km", "derived": "dT_dn (yıllık medyan), T_mean2 (yıllık ortalama)",
            "interpretation": "dT_dn günlük aralık vekili (iki örnek); T_mean2 gerçek günlük ortalama değil. Ay Diviner ile eşdeğer nicelik değil."},
            "tiles_used": sorted(ann), "tiles_skipped_incomplete": short, "windows": out}
    json.dump(meta, open("data/thermal_earth.json", "w", encoding="utf-8"), ensure_ascii=False)
    ok = sum(1 for r in out.values() if "dT_dn_K_median" in r)
    print("pencere", len(out), "termal değerli", ok)
