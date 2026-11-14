"""Küresel arazi ızgarası (0,25°) — NASA SRTMGL30 v002 (LP DAAC, 30 yay saniyesi ≈ 1 km), 90°K–60°G.
Hücre başına (30×30 piksel): ortalama yükseklik, yükseklik farkı (maks−min), eğim ortancası ve P90 (1 km ızgarada Horn 3×3),
geçerli piksel oranı. Okyanus/boşluk (-9999) sıfır sayılmaz. Çıktı: site/public/data/global_terrain.bin.gz + global_terrain.json.
Not: 1 km eğim, 30 m pencere eğimiyle KARŞILAŞTIRILMAZ (kural 9); yalnızca bölge özeti içindir, arazi uzaklığına girmez.
Kullanım: python scripts/global_terrain.py [--one KARO]   (EARTHDATA_TOKEN ortam değişkeni)
"""
import gzip, io, json, os, sys, zipfile
import numpy as np, requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data_raw", "srtmgl30"); OUT = os.path.join(ROOT, "site", "public", "data")
CMR = "https://cmr.earthdata.nasa.gov/search/granules.json?short_name=SRTMGL30&page_size=50"
STEP = 0.25; PX = 30; NODATA = -9999
NCOL, NROW = int(360 / STEP), int(150 / STEP)            # 90°K .. 60°G
H = {"Authorization": "Bearer " + os.environ.get("EARTHDATA_TOKEN", "")}

def tiles():
    out = []
    for e in requests.get(CMR, timeout=60).json()["feed"]["entry"]:
        url = [l["href"] for l in e["links"] if l["href"].endswith(".zip")][0]
        s, w, n, ea = map(float, e["boxes"][0].split())
        out.append((e["title"], url, s, w, n, ea))
    return out

def get(name, url):
    os.makedirs(RAW, exist_ok=True); p = os.path.join(RAW, os.path.basename(url))
    if not os.path.exists(p):
        r = requests.get(url, headers=H, timeout=600); r.raise_for_status(); open(p, "wb").write(r.content)
    z = zipfile.ZipFile(p); dem = [n for n in z.namelist() if n.lower().endswith(".dem")][0]
    return np.frombuffer(z.read(dem), dtype=">i2")

def slope_deg(z, lat0, rows):
    zf = z.astype(np.float32); zf[(z == NODATA) | (z == 0)] = np.nan   # üründe deniz 0 m kodlu
    dy = 6371000 * np.radians(1 / 120)                    # 30″ kuzey-güney (m)
    lat = lat0 - (np.arange(rows) + 0.5) / 120
    dx = (dy * np.cos(np.radians(lat)))[:, None]
    p = np.pad(zf, 1, mode="edge")
    gx = ((p[:-2, 2:] + 2 * p[1:-1, 2:] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[1:-1, :-2] + p[2:, :-2])) / (8 * dx)
    gy = ((p[2:, :-2] + 2 * p[2:, 1:-1] + p[2:, 2:]) - (p[:-2, :-2] + 2 * p[:-2, 1:-1] + p[:-2, 2:])) / (8 * dy)
    return np.degrees(np.arctan(np.hypot(gx, gy)))

def main():
    one = sys.argv[sys.argv.index("--one") + 1] if "--one" in sys.argv else None
    g = {k: np.full((NROW, NCOL), fill, dt) for k, fill, dt in [("elev", -32768, np.int16), ("relief", 65535, np.uint16), ("s50", 65535, np.uint16), ("s90", 65535, np.uint16), ("valid", 0, np.uint8)]}
    for name, url, s, w, n, e in tiles():
        if one and one.lower() not in name.lower(): continue
        rows, cols = int(round((n - s) * 120)), int(round((e - w) * 120))
        z = get(name, url).reshape(rows, cols)
        sl = slope_deg(z, n, rows)
        r0, c0 = int(round((90 - n) / STEP)), int(round((w + 180) / STEP))
        for i in range(rows // PX):
            if r0 + i >= NROW: break
            zb = z[i * PX:(i + 1) * PX].reshape(PX, cols // PX, PX).swapaxes(0, 1).reshape(cols // PX, -1)
            sb = sl[i * PX:(i + 1) * PX].reshape(PX, cols // PX, PX).swapaxes(0, 1).reshape(cols // PX, -1)
            for j in range(cols // PX):
                v = zb[j][(zb[j] != NODATA) & (zb[j] != 0)]
                if v.size < PX * PX * 0.1: continue                    # %10'dan az kara: değer yok
                ss = sb[j][~np.isnan(sb[j])]
                r, c = r0 + i, (c0 + j) % NCOL
                g["elev"][r, c] = int(round(v.mean())); g["relief"][r, c] = int(v.max() - v.min()); g["valid"][r, c] = int(round(100 * v.size / (PX * PX)))
                if ss.size: g["s50"][r, c] = int(round(np.median(ss) * 10)); g["s90"][r, c] = int(round(np.percentile(ss, 90) * 10))
        print(name, "tamam", flush=True)
    buf = b"".join(g[k].astype(g[k].dtype.newbyteorder("<")).tobytes() for k in ["elev", "relief", "s50", "s90", "valid"])
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, "global_terrain.bin.gz"), "wb").write(gzip.compress(buf, 9))
    meta = {"product": "NASA SRTMGL30 v002 (LP DAAC), 30 yay saniyesi (~1 km)", "doi": "10.5067/MEaSUREs/SRTM/SRTMGL30.002", "step_deg": STEP, "ncol": NCOL, "nrow": NROW,
            "north": 90, "west": -180, "coverage": "90°K–60°G (Antarktika karoları üründe yok)", "layout": "satır ana, kuzeyden güneye, -180'den doğuya; diziler sırayla: elev int16 (m, yok=-32768), relief uint16 (m), s50 uint16 (0,1°), s90 uint16 (0,1°), valid uint8 (%); uint16 yok=65535",
            "method": "hücre = 30×30 piksel; eğim Horn 3×3 (1 km); üründe deniz 0 m kodlu: 0 ve -9999 pikseller dışlanır (deniz seviyesindeki kıyı karaları da dışlanabilir); kara %10'dan azsa değer yok", "note": "1 km eğim 30 m pencere eğimiyle karşılaştırılmaz; arazi uzaklığına girmez", "tiles": len(tiles()) if not one else one}
    json.dump(meta, open(os.path.join(OUT, "global_terrain.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("yazıldı", len(buf), "bayt ham")

if __name__ == "__main__":
    main()
