// Landform measures for an on-demand 10×10 km window (same recipe as scripts/terrain.py + scripts/sim.py, in JS).
// Input: square Float64Array z (metres, NaN = no land data) on a 30 m grid of side n = WIN + 2*PAD.
// slope = Horn 3×3; relief = 11×11 max−min; roughness = 11×11 RMS of (z − 5×5 mean). Any NaN inside a filter window -> NaN (no silent zero).
// Distance: d_k = W1(window_k, reference_k) / IQR(reference_k); D = mean of the three d_k. The reference is only available as
// a histogram (reference_*.json), so W1 is computed against that histogram with values spread evenly inside each bin.
export const PIX = 30, WIN = 333, PAD = 8, N = WIN + 2 * PAD, VARS = ["slope", "relief", "rough"];

function horn(z, n) {
  const s = new Float64Array(n * n).fill(NaN);
  for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) {
    const k = r * n + c, a = z[k - n - 1], b = z[k - n], cc = z[k - n + 1], d = z[k - 1], f = z[k + 1], g = z[k + n - 1], h = z[k + n], i = z[k + n + 1];
    const dx = ((cc + 2 * f + i) - (a + 2 * d + g)) / (8 * PIX), dy = ((g + 2 * h + i) - (a + 2 * b + cc)) / (8 * PIX);
    s[k] = Math.atan(Math.hypot(dx, dy)) * 180 / Math.PI;     // NaN neighbour -> NaN
  }
  return s;
}

/** Separable moving filter with edge clamping ("nearest"); op = "sum" | "max" | "min". */
function sep(src, n, rad, op) {
  const init = op === "sum" ? 0 : op === "max" ? -Infinity : Infinity;
  const f = op === "sum" ? (x, y) => x + y : op === "max" ? Math.max : Math.min;
  const pass = (a, horiz) => {
    const o = new Float64Array(n * n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      let acc = init;
      for (let j = -rad; j <= rad; j++) {
        const cc = Math.min(n - 1, Math.max(0, (horiz ? c : r) + j));
        acc = f(acc, horiz ? a[r * n + cc] : a[cc * n + c]);
      }
      o[r * n + c] = acc;
    }
    return o;
  };
  return pass(pass(src, true), false);
}

const nanMask = (a) => a.map((v) => (Number.isNaN(v) ? 1 : 0));
const zeroNaN = (a) => a.map((v) => (Number.isNaN(v) ? 0 : v));

function relief(z, n) {
  const bad = sep(nanMask(z), n, 5, "sum"), mx = sep(z.map((v) => (Number.isNaN(v) ? -1e30 : v)), n, 5, "max"), mn = sep(z.map((v) => (Number.isNaN(v) ? 1e30 : v)), n, 5, "min");
  return mx.map((v, k) => (bad[k] > 0 ? NaN : v - mn[k]));
}

function uniformNaN(a, n, rad) {
  const bad = sep(nanMask(a), n, rad, "sum"), s = sep(zeroNaN(a), n, rad, "sum"), w = (2 * rad + 1) ** 2;
  return s.map((v, k) => (bad[k] > 0 ? NaN : v / w));
}

function rough(z, n) {
  const m5 = uniformNaN(z, n, 2), res2 = z.map((v, k) => (v - m5[k]) ** 2);
  return uniformNaN(res2, n, 5).map(Math.sqrt);
}

/** Central WIN×WIN cut of a padded grid. */
export const crop = (a, n = N) => { const o = new Float64Array(WIN * WIN); for (let r = 0; r < WIN; r++) for (let c = 0; c < WIN; c++) o[r * WIN + c] = a[(r + PAD) * n + c + PAD]; return o; };
const sortedValid = (a) => Float64Array.from(a.filter((v) => Number.isFinite(v))).sort();

/** numpy.percentile (linear) on a sorted array. */
export function pct(s, p) {
  if (!s.length) return null;
  const x = (s.length - 1) * p / 100, i = Math.floor(x), f = x - i;
  return i + 1 < s.length ? s[i] + f * (s[i + 1] - s[i]) : s[i];
}

/** W1 between sorted samples s and a histogram (counts, edges) with mass spread evenly in each bin. Exact for that model. */
export function w1Hist(s, counts, edges) {
  const tot = counts.reduce((a, b) => a + b, 0), cum = [0];
  for (const c of counts) cum.push(cum[cum.length - 1] + c / tot);
  const Fr = (x) => {
    if (x <= edges[0]) return 0; if (x >= edges[edges.length - 1]) return 1;
    let j = 0; while (edges[j + 1] < x) j++;
    return cum[j] + (cum[j + 1] - cum[j]) * (x - edges[j]) / (edges[j + 1] - edges[j]);
  };
  const pts = Float64Array.from([...s, ...edges]).sort(), n = s.length;
  let w = 0, k = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1]; if (b <= a) { while (k < n && s[k] <= a) k++; continue; }
    while (k < n && s[k] <= a) k++;
    const C = k / n, u = C - Fr(a), v = C - Fr(b);
    w += u * v >= 0 ? (b - a) * Math.abs((u + v) / 2) : (b - a) * (u * u + v * v) / (2 * (Math.abs(u) + Math.abs(v)));
  }
  return w;
}

/** O_k = |[c10,c90] ∩ [r10,r90]| / (r90 − r10). */
export const overlap = (c, r) => Math.max(0, Math.min(c.p90, r.p90) - Math.max(c.p10, r.p10)) / (r.p90 - r.p10);

/** z (padded, n×n) -> per-variable sorted values of the central window + the 30 m slope grid (for the 3D view). */
export function derive(z, n = N) {
  const slope = horn(z, n), F = { slope, relief: relief(z, n), rough: rough(z, n) };
  const zc = crop(z, n), valid = zc.filter((v) => Number.isFinite(v)).length / zc.length;
  const vals = Object.fromEntries(VARS.map((k) => [k, sortedValid(crop(F[k], n))]));
  const P = Object.fromEntries(VARS.map((k) => [k, vals[k].length ? { p10: pct(vals[k], 10), p25: pct(vals[k], 25), p50: pct(vals[k], 50), p75: pct(vals[k], 75), p90: pct(vals[k], 90), n: vals[k].length } : null]));
  return { vals, P, valid, z: zc, slope: crop(slope, n) };
}

/** Distance to one reference ({variables:{k:{p10,p90,iqr,hist_counts,hist_bins}}}). Rules as in the shipped pipeline. */
export function score(dv, ref) {
  const out = { O: {}, d: {}, D: null, passes: false, reason: null };
  if (dv.valid < 0.9) return { ...out, reason: "land" };
  for (const k of VARS) { const r = ref.variables[k], c = dv.P[k]; out.O[k] = c ? overlap(c, r) : null; }
  if (VARS.some((k) => out.O[k] == null)) return { ...out, reason: "land" };
  if (VARS.some((k) => out.O[k] < 0.25)) return { ...out, reason: "overlap" };
  for (const k of VARS) { const r = ref.variables[k]; out.d[k] = w1Hist(dv.vals[k], r.hist_counts, r.hist_bins) / r.iqr; }
  out.D = VARS.reduce((a, k) => a + out.d[k], 0) / VARS.length;
  out.passes = VARS.every((k) => out.O[k] >= 0.5);
  return out;
}

/** 90 m display grid shaped like loadDem(): 3×3 mean (≥ 5 valid of 9), slope in 0.25° steps (255 = none). */
export function dem90(dv, id) {
  const G = WIN / 3, z = new Int16Array(G * G), sl = new Uint8Array(G * G);
  let lo = Infinity, hi = -Infinity;
  for (let r = 0; r < G; r++) for (let c = 0; c < G; c++) {
    let sz = 0, nz = 0, ss = 0, ns = 0;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const k = (r * 3 + i) * WIN + c * 3 + j;
      if (Number.isFinite(dv.z[k])) { sz += dv.z[k]; nz++; }
      if (Number.isFinite(dv.slope[k])) { ss += dv.slope[k]; ns++; }
    }
    const e = nz >= 5 ? sz / nz : NaN, s = ns >= 5 ? ss / ns : NaN;
    z[r * G + c] = Number.isFinite(e) ? Math.round(e) : -32768;
    sl[r * G + c] = Number.isFinite(s) ? Math.min(254, Math.round(s / 0.25)) : 255;
    if (Number.isFinite(e)) { lo = Math.min(lo, e); hi = Math.max(hi, e); }
  }
  const meta = { z_min: Number.isFinite(lo) ? lo : null, z_max: Number.isFinite(hi) ? hi : null };
  return { id, G, z, slope: sl, meta, idx: { grid: G, cell_m: 90, z_nodata: -32768, slope_nodata: 255, slope_step_deg: 0.25 } };
}
