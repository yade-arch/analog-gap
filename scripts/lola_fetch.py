"""LOLA LDEM_80S_20M: pol merkezli (2*HALF)^2 piksel pencere, HTTP Range. Site07 (~36 km) için HALF=2250 (45 km).
Çıktı: data_raw/lola_pole_90km.npy (float32, km). Token gerekmez."""
import numpy as np, requests
from concurrent.futures import ThreadPoolExecutor

URL = ("https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/"
       "lola_gdr/polar/float_img/ldem_80s_20m_float.img")
REC, HALF = 121600, 2250
c0 = 15198                         # LBL offset 15199.5 (1-tabanlı) -> 0-tabanlı ~15198.5; pencere kutup ~HALF+0.5
r0, r1 = c0 - HALF, c0 + HALF
s = requests.Session()


def row(i):
    a, b = i * REC + r0 * 4, i * REC + r1 * 4 - 1
    for _ in range(4):
        r = s.get(URL, headers={"Range": f"bytes={a}-{b}"}, timeout=90)
        if r.status_code == 206 and len(r.content) == (r1 - r0) * 4:
            return np.frombuffer(r.content, dtype="<f4")
    raise RuntimeError(f"satır {i}: HTTP {r.status_code}")


with ThreadPoolExecutor(16) as ex:
    a = np.vstack(list(ex.map(row, range(r0, r1))))
np.save("data_raw/lola_pole_90km.npy", a)
print(a.shape, float(a.min()), float(a.max()), int(np.isnan(a).sum()))
