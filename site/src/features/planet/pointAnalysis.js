// On-demand terrain analysis for ANY point on Earth (main-thread client of pointWorker.js). Results are cached per point
// in memory (and the downloaded window in IndexedDB, inside the worker). Shape of a result: see pointWorker.js.
// pointCand() turns a result into the candidate shape the comparison screen uses (D, d, O, derived_percentiles).
import { normLon } from "./coords.js";

const mem = new Map(), wait = new Map();
let W = null, seq = 0;

function worker() {
  if (W) return W;
  W = new Worker(new URL("./pointWorker.js", import.meta.url), { type: "module" });
  W.onmessage = ({ data }) => {
    const p = wait.get(data.id); if (!p) return; wait.delete(data.id);
    if (data.error) p.rej(new Error(data.error)); else p.res(data.res);
  };
  W.onerror = (e) => { for (const p of wait.values()) p.rej(new Error(e.message || "Worker failed")); wait.clear(); W = null; };
  return W;
}

const slim = (ref) => ref?.variables && { variables: Object.fromEntries(["slope", "relief", "rough"].map((k) => {
  const v = ref.variables[k]; return [k, { p10: v.p10, p90: v.p90, iqr: v.iqr, hist_counts: v.hist_counts, hist_bins: v.hist_bins }];
})) };

/** Window centre snapped to 4 decimals (about 11 m) so repeated clicks share the cache. */
export const snap = (lat, lon) => ({ lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(normLon(lon) * 1e4) / 1e4 });
export const pointKey = (lat, lon) => { const s = snap(lat, lon); return `${s.lat.toFixed(4)},${s.lon.toFixed(4)}`; };
export const pointId = (lat, lon) => "@" + pointKey(lat, lon);
export function parsePointId(id) {
  const m = /^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(id || "");
  return m ? { lat: +m[1], lon: +m[2] } : null;
}

/** refs = { moon: reference_moon.json, mars: reference_mars.json } -> Promise<result>. */
export function analysePoint(lat, lon, refs) {
  const s = snap(lat, lon), key = pointKey(lat, lon);
  if (!mem.has(key)) {
    const body = { key, lat: s.lat, lon: s.lon, refs: Object.fromEntries(Object.entries(refs).filter(([, r]) => r).map(([b, r]) => [b, slim(r)])) };
    mem.set(key, new Promise((res, rej) => { const id = ++seq; wait.set(id, { res, rej }); worker().postMessage({ id, ...body }); })
      .catch((e) => { mem.delete(key); throw e; }));
  }
  return mem.get(key);
}

/** Candidate-shaped object for the comparison screen (values from the on-demand result; nothing added). */
export function pointCand(res, profile) {
  const s = res.scores?.[profile] || {};
  return { id: "@" + res.key, onDemand: true, region: null, rank: null, center_lat: res.lat, center_lon: res.lon,
    D: s.D ?? null, d: s.d || {}, O: s.O || {}, passes: !!s.passes, reason: s.reason, derived_percentiles: res.P };
}
