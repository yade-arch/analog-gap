"""Ortak topografya çekirdeği (SPEC §1): 30 m ızgara, Horn 3x3 eğim, röleyf 11x11, pürüzlülük.
Üç cisimde aynı kod. Yükseklikler METRE olmalı."""
import numpy as np
from scipy import ndimage as ndi

PIX = 30.0  # m, ortak ızgara


def horn_slope_deg(z, pix=PIX):
    """Horn (1981) 3x3. Kenar pikselleri NaN. NaN komşusu olan piksel NaN."""
    z = z.astype("float64")
    p = np.pad(z, 1, constant_values=np.nan)
    a, b, c = p[:-2, :-2], p[:-2, 1:-1], p[:-2, 2:]
    d, f = p[1:-1, :-2], p[1:-1, 2:]
    g, h, i = p[2:, :-2], p[2:, 1:-1], p[2:, 2:]
    dzdx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * pix)
    dzdy = ((g + 2 * h + i) - (a + 2 * b + c)) / (8 * pix)   # satır aşağı artar; işaret eğimi etkilemez
    s = np.degrees(np.arctan(np.hypot(dzdx, dzdy)))
    s[0, :] = s[-1, :] = np.nan; s[:, 0] = s[:, -1] = np.nan
    return s


def _nan_filter(z, fn, size):
    """NaN içeren pencereleri NaN yap (sessiz sıfır yok, kural 3)."""
    bad = ndi.maximum_filter(np.isnan(z).astype("u1"), size=size, mode="nearest") > 0
    out = fn(np.where(np.isnan(z), 0, z), size)
    out[bad] = np.nan
    return out


def relief_m(z, size=11):
    """11x11 (330 m) hareketli max-min."""
    zz = np.where(np.isnan(z), np.nan, z)
    bad = ndi.maximum_filter(np.isnan(z).astype("u1"), size=size, mode="nearest") > 0
    zmax = ndi.maximum_filter(np.nan_to_num(zz, nan=-1e30), size=size, mode="nearest")
    zmin = ndi.minimum_filter(np.nan_to_num(zz, nan=1e30), size=size, mode="nearest")
    r = zmax - zmin
    r[bad] = np.nan
    return r


def roughness_m(z, hp=5, rms=11):
    """z - ortalama_5x5(z) (150 m yüksek geçiren) artığının 11x11 hareketli RMS'i."""
    mean5 = _nan_filter(z, lambda a, s: ndi.uniform_filter(a, size=s, mode="nearest"), hp)
    res = z - mean5
    ms = _nan_filter(res ** 2, lambda a, s: ndi.uniform_filter(a, size=s, mode="nearest"), rms)
    return np.sqrt(ms)


def derive(z):
    """Pencere dizisi (m, 30 m) -> dict(slope, relief, rough, valid_fraction)."""
    return {"slope": horn_slope_deg(z), "relief": relief_m(z), "rough": roughness_m(z),
            "valid_fraction": float(np.isfinite(z).mean())}


def summarize(d):
    out = {"valid_fraction": round(d["valid_fraction"], 4)}
    for k in ("slope", "relief", "rough"):
        v = d[k][np.isfinite(d[k])]
        out[k] = {q: round(float(np.percentile(v, p)), 3) for q, p in (("p10", 10), ("p50", 50), ("p90", 90))} if v.size else None
        out[k + "_n"] = int(v.size)
    return out
