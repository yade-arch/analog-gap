"""Benzerlik çekirdeği (SPEC §3-4). Etiket: Derived Parameter."""
import numpy as np
from scipy.stats import wasserstein_distance

VARS = ("slope", "relief", "rough")
NSUB, SEED = 20000, 42


def valid(a):
    a = np.asarray(a).ravel()
    return a[np.isfinite(a)]


def subsample(v, n=NSUB, seed=SEED):
    v = valid(v)
    if v.size <= n:
        return v
    return np.random.default_rng(seed).choice(v, size=n, replace=False)


def pcts(v):
    v = valid(v)
    return None if v.size == 0 else {p: float(np.percentile(v, p)) for p in (10, 25, 50, 75, 90)}


def overlap(cand_p, ref_p):
    """O_k = |[c10,c90] ∩ [r10,r90]| / (r90-r10)."""
    lo, hi = max(cand_p[10], ref_p[10]), min(cand_p[90], ref_p[90])
    return max(0.0, hi - lo) / (ref_p[90] - ref_p[10])


def d_k(cand_sub, ref_sub, ref_iqr):
    return float(wasserstein_distance(cand_sub, ref_sub) / ref_iqr)


def score(cand, ref, thr=0.5, vars_=VARS):
    """cand/ref: {var: (pixel array)} ; ref: {'full':..., 'sub':..., 'p':...}. Eksik d_k -> D üretilmez (kural 3)."""
    out = {"O": {}, "d": {}, "passes_filter": True, "D": None}
    for k in vars_:
        c = valid(cand[k])
        if c.size == 0:
            out["O"][k] = out["d"][k] = None; out["passes_filter"] = False; continue
        cp = pcts(c)
        o = overlap(cp, ref[k]["p"]); out["O"][k] = round(o, 4)
        out["d"][k] = round(d_k(subsample(c), ref[k]["sub"], ref[k]["p"][75] - ref[k]["p"][25]), 4)
        if o < thr:
            out["passes_filter"] = False
    ds = [out["d"][k] for k in vars_]
    if all(x is not None for x in ds):
        out["D"] = round(float(np.mean(ds)), 4)
    return out


def make_ref(pix):
    """pix: {var: tüm geçerli pikseller}."""
    return {k: {"p": pcts(pix[k]), "sub": subsample(pix[k]), "n": int(valid(pix[k]).size)} for k in VARS}
