// Web Worker: download + resample the 10×10 km window (terrainTiles.js), derive slope/relief/roughness (landform.js),
// score against the Moon and Mars references, build the 90 m display grid. The resampled 30 m grid is cached in
// IndexedDB per point (try/catch: private windows or blocked storage just skip the cache).
import { fetchWindow, SRTM_N, SRTM_S } from "./terrainTiles.js";
import { derive, score, dem90, VARS } from "./landform.js";

const DB = "analog-gap-points", STORE = "win", VER = 1;
const open = () => new Promise((res, rej) => {
  const r = indexedDB.open(DB, VER);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function idb(mode, fn) {
  try {
    const db = await open();
    return await new Promise((res, rej) => { const tx = db.transaction(STORE, mode), q = fn(tx.objectStore(STORE)); tx.oncomplete = () => res(q?.result); tx.onerror = () => rej(tx.error); });
  } catch { return undefined; }
}

async function windowFor(key, lat, lon) {
  const hit = await idb("readonly", (s) => s.get(key));
  if (hit?.z) return { ...hit, cached: true };
  const w = await fetchWindow(lat, lon);
  if (!w.missing) await idb("readwrite", (s) => s.put(w, key));
  return w;
}

self.onmessage = async ({ data: { id, key, lat, lon, refs } }) => {
  try {
    const t0 = performance.now(), w = await windowFor(key, lat, lon);
    if (w.missing) { self.postMessage({ id, res: { key, lat, lon, missing: w.missing } }); return; }
    const t1 = performance.now(), dv = derive(w.z);
    const scores = Object.fromEntries(Object.entries(refs).map(([b, r]) => [b, score(dv, r)]));
    let lo = Infinity, hi = -Infinity;
    for (const v of dv.z) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const res = {
      key, lat, lon, zoom: w.zoom, srcPix: w.srcPix, k: w.k, tiles: w.tiles, cached: !!w.cached, valid: dv.valid,
      P: dv.P, scores, outsideSRTM: lat > SRTM_N || lat < SRTM_S, vars: VARS,
      z: lo <= hi ? { min: lo, max: hi } : null,
      dem: dv.valid > 0 ? dem90(dv, "pt:" + key) : null, ms: { fetch: Math.round(t1 - t0), math: Math.round(performance.now() - t1) },
    };
    self.postMessage({ id, res });
  } catch (e) { self.postMessage({ id, error: String(e?.message || e) }); }
};
