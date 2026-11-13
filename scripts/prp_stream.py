"""Diviner PRP south (dlre_prp_south.tab, 605 MB) akış halinde okunur, diske yazılmaz; yalnızca enlem <= -87 (planetosentrik) satırları tutulur.
Düzen (label/dlre_prp.fmt): 210 bayt sabit kayıt; kayıt 1 = başlık (^TABLE = 2). tri_clon bayt 127 (15), tri_clat 144 (15), tri_calt 161 (15),
temp_avg 178 (8), temp_max 188 (8), ice_depth 198 (11). Çıktı: data_raw/prp_polecap.parquet"""
import numpy as np, pandas as pd, requests

URL = "https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_prp/dlre_prp_south.tab"
REC = 210
COLS = {"tri_clon": (126, 15), "tri_clat": (143, 15), "tri_calt": (160, 15), "temp_avg": (177, 8), "temp_max": (187, 8), "ice_depth": (197, 11)}
keep, nrec, buf, first = [], 0, b"", True
with requests.get(URL, stream=True, timeout=120) as r:
    r.raise_for_status()
    for chunk in r.iter_content(1 << 22):
        buf += chunk
        n = len(buf) // REC
        blk, buf = buf[: n * REC], buf[n * REC:]
        if not n:
            continue
        a = np.frombuffer(blk, dtype="S1").reshape(n, REC)
        if first:
            a, first = a[1:], False                      # başlık kaydı
        nrec += len(a)
        lat = np.array([float(x) for x in a[:, 143:158].view("S15").ravel()])
        sel = lat <= -87.0
        for row in a[sel]:
            keep.append({k: float(row[s:s + w].tobytes()) for k, (s, w) in COLS.items()})
        del a
print("okunan kayıt", nrec, "tutulan", len(keep))
df = pd.DataFrame(keep)
df.to_parquet("data_raw/prp_polecap.parquet", index=False)
print(df.describe().T[["count", "min", "50%", "max"]])
