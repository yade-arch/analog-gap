// Değişmezlik testi: Karşılaştırma ekranındaki SUNUM değişikliklerinin bilimsel veriyi değiştirmediğinin kanıtı.
// Her senaryo için: DEM yükseklik/eğim dizilerinin ve arazi ağı köşe konumlarının (buildTerrain) SHA-256 özeti, ölçek parametreleri,
// limit aşan hücre oranı (exceedFraction), aday/referans hesaplanmış değerleri (P10/P50/P90, d_k, O_k, D) ve kaynaklı eğim sınırları.
// Kullanım: node scripts/invariance.mjs --write   (taban dosyasını yazar)   |   node scripts/invariance.mjs   (tabanla karşılaştırır)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const data = join(root, "public", "data"), BASE = join(root, "scripts", "invariance.baseline.json");
const json = (p) => JSON.parse(readFileSync(join(data, p), "utf8"));
const sha = (buf) => createHash("sha256").update(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)).digest("hex");
const imp = (p) => import(pathToFileURL(join(root, "src", p)).href);

function loadDem(idx, id) {
  const raw = gunzipSync(readFileSync(join(data, "dem", id + ".bin.gz"))), G = idx.grid, n = G * G;
  const ab = new Uint8Array(raw).buffer;                              // hizalı kopya (Int16 için)
  return { id, G, z: new Int16Array(ab, 0, n), slope: new Uint8Array(ab, n * 2, n), meta: idx.windows[id], idx };
}

export async function snapshot() {
  const { buildTerrain } = await imp("features/compare/terrainMesh.js");
  const { exceedFraction } = await imp("features/compare/stats.js");
  const { UNITS, slopeLimit } = await imp("features/units/index.js");
  const { SETTINGS } = await imp("config.js");
  const idx = json("dem/index.json"), params = json("parameters_sources.json");
  const cands = { moon: json("candidates_moon.geojson"), mars: json("candidates_mars.geojson") };
  const refs = { moon: json("reference_moon.json"), mars: json("reference_mars.json") };
  const pick = (profile, region) => cands[profile].features.map((f) => f.properties).filter((p) => idx.windows[p.id] && (!region || p.region === region)).sort((a, b) => a.rank - b.rank)[0];
  const scen = [["moon", "Site04", "ATA"], ["moon", "Site04", "ANA"], ["mars", "R2", null]];
  const out = { scale: { windowKm: SETTINGS.windowKm, grid: idx.grid, cell_m: idx.cell_m, slope_step_deg: idx.slope_step_deg }, limits: {}, scenarios: [] };
  for (const pf of ["moon", "mars"]) for (const u of UNITS) out.limits[`${u.id}.${pf}`] = slopeLimit(u, pf, params)?.value ?? null;
  for (const [pf, refId, region] of scen) {
    const p = pick(pf, region), lim = slopeLimit(UNITS[0], pf, params)?.value ?? null, side = {};
    for (const [k, id] of [["ref", refId], ["cand", p.id]]) {
      const dem = loadDem(idx, id), { geometry, zmed } = buildTerrain(dem);
      side[k] = { id, z: sha(dem.z), slope: sha(dem.slope), mesh: sha(geometry.attributes.position.array), index: sha(new Uint32Array(geometry.index.array)), zmed, exceed: exceedFraction(dem, lim) };
    }
    out.scenarios.push({ profile: pf, region: p.region, ...side, D: p.D, d: p.d, O: p.O, cand_pct: p.derived_percentiles, ref_vars: refs[pf].variables });
  }
  return out;
}

/** check.mjs adımı: tabanla birebir aynı mı. Taban yoksa hata. */
export async function invarianceTest() {
  if (!existsSync(BASE)) throw new Error("taban yok: node scripts/invariance.mjs --write");
  const now = JSON.stringify(await snapshot()), base = JSON.stringify(JSON.parse(readFileSync(BASE, "utf8")));   // satır sonundan bağımsız
  if (now !== base) throw new Error("bilimsel veri/ağ özeti DEĞİŞTİ (scripts/invariance.baseline.json ile farkı inceleyin)");
  const s = JSON.parse(now);
  return `${s.scenarios.length} senaryo aynı; sınırlar ${JSON.stringify(s.limits)}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--write")) { writeFileSync(BASE, JSON.stringify(await snapshot(), null, 1) + "\n"); console.log("taban yazıldı: " + BASE); }
  else console.log(await invarianceTest());
}
