"""Çekirdek test: SP Crater (NASADEM) ve Site04 (LOLA) için 10x10 km, 30 m pencere; P10/P50/P90 özetleri."""
import json, numpy as np, rasterio
from rasterio.transform import from_origin, Affine
from rasterio.warp import reproject, Resampling
from rasterio.crs import CRS
from pathlib import Path
import sys; sys.path.insert(0, str(Path(__file__).parent))
import terrain as T

N = 333                     # 10 km / 30 m
HALF = N * T.PIX / 2


def dst_grid(cx, cy):
    return from_origin(cx - HALF, cy + HALF, T.PIX, T.PIX)


def earth_window(lat, lon, tile_dir="data_raw/nasadem", tile="n35w112"):
    hgt = Path(tile_dir) / f"{tile}.hgt"; num = Path(tile_dir) / f"{tile}.num"
    with rasterio.open(hgt) as ds:
        z = ds.read(1).astype("float32"); tr = ds.transform; crs = ds.crs
    n = np.fromfile(num, dtype="u1").reshape(z.shape)
    z[(z == -32768) | (n == 0)] = np.nan          # boşluk ve su maskelenir
    dcrs = CRS.from_proj4(f"+proj=laea +lat_0={lat} +lon_0={lon} +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs")
    out = np.full((N, N), np.nan, dtype="float32")
    reproject(z, out, src_transform=tr, src_crs=crs, src_nodata=np.nan,
              dst_transform=dst_grid(0, 0), dst_crs=dcrs, dst_nodata=np.nan, resampling=Resampling.average)
    # NUM sınıf oranları (pencere içi; en yakın komşu ile aynı ızgaraya)
    nn = np.zeros((N, N), dtype="float32")
    reproject(n.astype("float32"), nn, src_transform=tr, src_crs=crs, dst_transform=dst_grid(0, 0),
              dst_crs=dcrs, resampling=Resampling.nearest)
    return out, nn


def moon_window(cx, cy, npy="data_raw/lola_pole_40km.npy", half_px=1000):
    a = np.load(npy).astype("float32") * 1000.0   # km -> m
    # pol, 0-tabanlı piksel merkezi ~ (half_px + 0.5); x = (col-1000.5)*20, y_yukarı = -(row-1000.5)*20
    tr = from_origin(-(half_px + 1) * 20.0, (half_px + 1) * 20.0, 20.0, 20.0)
    R = 1737400.0
    crs = CRS.from_proj4(f"+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +x_0=0 +y_0=0 +a={R} +b={R} +units=m +no_defs")
    out = np.full((N, N), np.nan, dtype="float32")
    reproject(a, out, src_transform=tr, src_crs=crs, dst_transform=dst_grid(cx, cy), dst_crs=crs,
              dst_nodata=np.nan, resampling=Resampling.average)
    return out


if __name__ == "__main__":
    res = {}
    z, nn = earth_window(35.58223, -111.63183)
    d = T.derive(z); s = T.summarize(d)
    cls = {"water": (nn == 0), "srtm": (nn >= 1) & (nn <= 23), "fill_or_interp": nn >= 110}
    s["num_class_fraction"] = {k: round(float(v.mean()), 4) for k, v in cls.items()}
    s["z_range_m"] = [round(float(np.nanmin(z)), 1), round(float(np.nanmax(z)), 1)]
    res["EARTH SP Crater NASADEM 30 m"] = s

    refs = json.load(open("data/reference_windows_moon.json"))
    c = refs["Site04"]
    zm = moon_window(c["centroid_x_m"], c["centroid_y_m"])
    sm = T.summarize(T.derive(zm)); sm["z_range_m"] = [round(float(np.nanmin(zm)), 1), round(float(np.nanmax(zm)), 1)]
    sm["stereographic_scale_k_minus_1"] = float((np.radians(90 - abs(c["lat_deg"])) / 2) ** 2)  # yaklaşık k-1 (kutupta k=1)
    res["MOON Site04 LOLA 20->30 m"] = sm
    print(json.dumps(res, indent=1, ensure_ascii=False))
