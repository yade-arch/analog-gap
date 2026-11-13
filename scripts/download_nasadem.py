"""NASADEM karolarını (zip) data_raw/nasadem_zip/ altına indirir. Token yalnızca ortam değişkeninden okunur; yazdırılmaz/kaydedilmez.
Mevcut ve boyutu doğru dosyalar atlanır (yeniden başlatılabilir)."""
import csv, os, sys, requests
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

out = Path("data_raw/nasadem_zip"); out.mkdir(parents=True, exist_ok=True)
H = {"Authorization": "Bearer " + os.environ["EARTHDATA_TOKEN"]}
rows = list(csv.DictReader(open("data/nasadem_tiles.csv", encoding="utf-8")))


def get(url):
    s = requests.Session()
    r = s.get(url, headers=H, allow_redirects=False, timeout=120)
    for _ in range(6):
        if r.status_code not in (301, 302, 303, 307):
            break
        loc = r.headers["Location"]
        r = s.get(loc, headers=H if ("urs" not in loc and "earthdata" in loc) else None, allow_redirects=False, timeout=300)
    return r


def one(row):
    p = out / (row["granule"] + ".zip")
    if p.exists() and p.stat().st_size > 1000:
        return row["granule"], "var"
    for k in range(3):
        try:
            r = get(row["url"])
            if r.status_code == 200 and len(r.content) > 1000:
                p.write_bytes(r.content); return row["granule"], "ok"
            err = r.status_code
        except Exception as e:
            err = type(e).__name__
    return row["granule"], f"HATA {err}"


with ThreadPoolExecutor(4) as ex:
    res = list(ex.map(one, rows))
bad = [r for r in res if r[1].startswith("HATA")]
print("toplam", len(res), "hata", len(bad), bad[:10])
print("disk MB", round(sum(f.stat().st_size for f in out.glob("*.zip")) / 1e6, 1))
