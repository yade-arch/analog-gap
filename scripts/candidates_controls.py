"""windows_earth.parquet -> candidates_{moon,mars}.geojson + controls.json (SPEC 3, 4, 7.1, 7.2).
Çalıştır (proje kökünden): .venv\\Scripts\\python.exe -I scripts\\candidates_controls.py
Kural 3: D yoksa sıralama yok; kural 5: 'keşfedilmemiş' denmez; kural 6: coverage/reliability ayrı alanlar."""
import csv, json, sys, numpy as np, pandas as pd
from pathlib import Path
from pyproj import Transformer
from scipy.stats import mannwhitneyu
sys.path.insert(0, str(Path(__file__).parent))
import earth_scan as E

df = pd.read_parquet("data/windows_earth.parquet")
VARS = ("slope", "relief", "rough")
PROF = {"moon": "Lunar Base Analogs (Shackleton çevresi)", "mars": "Martian Landing & Exploration (Jezero)"}
THR = 0.5
TOPN = 250   # web için: bölge başına en iyi 250 (tam sıralama parquet'te; sayılar meta'da)
HALF = 5000.0
df["win_id"] = df.region + "_r" + df.row.astype(str) + "_c" + df.col.astype(str)

# ---- pencere poligonları (bölge LAEA ızgarasında 10x10 km, WGS84'e geri çevrilir)
geo = {}
for code in df.region.unique():
    crs, x0, y1, W, H = E.grid_for(code)
    inv = Transformer.from_crs(crs.to_proj4(), "EPSG:4326", always_xy=True)
    geo[code] = (x0, y1, inv)


def polygon(r):
    x0, y1, inv = geo[r.region]
    top = y1 - r.row * E.STEP * 30
    cx, cy = x0 + (r.col * E.STEP + E.N / 2) * 30, top - E.N / 2 * 30
    ring = [inv.transform(cx + sx * HALF, cy + sy * HALF) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1))]
    return [[round(a, 5), round(b, 5)] for a, b in ring]


def f(v):
    return None if pd.isna(v) else round(float(v), 4)


for prof in ("moon", "mars"):
    O = df[[f"{prof}_O_{k}" for k in VARS]]
    df[f"{prof}_passes"] = (O >= THR).all(axis=1)
    df[f"{prof}_hasD"] = df[f"{prof}_D"].notna()
    ok = df[df[f"{prof}_passes"]].sort_values(f"{prof}_D")
    df.loc[ok.index, f"{prof}_rank"] = np.arange(1, len(ok) + 1)

    feats = []
    sel = df[df[f"{prof}_passes"]].sort_values(f"{prof}_rank").groupby("region").head(TOPN)
    for r in sel.itertuples():
        p = r._asdict()
        props = {
            "id": r.win_id, "region": r.region, "profile": PROF[prof],
            "center_lat": r.lat, "center_lon": r.lon,
            "passes_filter": bool(getattr(r, f"{prof}_passes")),
            "rank": None if pd.isna(p[f"{prof}_rank"]) else int(p[f"{prof}_rank"]),
            "D": f(p[f"{prof}_D"]),
            "d": {k: f(p[f"{prof}_d_{k}"]) for k in VARS},
            "O": {k: f(p[f"{prof}_O_{k}"]) for k in VARS},
            "derived_percentiles": {k: {"p10": f(p[f"{k}_p10"]), "p50": f(p[f"{k}_p50"]), "p90": f(p[f"{k}_p90"])} for k in VARS},
            "evidence_coverage": {"valid_pixel_fraction": r.valid_fraction, "nasadem_srtm_fraction": r.num_srtm},
            "evidence_reliability": {"nasadem_fill_or_interp_fraction": r.num_fill,
                                     "note": "NASADEM_HGT v001 30 m; SRTM düşey gürültüsü pürüzlülükte baskın olabilir (L02)"},
            "labels": {"observed": "NASADEM yüksekliği", "derived": "eğim (Horn 3x3, 30 m), röleyf 11x11, pürüzlülük, O_k, d_k, D",
                       "interpretation": "Yalnızca topografik dağılım yakınlığı; termal, regolit, spektral, atmosfer, yerçekimi karşılaştırılamaz (Gap paneli)"},
        }
        feats.append({"type": "Feature", "properties": props,
                      "geometry": {"type": "Polygon", "coordinates": [polygon(r)]}})
    meta = {"profile": PROF[prof], "filter": f"O_k >= {THR} her topografik değişkende (SPEC 3.3)",
            "formula": "d_k = W1(aday_k, ref_k) / IQR(ref_k); D = ortalama(d_slope, d_relief, d_rough), eşit ağırlık; düşük = daha yakın",
            "n_windows_total": int(len(df)), "n_with_D_(all_O>=0.25)": int(df[f"{prof}_hasD"].sum()),
            "n_pass_filter": int(df[f"{prof}_passes"].sum()),
            "shipped": f"bölge başına en iyi {TOPN} filtreyi geçen pencere (boyut sınırı); tam sıralama data/windows_earth.parquet + betikten yeniden üretilir", "note": "Dosyada yalnızca filtreyi geçen en iyi pencereler var; filtre dışı ve O_k<0.25 pencereler yok (sayıları n_windows_total ve n_pass_filter ile fark).",
            "generated": "2026-11-13"}
    json.dump({"type": "FeatureCollection", "meta": meta, "features": feats}, open(f"data/candidates_{prof}.geojson", "w", encoding="utf-8"), ensure_ascii=False)
    print(prof, meta["n_with_D_(all_O>=0.25)"], "D'li,", meta["n_pass_filter"], "filtreyi geçen /", len(df), "pencere")
    print(df[df[f"{prof}_passes"]].groupby("region").size().to_dict())


# ---- yüzdelik: bölge içi D sıralaması, D'si olmayan pencereler son grupta (ortak ortalama sıra)
def pct_in_region(region, prof, idx):
    sub = df[df.region == region]
    d = sub[f"{prof}_D"]
    v = df.loc[idx, f"{prof}_D"]
    n = len(sub)
    if pd.isna(v):
        nd = int(d.notna().sum())
        return 100 * (nd + (n - nd) / 2) / n, False
    return 100 * float((d < v).sum() + 0.5 * (d == v).sum()) / n, True


def win_containing(region, lat, lon):
    sub = df[df.region == region]
    x0, y1, inv = geo[region]
    crs = E.grid_for(region)[0]
    tf = Transformer.from_crs("EPSG:4326", crs.to_proj4(), always_xy=True)
    x, y = tf.transform(lon, lat)
    best = None
    for i, r in sub.iterrows():
        top = y1 - r.row * E.STEP * 30
        cx, cy = x0 + (r.col * E.STEP + E.N / 2) * 30, top - E.N / 2 * 30
        dd = max(abs(x - cx), abs(y - cy))
        if dd <= HALF and (best is None or dd < best[0]):
            best = (dd, i)
    return None if best is None else best[1]


rows, pcts_a = [], {"moon": [], "mars": []}
for a in csv.DictReader(open("known_analogs.csv", encoding="utf-8")):
    if not a["lat"]:
        rows.append({"id": a["id"], "name": a["name"], "status": "koordinat yok (kaynak bekliyor), teste girmedi"}); continue
    prof = "moon" if a["profile"].startswith("Lunar") else "mars"
    idx = win_containing(a["region"], float(a["lat"]), float(a["lon"]))
    if idx is None:
        rows.append({"id": a["id"], "name": a["name"], "region": a["region"], "status": "nokta geçerli pencere içinde değil (su/boşluk maskesi veya <%90 geçerli piksel)"}); continue
    pc, hasd = pct_in_region(a["region"], prof, idx)
    w = df.loc[idx]
    rows.append({"id": a["id"], "name": a["name"], "region": a["region"], "profile": PROF[prof], "window": w.win_id,
                 "D": f(w[f"{prof}_D"]), "has_D": hasd, "O": {k: f(w[f"{prof}_O_{k}"]) for k in VARS},
                 "percentile_in_region": round(pc, 1), "passes_filter": bool(w[f"{prof}_passes"]),
                 "match_status": ("eşleşme yok (O_k<0.25)" if not hasd else ("eşleşti, filtreyi geçti" if bool(w[f"{prof}_passes"]) else "D var, filtreyi geçmedi (O_k<0.5)")),
                 "percentile_matched_only": round(pc, 1) if hasd else None,
                 "coord_source": a["coord_source"][:80], "status_in_csv": a["status"]})
    pcts_a[prof].append(pc)

# ---- negatif kontrol: bölge başına 200 rastgele pencere (seed 42), tüm bölge pencerelerinden
rng = np.random.default_rng(42)
neg, neg_pcts = {}, {"moon": [], "mars": []}
for code in df.region.unique():
    idxs = df.index[df.region == code].to_numpy()
    pick = rng.choice(idxs, size=min(200, len(idxs)), replace=False)
    for prof in ("moon", "mars"):
        Ds = df.loc[pick, f"{prof}_D"]
        pcs = [pct_in_region(code, prof, i)[0] for i in pick]
        neg_pcts[prof] += pcs
        neg.setdefault(code, {})[prof] = {
            "n_random": int(len(pick)), "n_with_D": int(Ds.notna().sum()), "n_pass_filter": int(df.loc[pick, f"{prof}_passes"].sum()),
            "D_percentiles_(P10,P50,P90)": None if Ds.notna().sum() < 3 else [round(float(np.nanpercentile(Ds, q)), 3) for q in (10, 50, 90)]}

flat = df[df.slope_p90 < 2.0]
flat_res = {}
for prof in ("moon", "mars"):
    pcs = [pct_in_region(r.region, prof, i)[0] if pd.notna(r[f"{prof}_D"]) else 100.0 for i, r in flat.iterrows()]  # D yok = sıralanmadı = en sonda
    flat_res[prof] = {"n_flat_windows": int(len(flat)), "n_with_D": int(flat[f"{prof}_D"].notna().sum()),
                      "n_in_last_quarter_(percentile>=75)": int(sum(p >= 75 for p in pcs)),
                      "n_pass_filter": int(flat[f"{prof}_passes"].sum()),
                      "expectation": "Shackleton profilinde son çeyrekte olmaları beklenir (SPEC 7.2); düşmezse uyarı" if prof == "moon" else "bilgi amaçlı"}
flat_warn = flat_res["moon"]["n_in_last_quarter_(percentile>=75)"] < flat_res["moon"]["n_flat_windows"]
flat_res["moon"]["warning"] = bool(flat_warn)

allp = pcts_a["moon"] + pcts_a["mars"]
mw = None
if allp:
    null = neg_pcts["moon"] + neg_pcts["mars"]
    u = mannwhitneyu(allp, null, alternative="less")
    mw = {"n_analog": len(allp), "n_random": len(null), "U": float(u.statistic), "p_one_sided_(analog_lower_D_percentile)": round(float(u.pvalue), 4)}

controls = {
    "version": "0.1", "generated": "2026-11-13",
    "positive_control": {
        "n_rows_in_csv": len(rows), "n_tested": len(allp),
        "median_percentile": None if not allp else round(float(np.median(allp)), 1),
        "success_criterion": "medyan yüzdelik <= 20 (SPEC 7.1)",
        "criterion_met": None if not allp else bool(np.median(allp) <= 20),
        "mann_whitney": mw, "rows": rows,
        "two_views": {
            "view_A_no_match_counted_as_last_group": {"n": len(allp), "median_percentile": None if not allp else round(float(np.median(allp)), 1),
                                                      "note": "D'si olmayan analog, D'si olmayan pencerelerin ortak ortalama sırasını (74,5) alır"},
            "view_B_no_match_reported_separately": {
                "n_tested": len(allp), "n_matched_D_available": int(sum(1 for r in rows if r.get("has_D"))),
                "n_no_match_O_lt_0.25": int(sum(1 for r in rows if r.get("has_D") is False)),
                "no_match_rows": [r["id"] + " " + r["name"] for r in rows if r.get("has_D") is False],
                "matched_percentiles": {r["id"] + " " + r["name"]: r["percentile_in_region"] for r in rows if r.get("has_D")},
                "median_percentile_matched_only": (lambda v: None if not v else round(float(np.median(v)), 1))([r["percentile_in_region"] for r in rows if r.get("has_D")]),
                "note": "n_matched çok küçük; medyan istatistiksel anlam taşımaz. 'Eşleşme yok' bir sıralama sonucu değil, referansla örtüşme olmadığı bilgisidir."}},
        "WARNING": "n=6 koordinatlı satır; Atacama 0, HAW 1, ANA 1. Bölge dağılımı dengesiz, istatistiksel güç zayıf. Geçse bile 'yöntem doğrulandı' denmez; HI-SEAS ve MDRS koordinatları zayıf kaynaklı. Bilinen analogların bir kısmı topografya dışı nedenlerle seçilmiştir.",
        "percentile_definition": "analog noktasını içeren pencerenin bölgesindeki tüm pencereler arasında D'ye göre yüzdelik sırası (düşük = iyi); D'si olmayan pencereler son grupta ortak ortalama sıra alır."},
    "negative_control": {"per_region": neg, "flat_windows_slope_p90_lt_2deg": flat_res},
    "note": "Pencereler %50 örtüşür; komşu pencereler bağımsız değildir, p değerleri iyimser olabilir."}
json.dump(controls, open("data/controls.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({k: controls["positive_control"][k] for k in ("n_tested", "median_percentile", "criterion_met", "mann_whitney")}))
print(json.dumps(neg))
print(json.dumps(flat_res))

