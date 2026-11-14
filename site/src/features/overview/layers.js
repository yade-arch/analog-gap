// Map layers drawn ONLY from the real elevation window (DEM). Nothing is invented: no-data cells keep the no-data colour.
// dem = elevation colour ramp per body × hillshade; slope = existing slope classes; aspect = which way slopes face;
// rough = local bumpiness (height minus the 3×3 mean). Colours are a display choice, not data.
import { elev } from "../compare/demLoader.js";
import { buildSlopeCanvas } from "../compare/slopeTexture.js";
import { SETTINGS } from "../../config.js";

export const LAYERS = ["dem", "slope", "aspect", "rough"];
const RAMP = {
  moon: [[0, [52, 52, 56]], [0.5, [128, 128, 132]], [1, [214, 214, 218]]],
  mars: [[0, [92, 40, 22]], [0.5, [170, 86, 44]], [1, [228, 170, 110]]],
  earth: [[0, [46, 92, 52]], [0.35, [104, 132, 70]], [0.7, [150, 118, 82]], [1, [232, 226, 214]]],
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp = (ramp, t) => {
  for (let i = 1; i < ramp.length; i++) if (t <= ramp[i][0]) {
    const [a, ca] = ramp[i - 1], [b, cb] = ramp[i], f = (t - a) / (b - a || 1);
    return ca.map((c, k) => c + (cb[k] - c) * f);
  }
  return ramp[ramp.length - 1][1];
};

function grid(dem) {
  const G = dem.G, z = new Float32Array(G * G);
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < G * G; k++) { const e = elev(dem, k); z[k] = e; if (!Number.isNaN(e)) { lo = Math.min(lo, e); hi = Math.max(hi, e); } }
  return { G, z, lo, hi, cell: dem.idx.cell_m || 90 };
}
const at = (g, i, j) => g.z[Math.max(0, Math.min(g.G - 1, i)) * g.G + Math.max(0, Math.min(g.G - 1, j))];

/** Gradient (east, north) in m/m; NaN where data is missing. */
function grad(g, i, j) {
  const dx = (at(g, i, j + 1) - at(g, i, j - 1)) / (2 * g.cell), dy = (at(g, i - 1, j) - at(g, i + 1, j)) / (2 * g.cell);
  return [dx, dy];
}
const shade = (dx, dy) => { const n = Math.hypot(dx, dy, 1); return Math.max(0.25, Math.min(1.15, (-dx * -0.6 + dy * 0.6 + 1) / n)); };

/** Returns a canvas (G×G for computed layers, larger for the slope layer) to use as a texture. */
export function layerCanvas(dem, layer, body) {
  if (layer === "slope") return buildSlopeCanvas(dem, null);
  const g = grid(dem), c = document.createElement("canvas"); c.width = c.height = g.G;
  const ctx = c.getContext("2d"), img = ctx.createImageData(g.G, g.G), nd = hex(SETTINGS.noDataColor || "#8a94a3");
  for (let i = 0; i < g.G; i++) for (let j = 0; j < g.G; j++) {
    const k = i * g.G + j, o = k * 4, e = g.z[k];
    let rgb = nd;
    if (!Number.isNaN(e)) {
      const [dx, dy] = grad(g, i, j);
      if (layer === "dem") rgb = lerp(RAMP[body] || RAMP.earth, (e - g.lo) / (g.hi - g.lo || 1)).map((v) => v * shade(dx, dy));
      else if (layer === "aspect") {
        const a = Math.atan2(dx, dy), s = Math.min(1, Math.hypot(dx, dy) * 3), h = ((a / (2 * Math.PI)) + 1) % 1;
        rgb = [0, 1, 2].map((n) => { const x = Math.abs(((h * 6 + [0, 4, 2][n]) % 6) - 3) - 1; return 255 * (1 - s + s * Math.max(0, Math.min(1, x))) * 0.92; });
      } else {
        let m = 0, n = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const v = at(g, i + a, j + b); if (!Number.isNaN(v)) { m += v; n++; } }
        const r = Math.min(1, Math.abs(e - m / n) / 15); rgb = [40 + 215 * r, 40 + 215 * r, 48 + 207 * r];
      }
    }
    img.data.set([rgb[0], rgb[1], rgb[2], 255], o);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Elevation along the west→east centre line (metres, NaN = no data) for the profile chart. */
export function centreProfile(dem) {
  const G = dem.G, i = G >> 1;
  return Array.from({ length: G }, (_, j) => elev(dem, i * G + j));
}
