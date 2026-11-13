"""SONRADAN YAPILAN KEŞİFSEL ANALİZ: Ay referansı Site04/Site01/Site07 ayrı ayrı -> data/exploratory_moon_sites.json.
Ana sıralama/eşik değişmez. Pozitif kontrolün Ay-profil analogları (K01, K02, K08) iki gösterimle (A: son grup, B: eşleşme yok ayrı)."""
import json, numpy as np, pandas as pd
import sys
sys.path.insert(0, "scripts")
import sim as S

main = pd.read_parquet("data/windows_earth.parquet")[["region", "row", "col"]]
ex = pd.read_parquet("data/windows_earth_sites.parquet")
df = main.merge(ex, on=["region", "row", "col"], how="left")
df["win_id"] = df.region + "_r" + df.row.astype(str) + "_c" + df.col.astype(str)
ctrl = json.load(open("data/controls.json", encoding="utf-8"))["positive_control"]["rows"]
moon_rows = [r for r in ctrl if r.get("profile", "").startswith("Lunar") and r.get("window")]
out = {"sites": {}, "note": "Post-hoc keşifsel analiz; aynı pencereler, aynı O_k/d_k/D kodu; referans yalnızca tek ROI penceresi (≈ 330 K piksel yerine ≈ 110 K piksel). Ana sıralamayı değiştirmez; eşikler (0,25/0,5) değiştirilmedi. n = 3 analog: istatistiksel anlam yok."}
for s in ("Site04", "Site01", "Site07"):
    z = np.load(f"data_raw/ref_moon_{s}.npz"); ref = S.make_ref({k: z[k] for k in S.VARS})
    O = df[[f"{s}_O_{k}" for k in S.VARS]]
    passes = (O >= 0.5).all(axis=1); hasd = df[f"{s}_D"].notna()
    analogs, pa, pb = [], [], []
    for r in moon_rows:
        w = df[df.win_id == r["window"]].iloc[0]
        sub = df[df.region == w.region]; n = len(sub); d = sub[f"{s}_D"]
        if pd.isna(w[f"{s}_D"]):
            nd = int(d.notna().sum()); pc = 100 * (nd + (n - nd) / 2) / n
            analogs.append({"id": r["id"], "name": r["name"], "status": "eşleşme yok (O_k<0.25)", "D": None, "percentile": round(pc, 1)}); pa.append(pc)
        else:
            v = w[f"{s}_D"]; pc = 100 * float((d < v).sum() + 0.5 * (d == v).sum()) / n
            analogs.append({"id": r["id"], "name": r["name"], "status": "eşleşti" + ("" if bool(passes[w.name]) else ", filtreyi geçmedi (O_k<0.5)"), "D": round(float(v), 4), "percentile": round(pc, 1)}); pa.append(pc); pb.append(pc)
    out["sites"][s] = {"reference": {k: [round(ref[k]["p"][q], 2) for q in (10, 50, 90)] for k in S.VARS},
                        "n_with_D": int(hasd.sum()), "n_pass_filter": int(passes.sum()), "analogs": analogs,
                        "median_A": round(float(np.median(pa)), 1) if pa else None, "median_B": round(float(np.median(pb)), 1) if pb else None, "n_matched": len(pb)}
    print(s, out["sites"][s]["n_pass_filter"], out["sites"][s]["n_with_D"], [(a["id"], a["status"], a["percentile"]) for a in analogs])
json.dump(out, open("data/exploratory_moon_sites.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
