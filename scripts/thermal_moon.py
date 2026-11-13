"""Ay termal (SPEC 2.3 P1): Diviner PRP south (v2). temp_avg = yüzeyin 2 cm ALTINDA modelden yıllık ortalama (Derived, yüzey değil);
temp_max = yüzey yıllık maksimum (Derived, modelden). Referans pencere = reference_windows_moon.json merkezi, yarıçap r (alanı 10x10 km kareye eşit,
r = 10000/sqrt(pi) = 5642 m; kare yönelimi kutup stereografik eksenine bağlı olduğundan daire kullanıldı). Mesafe: küre R = 1737.4 km, büyük daire.
Girdi: data_raw/prp_polecap.parquet (scripts/prp_stream.py). Çıktı: data/thermal_moon.json"""
import json, numpy as np, pandas as pd

RM = 1737400.0
RAD = 10000 / np.sqrt(np.pi)
df = pd.read_parquet("data_raw/prp_polecap.parquet")
rw = json.load(open("data/reference_moon.json", encoding="utf-8", errors="replace"))["windows"]
la, lo = np.radians(df.tri_clat.to_numpy()), np.radians(df.tri_clon.to_numpy())
out = {}
for w in rw:
    la0, lo0 = np.radians(w["lat"]), np.radians(w["lon_E"])
    c = np.sin(la) * np.sin(la0) + np.cos(la) * np.cos(la0) * np.cos(lo - lo0)
    d = RM * np.arccos(np.clip(c, -1, 1))
    s = df[d <= RAD]
    rec = {"name": w["name"], "n_triangles": int(len(s))}
    if len(s) >= 5:
        for k in ("temp_avg", "temp_max"):
            v = s[k].to_numpy(); v = v[v > 0]
            rec[k + "_K_p10_p50_p90"] = [round(float(np.percentile(v, q)), 1) for q in (10, 50, 90)]
    else:
        rec["status"] = "Veri eksik (üçgen < 5)"
    out[w["id"]] = rec
meta = {"product": "Diviner Polar Resource Product (South) dlre_prp_south.tab, LRO-L-DLRE-5-PRP-V2.0 (oluşturma 2018-02-21)", "provider": "UCLA / PDS Geosciences Node",
        "labels": {"observed": "yok (PRP gözlem değil model uydurması)", "derived": "temp_avg (2 cm derinlik, yıllık ortalama), temp_max (yüzey yıllık maksimum)",
                   "interpretation": "Dünya MODIS LST ile eşdeğer değil: yüzey vs 2 cm derinlik, iki örnek vs model yıllık ortalama"},
        "window_rule": f"daire yarıçap {RAD:.0f} m (10x10 km karenin eşit alanı)", "psr_note": "Site04 penceresi kalıcı gölgeli bölge içerir (L01); sıcaklık dağılımı bu yüzden geniş olabilir",
        "dT_dn_moon": "Veri eksik (P2: PCP ltim kutuları yapılmadı)", "windows": out}
json.dump(meta, open("data/thermal_moon.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=True))
