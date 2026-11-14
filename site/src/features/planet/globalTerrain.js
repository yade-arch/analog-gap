// Küresel arazi ızgarası (scripts/global_terrain.py): NASA SRTMGL30 v002, 0,25° hücre, 90°K–60°G. Tembel yüklenir, bir kez indirilir.
// query(lat, lon) -> { cell, elev, relief, s50, s90, valid } veya { missing: neden }. 1 km eğim 30 m pencere eğimiyle karşılaştırılmaz.
const base = import.meta.env.BASE_URL + "data/";
let P = null;

async function gunzip(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] !== 0x1f || u8[1] !== 0x8b) return buf;
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}

export function loadGlobalTerrain() {
  return (P ||= (async () => {
    const meta = await fetch(base + "global_terrain.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error("global_terrain.json " + r.status))));
    const buf = await gunzip(await fetch(base + "global_terrain.bin.gz").then((r) => r.arrayBuffer()));
    const n = meta.ncol * meta.nrow; let o = 0;
    const take = (T, bytes) => { const a = new T(buf, o, n); o += n * bytes; return a; };
    return { meta, elev: take(Int16Array, 2), relief: take(Uint16Array, 2), s50: take(Uint16Array, 2), s90: take(Uint16Array, 2), valid: take(Uint8Array, 1) };
  })().catch((e) => { P = null; throw e; }));
}

export async function queryTerrain(lat, lon) {
  const g = await loadGlobalTerrain(), m = g.meta, st = m.step_deg;
  const r = Math.floor((m.north - lat) / st), c = Math.floor((((lon + 180) % 360) + 360) % 360 / st);
  const cell = { s: m.north - (r + 1) * st, n: m.north - r * st, w: -180 + c * st, e: -180 + (c + 1) * st };
  if (r < 0 || r >= m.nrow) return { cell, missing: "Bu enlem üründe yok (SRTMGL30: 90°K–60°G)" };
  const k = r * m.ncol + c;
  if (g.elev[k] === -32768) return { cell, missing: "Bu hücre deniz veya %10'dan az kara" };
  const u = (a, f = 1) => (a[k] === 65535 ? null : a[k] * f);
  return { cell, elev: g.elev[k], relief: u(g.relief), s50: u(g.s50, 0.1), s90: u(g.s90, 0.1), valid: g.valid[k], meta: m };
}
