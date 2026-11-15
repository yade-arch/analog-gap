// NASA GIBS WMS snapshots (MODIS Terra Corrected Reflectance True Color, 250 m, daily since 2000-02-24). Real archive images only.
// Image statistics are simple pixel measures of VISIBLE change (brightness difference, white share); they are not terrain measurements.
export const LAYER = "MODIS_Terra_CorrectedReflectance_TrueColor";
export const SOURCE = "NASA GIBS / Worldview — MODIS Terra Corrected Reflectance (True Color), 250 m";
export const YEARS = Array.from({ length: 2025 - 2001 + 1 }, (_, i) => 2001 + i);
const HALF = 0.3, PX = 384;   // ±0.3° window (~65 km), 384 px

export function gibsUrl(lat, lon, date) {
  const b = [lat - HALF, lon - HALF, lat + HALF, lon + HALF].map((v) => v.toFixed(4)).join(",");
  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${LAYER}&CRS=EPSG:4326&BBOX=${b}&WIDTH=${PX}&HEIGHT=${PX}&FORMAT=image/jpeg&TIME=${date}`;
}

/** -> Promise<{ url, px: Uint8ClampedArray | null, mean, white, empty }> ; empty = no image data for that date (black). */
export function loadShot(url) {
  return new Promise((res) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = 96; const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(img, 0, 0, 96, 96); const px = x.getImageData(0, 0, 96, 96).data;
      let sum = 0, white = 0, dark = 0, n = px.length / 4;
      for (let i = 0; i < px.length; i += 4) { const m = (px[i] + px[i + 1] + px[i + 2]) / 3; sum += m; if (px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200) white++; if (m < 4) dark++; }
      res({ url, px, mean: sum / n, white: white / n, empty: dark / n > 0.5 });
    };
    img.onerror = () => res({ url, px: null, empty: true, err: true });
    img.src = url;
  });
}

/** Mean absolute colour difference between two shots, as % of full scale. */
export function diffPct(a, b) {
  if (!a?.px || !b?.px || a.empty || b.empty) return null;
  let s = 0; for (let i = 0; i < a.px.length; i += 4) s += (Math.abs(a.px[i] - b.px[i]) + Math.abs(a.px[i + 1] - b.px[i + 1]) + Math.abs(a.px[i + 2] - b.px[i + 2])) / 3;
  return (s / (a.px.length / 4) / 255) * 100;
}
