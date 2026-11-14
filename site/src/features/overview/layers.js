// Map layers drawn ONLY from the real elevation window (DEM, 90 m display grid). Between grid points values are
// bilinearly interpolated (smoothing for display; no new detail is invented). No-data cells keep the no-data colour.
// dem = elevation colour ramp per body (+ rock tint on steep Earth slopes) × hillshade; slope = existing slope classes;
// aspect = which way slopes face; rough = local bumpiness. Colours are a display choice, not data.
import { elev } from "../compare/demLoader.js";
import { buildSlopeCanvas } from "../compare/slopeTexture.js";
import { SETTINGS } from "../../config.js";

export const LAYERS = ["dem", "slope", "aspect", "rough"];
export const UP = 6;                                   // texture pixels per 90 m grid step
const RAMP = {
  moon: [[0, [70, 70, 74]], [0.5, [140, 140, 144]], [1, [222, 222, 226]]],
  mars: [[0, [110, 48, 26]], [0.5, [180, 96, 52]], [1, [232, 178, 120]]],
  earth: [[0, [58, 104, 58]], [0.3, [112, 140, 74]], [0.65, [164, 130, 90]], [1, [236, 230, 218]]],
};
const ROCK = { earth: [128, 104, 84], moon: [96, 96, 100], mars: [140, 70, 40] };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp = (ramp, t) => {
  for (let i = 1; i < ramp.length; i++) if (t <= ramp[i][0]) {
    const [a, ca] = ramp[i - 1], [b, cb] = ramp[i], f = (t - a) / (b - a || 1);
    return ca.map((c, k) => c + (cb[k] - c) * f);
  }
  return ramp[ramp.length - 1][1];
};

export function grid(dem) {
  const G = dem.G, z = new Float32Array(G * G);
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < G * G; k++) { const e = elev(dem, k); z[k] = e; if (!Number.isNaN(e)) { lo = Math.min(lo, e); hi = Math.max(hi, e); } }
  return { G, z, lo, hi, cell: dem.idx.cell_m || 90 };
}
/** Bilinear elevation at fractional grid position (fi = row, fj = column); NaN if any corner is missing. */
export function zAt(g, fi, fj) {
  const G = g.G, i0 = Math.max(0, Math.min(G - 2, Math.floor(fi))), j0 = Math.max(0, Math.min(G - 2, Math.floor(fj)));
  const a = Math.min(1, Math.max(0, fi - i0)), b = Math.min(1, Math.max(0, fj - j0)), z = g.z, k = i0 * G + j0;
  return (z[k] * (1 - b) + z[k + 1] * b) * (1 - a) + (z[k + G] * (1 - b) + z[k + G + 1] * b) * a;
}

/** Returns a canvas to use as a texture ((G−1)·UP+1 px for computed layers; the slope layer keeps its class canvas). */
export function layerCanvas(dem, layer, body) {
  if (layer === "slope") return buildSlopeCanvas(dem, null);
  const g = grid(dem), N = (g.G - 1) * UP + 1, c = document.createElement("canvas"); c.width = c.height = N;
  const ctx = c.getContext("2d"), img = ctx.createImageData(N, N), nd = hex(SETTINGS.noDataColor || "#8a94a3"), st = g.cell / UP;
  const ramp = RAMP[body] || RAMP.earth, rock = ROCK[body] || ROCK.earth;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const fi = y / UP, fj = x / UP, e = zAt(g, fi, fj), o = (y * N + x) * 4;
    let rgb = nd;
    if (!Number.isNaN(e)) {
      const d = 1 / UP, dx = (zAt(g, fi, fj + d) - zAt(g, fi, fj - d)) / (2 * st), dy = (zAt(g, fi - d, fj) - zAt(g, fi + d, fj)) / (2 * st);
      const s = Number.isNaN(dx + dy) ? 0 : Math.hypot(dx, dy), n = Math.hypot(dx, dy, 1);
      const shade = Number.isNaN(dx + dy) ? 0.8 : Math.max(0.3, Math.min(1.25, (dx * 0.55 + dy * 0.55 + 0.9) / n));
      if (layer === "dem") {
        const base = lerp(ramp, (e - g.lo) / (g.hi - g.lo || 1)), r = Math.min(0.7, Math.max(0, (s - 0.25) * 1.4));
        rgb = base.map((v, k) => (v * (1 - r) + rock[k] * r) * shade);
      } else if (layer === "aspect") {
        const h = ((Math.atan2(dx, dy) / (2 * Math.PI)) + 1) % 1, sat = Math.min(1, s * 3);
        rgb = [0, 1, 2].map((m) => { const q = Math.abs(((h * 6 + [0, 4, 2][m]) % 6) - 3) - 1; return 255 * (1 - sat + sat * Math.max(0, Math.min(1, q))) * 0.92; });
      } else {
        let m = 0, cnt = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = zAt(g, fi + a, fj + b); if (!Number.isNaN(v)) { m += v; cnt++; } }
        const r = Math.min(1, Math.abs(e - m / cnt) / 15); rgb = [40 + 215 * r, 40 + 215 * r, 48 + 207 * r];
      }
    }
    img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Elevation along the west→east centre line (metres, NaN = no data) for the profile chart. */
export function centreProfile(dem) {
  const G = dem.G, i = G >> 1;
  return Array.from({ length: G }, (_, j) => elev(dem, i * G + j));
}
