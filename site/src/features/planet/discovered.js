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
    const all = listDiscovered(), old = all.find((x) => x.key === item.key);
    save([{ ...item, name: item.name || old?.name || null, fav: !!old?.fav }, ...all.filter((x) => x.key !== item.key)]);
  } catch { /* storage unavailable */ }
}

// Keeps at most MAX places; favourites are never dropped to make room.
function save(list) {
  const a = [...list];
  for (let i = a.length - 1; a.length > MAX && i >= 0; i--) if (!a[i].fav) a.splice(i, 1);
  localStorage.setItem(KEY, JSON.stringify(a));
}

/** Star or unstar a saved place. Returns the new list. */
export function toggleFavorite(key) {
  const a = listDiscovered().map((x) => (x.key === key ? { ...x, fav: !x.fav } : x));
  try { save(a); } catch { /* storage unavailable: the star lasts until the page closes */ }
  return a;
}

export function clearDiscovered() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }

/** Body with the lower terrain distance (both distances are divided by their own reference's spread). null if neither has D. */
export function closer(x) {
  const m = x.moon?.D, s = x.mars?.D;
  if (m == null && s == null) return null;
  return s == null || (m != null && m <= s) ? "moon" : "mars";
}
