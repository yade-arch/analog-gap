"""Tek-karo testi: LOLA LDEM_80S_20M, pol merkezli 40x40 km pencere (HTTP Range, satır satır).
Çıktı: data_raw/lola_pole_40km.npy (float32, km, DN=yükseklik). Token gerekmez."""
import sys, numpy as np, requests
from concurrent.futures import ThreadPoolExecutor

URL = ("https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/"
       "lola_gdr/polar/float_img/ldem_80s_20m_float.img")
N, REC = 30400, 121600            # LBL: LINE_SAMPLES, RECORD_BYTES
HALF = 1000                        # piksel (20 km yarı-genişlik @20 m)
C = 15199.5                        # LBL: LINE/SAMPLE_PROJECTION_OFFSET (1-tabanlı)
c0 = int(round(C - 1))             # 0-tabanlı kutup piksel merkezi ~15198.5 -> 15198/15199
r0, r1 = c0 - HALF, c0 + HALF
s = requests.Session()

def row(i):
    a = i * REC + r0 * 4
    b = i * REC + r1 * 4 - 1
    for _ in range(3):
        r = s.get(URL, headers={"Range": f"bytes={a}-{b}"}, timeout=60)
        if r.status_code == 206 and len(r.content) == (r1 - r0) * 4:
            return np.frombuffer(r.content, dtype="<f4")
    raise RuntimeError(f"satır {i} okunamadı, HTTP {r.status_code}")

with ThreadPoolExecutor(16) as ex:
    rows = list(ex.map(row, range(r0, r1)))
a = np.vstack(rows)
np.save("data_raw/lola_pole_40km.npy", a)
print("shape", a.shape, "min/max km", float(a.min()), float(a.max()), "nan", int(np.isnan(a).sum()))
