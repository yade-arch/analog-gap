"""NASADEM tek karo testi: N35W112 (SP Crater çevresi). Token yalnızca ortam değişkeninden okunur, yazdırılmaz/kaydedilmez.
Çıktı: data_raw/nasadem/ altına zip + açılmış dosyalar; ekrana özet istatistik."""
import os, zipfile, io, numpy as np, requests, rasterio
from pathlib import Path

URL = ("https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/"
       "NASADEM_HGT_n35w112/NASADEM_HGT_n35w112.zip")
out = Path("data_raw/nasadem"); out.mkdir(parents=True, exist_ok=True)
zp = out / "NASADEM_HGT_n35w112.zip"

if not zp.exists():
    s = requests.Session()
    # Earthdata yönlendirmesi: Authorization başlığı ana makineye gönderilir, yönlendirmede requests siler -> elle takip
    h = {"Authorization": "Bearer " + os.environ["EARTHDATA_TOKEN"]}
    r = s.get(URL, headers=h, allow_redirects=False, timeout=120)
    hops = 0
    while r.status_code in (301, 302, 303, 307) and hops < 6:
        loc = r.headers["Location"]
        r = s.get(loc, headers=h if "earthdata" in loc and "urs" not in loc else None,
                  allow_redirects=False, timeout=300)
        hops += 1
    print("HTTP", r.status_code, "bytes", len(r.content))
    r.raise_for_status()
    zp.write_bytes(r.content)

with zipfile.ZipFile(zp) as z:
    print([ (i.filename, i.file_size) for i in z.infolist()])
    z.extractall(out)

hgt = next(out.glob("*.hgt"))
with rasterio.open(hgt) as ds:
    print("crs", ds.crs, "shape", ds.shape, "bounds", ds.bounds, "dtype", ds.dtypes[0], "nodata", ds.nodata)
    z = ds.read(1)
print("min/max m", int(z.min()), int(z.max()), "void(-32768) px", int((z == -32768).sum()))
num = next(out.glob("*.num"), None)
if num is not None:
    n = np.fromfile(num, dtype="u1").reshape(z.shape)
    u, c = np.unique(n, return_counts=True)
    print("NUM kodları (kod: oran %):", {int(a): round(100 * b / n.size, 2) for a, b in zip(u, c)})
# SP Crater (GNIS 35.5822, -111.6318): pikseldeki yükseklik
with rasterio.open(hgt) as ds:
    row, col = ds.index(-111.6318207, 35.5822254)
print("SP Crater px", row, col, "z", int(z[row, col]), "m; 5 km civarı min/max", int(z[row-80:row+80, col-80:col+80].min()), int(z[row-80:row+80, col-80:col+80].max()))
