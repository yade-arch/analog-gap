"""SONRADAN YAPILAN KEŞİFSEL ANALİZ: earth_scan.py ile aynı pencereler/kod; referans = Site04, Site01, Site07 ayrı ayrı.
Çıktı: data/windows_earth_sites.parquet (region,row,col + {site}_O_*, {site}_d_*, {site}_D). Ana sıralamayı DEĞİŞTİRMEZ."""
import os, sys, numpy as np, pandas as pd
from multiprocessing import Pool
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import earth_scan as E, terrain as T, sim as S

SITES = ("Site04", "Site01", "Site07")
RF = None


def init():
    global RF
    RF = {}
    for s in SITES:
        z = np.load(f"data_raw/ref_moon_{s}.npz"); RF[s] = S.make_ref({k: z[k] for k in S.VARS})


def task(args):
    code, si = args
    crs, x0, y1, W, H = E.grid_for(code)
    top = y1 - si * E.STEP * 30
    from rasterio.transform import from_origin
    from rasterio.warp import reproject, Resampling
    from pyproj import Transformer
    tr = from_origin(x0, top, 30, 30)
    z = np.full((E.N, W), np.nan, dtype="float32")
    inv = Transformer.from_crs(crs.to_proj4(), "EPSG:4326", always_xy=True)
    pts = [inv.transform(x0 + i * (W * 30) / 20, top - j * (E.N * 30) / 4) for i in range(21) for j in range(5)]
    lats, lons = [p[1] for p in pts], [p[0] for p in pts]
    for name in E.TILES[code]:
        la, lo = E.tile_ll(name)
        if la + 1 < min(lats) - 0.01 or la > max(lats) + 0.01 or lo + 1 < min(lons) - 0.01 or lo > max(lons) + 0.01:
            continue
        h, n = E.load_tile(name)
        st = from_origin(lo - 0.5 / 3600, la + 1 + 0.5 / 3600, 1 / 3600, 1 / 3600)
        reproject(h, z, src_transform=st, src_crs="EPSG:4326", src_nodata=np.nan, dst_transform=tr, dst_crs=crs,
                  dst_nodata=np.nan, resampling=Resampling.average, init_dest_nodata=False)
    if not np.isfinite(z).any():
        return []
    d = T.derive(z)
    recs = []
    for ci, c0 in enumerate(range(0, W - E.N + 1, E.STEP)):
        sl = (slice(0, E.N), slice(c0, c0 + E.N))
        if float(np.isfinite(z[sl]).mean()) < 0.9:
            continue
        pix = {k: d[k][sl] for k in S.VARS}
        rec = {"region": code, "row": si, "col": ci}
        ps = {k: S.pcts(pix[k]) for k in S.VARS}
        if any(p is None for p in ps.values()):
            continue
        for s in SITES:
            ov = {k: S.overlap(ps[k], RF[s][k]["p"]) for k in S.VARS}
            for k in S.VARS:
                rec[f"{s}_O_{k}"] = round(ov[k], 4)
            if min(ov.values()) >= 0.25:
                sc = S.score(pix, RF[s], thr=0.0)
                for k in S.VARS:
                    rec[f"{s}_d_{k}"] = sc["d"][k]
                rec[f"{s}_D"] = sc["D"]
        recs.append(rec)
    return recs


if __name__ == "__main__":
    tasks = []
    for code in E.REG:
        crs, x0, y1, W, H = E.grid_for(code)
        tasks += [(code, si) for si in range(0, (H - E.N) // E.STEP + 1)]
    print("şerit", len(tasks), flush=True)
    with Pool(6, initializer=init) as p:
        out = []
        for i, r in enumerate(p.imap_unordered(task, tasks, chunksize=1)):
            out += r
            if i % 25 == 0:
                print(i, "/", len(tasks), len(out), flush=True)
    df = pd.DataFrame(out)
    df.to_parquet("data/windows_earth_sites.parquet", index=False)
    print(len(df))
