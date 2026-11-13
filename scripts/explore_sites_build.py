"""SONRADAN YAPILAN KEŞİFSEL ANALİZ (ana sıralamayı değiştirmez): Ay referansı Site01/Site04/Site07 için ayrı ayrı.
Aynı pencere/türetme kodu build_references.py ile (LOLA 20 m -> 30 m, Horn, relief, rough). Çıktı: data_raw/ref_moon_{site}.npz"""
import json, sys, numpy as np
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import terrain as T, sim as S
from window_test import moon_window

refs = json.load(open("data/reference_windows_moon.json"))
for site in ("Site04", "Site01", "Site07"):
    c = refs[site]
    z = moon_window(c["centroid_x_m"], c["centroid_y_m"], npy="data_raw/lola_pole_90km.npy", half_px=2250)
    d = T.derive(z)
    np.savez_compressed(f"data_raw/ref_moon_{site}.npz", **{k: S.valid(d[k]).astype("float32") for k in S.VARS})
    ref = S.make_ref({k: d[k] for k in S.VARS})
    print(site, {k: (round(ref[k]["p"][10], 2), round(ref[k]["p"][50], 2), round(ref[k]["p"][90], 2), "IQR", round(ref[k]["p"][75] - ref[k]["p"][25], 2)) for k in S.VARS})
