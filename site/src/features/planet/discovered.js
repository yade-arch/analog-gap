// "Places you have discovered": short summaries of the on-demand points this viewer checked, kept in this browser only
// (localStorage, try/catch; a private window or blocked storage just shows an empty list). Newest first, at most 24.
const KEY = "analog-gap-discovered-v1", MAX = 24;

export function listDiscovered() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

/** res = pointAnalysis result; name = place name from the search box (optional). Points without land data are not kept. */
export function addDiscovered(res, name) {
  if (!res || res.missing || !res.P?.slope) return;
  const s = (b) => { const x = res.scores?.[b]; return x ? { D: x.D ?? null, passes: !!x.passes, reason: x.reason ?? null } : null; };
  const item = { key: res.key, lat: res.lat, lon: res.lon, name: name || null, t: Date.now(), valid: res.valid, outsideSRTM: !!res.outsideSRTM,
    p50: Object.fromEntries(["slope", "relief", "rough"].map((k) => [k, res.P[k]?.p50 ?? null])), moon: s("moon"), mars: s("mars") };
  try {
    const prev = listDiscovered().filter((x) => x.key !== item.key);
    localStorage.setItem(KEY, JSON.stringify([{ ...item, name: item.name || prev.find((x) => x.key === item.key)?.name || null }, ...prev].slice(0, MAX)));
  } catch { /* storage unavailable */ }
}

export function clearDiscovered() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }

/** Body with the lower terrain distance (both distances are divided by their own reference's spread). null if neither has D. */
export function closer(x) {
  const m = x.moon?.D, s = x.mars?.D;
  if (m == null && s == null) return null;
  return s == null || (m != null && m <= s) ? "moon" : "mars";
}
