// Global elevation adapter: AWS Terrain Tiles (Terrarium PNG, AWS Open Data; mostly NASA SRTM 30 m, other sources in places).
// Not the NASADEM pipeline -> results are labelled "approximate". Runs inside pointWorker.js (fetch + decode + resample).
// Window: N×N cells of 30 m (10 km + 8-cell margin) on a local east/north grid centred on the point. Each 30 m cell is the
// mean of k×k bilinear samples of the Web Mercator tile pixels (k ≈ 30 m / tile pixel), so finer sources are averaged to ~30 m.
// Heights <= 0 m are treated as sea (the tiles include sea-floor depths), i.e. "no land data", never zero.
import { N, PIX } from "./landform.js";

export const TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
export const SOURCE = "Terrain Tiles (AWS Open Data, Terrarium; mostly NASA SRTM)";
export const MERC_MAX = 85.0511, SRTM_N = 60, SRTM_S = -56;
const A = 6378137, E2 = 0.00669437999014, D2R = Math.PI / 180;
const tiles = new Map();

/** Tile zoom whose ground pixel is <= 30 m at this latitude (z12–z14). */
export function zoomFor(lat) {
  const px0 = 2 * Math.PI * A * Math.cos(lat * D2R) / 256;
  return Math.min(14, Math.max(12, Math.ceil(Math.log2(px0 / PIX))));
}
export const groundPix = (lat, z) => 2 * Math.PI * A * Math.cos(lat * D2R) / (256 * 2 ** z);

async function decode(blob) {
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const cv = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(256, 256) : Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0); bmp.close?.();
  const px = ctx.getImageData(0, 0, 256, 256).data, h = new Float32Array(256 * 256);
  for (let i = 0; i < h.length; i++) h[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
  return h;
}

function getTile(z, x, y) {
  const n = 2 ** z, xx = ((x % n) + n) % n, key = `${z}/${xx}/${y}`;
  if (!tiles.has(key)) {
    tiles.set(key, fetch(TILE_URL.replace("{z}", z).replace("{x}", xx).replace("{y}", y))
      .then((r) => { if (!r.ok) throw new Error(`Terrain tile ${key}: HTTP ${r.status}`); return r.blob(); }).then(decode)
      .catch((e) => { tiles.delete(key); throw e; }));
  }
  return tiles.get(key);
}

/** Point (lat, lon) + east/north offsets in metres -> lat/lon (WGS84 radii of curvature at lat0). */
function offset(lat0, lon0, e, nth) {
  const s = Math.sin(lat0 * D2R), w = 1 - E2 * s * s, M = A * (1 - E2) / w ** 1.5, Nr = A / Math.sqrt(w);
  return [lat0 + nth / M / D2R, lon0 + e / (Nr * Math.cos(lat0 * D2R)) / D2R];
}
const mercX = (lon, z) => (lon + 180) / 360 * 256 * 2 ** z;
const mercY = (lat, z) => { const p = lat * D2R; return (1 - Math.log(Math.tan(p) + 1 / Math.cos(p)) / Math.PI) / 2 * 256 * 2 ** z; };

/** -> { z: Float64Array N×N (NaN = no land data), zoom, srcPix, k, tiles } or { missing: "polar" }. */
export async function fetchWindow(lat, lon) {
  if (Math.abs(lat) > MERC_MAX - 0.1) return { missing: "polar" };
  const zoom = zoomFor(lat), srcPix = groundPix(lat, zoom), k = Math.max(1, Math.round(PIX / srcPix)), half = (N * PIX) / 2;
  const corners = [[-half, -half], [half, -half], [-half, half], [half, half]].map(([e, n]) => offset(lat, lon, e, n));
  const X = corners.map(([, lo]) => mercX(lo, zoom)), Y = corners.map(([la]) => mercY(la, zoom));
  const tx0 = Math.floor((Math.min(...X) - 2) / 256), tx1 = Math.floor((Math.max(...X) + 2) / 256);
  const ty0 = Math.floor((Math.min(...Y) - 2) / 256), ty1 = Math.floor((Math.max(...Y) + 2) / 256);
  const W = (tx1 - tx0 + 1) * 256, H = (ty1 - ty0 + 1) * 256, mos = new Float32Array(W * H);
  const jobs = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push(getTile(zoom, tx, ty).then((h) => {
    const ox = (tx - tx0) * 256, oy = (ty - ty0) * 256;
    for (let r = 0; r < 256; r++) mos.set(h.subarray(r * 256, r * 256 + 256), (oy + r) * W + ox);
  }));
  await Promise.all(jobs);
  const at = (u, v) => {                                   // bilinear on pixel centres; any sea (<= 0 m) corner -> NaN
    const x = u - tx0 * 256 - 0.5, y = v - ty0 * 256 - 0.5, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    if (i < 0 || j < 0 || i + 1 >= W || j + 1 >= H) return NaN;
    const a = mos[j * W + i], b = mos[j * W + i + 1], c = mos[(j + 1) * W + i], d = mos[(j + 1) * W + i + 1];
    if (a <= 0 || b <= 0 || c <= 0 || d <= 0) return NaN;
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };
  const z = new Float64Array(N * N), c0 = (N - 1) / 2;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let s = 0;
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const [la, lo] = offset(lat, lon, (c - c0 + (j + 0.5) / k - 0.5) * PIX, (c0 - r - (i + 0.5) / k + 0.5) * PIX);
      s += at(mercX(lo, zoom), mercY(la, zoom));
    }
    z[r * N + c] = s / (k * k);                             // NaN if any sub-sample is sea
  }
  return { z, zoom, srcPix, k, tiles: jobs.length };
}
