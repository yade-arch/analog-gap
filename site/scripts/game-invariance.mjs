// Oyun (Ay sahnesi) değişmezlik testi: görsel değişiklikler oyun arazisini/çarpışmayı değiştirmedi mi?
// Her Ay/Mars referans penceresi için: arazi ağı köşe konumları SHA-256 (buildTerrain), ölçek (EXAG, pencere), istasyon/başlangıç konumları
// (layout), 20 zemin yüksekliği örneği (sampleH × EXAG) ve kaynaklı eğim sınırları. Kullanım: --write (taban) | (karşılaştır).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", ".."), data = join(root, "public", "data"), BASE = join(root, "scripts", "game-invariance.baseline.json");
const json = (p) => JSON.parse(readFileSync(join(data, p), "utf8"));
const imp = (p) => import(pathToFileURL(join(root, "src", p)).href);
const sha = (a) => createHash("sha256").update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)).digest("hex");
const r6 = (v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : null);

export async function snapshot() {
  const { buildTerrain } = await imp("features/compare/terrainMesh.js");
  const { layout, sampleH } = await imp("features/compare/route.js");
  const { UNITS, slopeLimit } = await imp("features/units/index.js");
  const { SETTINGS } = await imp("config.js");
  const src = readFileSync(join(root, "src", "features", "game", "engine", "terrainView.js"), "utf8");
  const EXAG = Number(/export const EXAG = ([\d.]+)/.exec(src)[1]);          // terrainView'ı Node'da yüklemeden (DOM gerektirir) sabiti oku
  const idx = json("dem/index.json"), params = json("parameters_sources.json"), W = SETTINGS.windowKm, out = { EXAG, windowKm: W, limits: {}, windows: {} };
  for (const pf of ["moon", "mars"]) for (const u of UNITS) out.limits[`${u.id}.${pf}`] = slopeLimit(u, pf, params)?.value ?? null;
  for (const id of [...SETTINGS.references.moon, ...SETTINGS.references.mars]) {
    const raw = gunzipSync(readFileSync(join(data, "dem", id + ".bin.gz"))), G = idx.grid, n = G * G, ab = new Uint8Array(raw).buffer;
    const dem = { id, G, z: new Int16Array(ab, 0, n), slope: new Uint8Array(ab, n * 2, n), meta: idx.windows[id], idx };
    const { geometry, zmed } = buildTerrain(dem), lay = layout(dem, 3), samples = [];
    for (let i = 0; i < 20; i++) { const x = ((i % 5) / 4 - 0.5) * W * 0.9, z = ((Math.floor(i / 5)) / 3 - 0.5) * W * 0.9; samples.push(r6(sampleH(dem, x, z) * EXAG)); }
    out.windows[id] = { mesh: sha(geometry.attributes.position.array), index: sha(new Uint32Array(geometry.index.array)), zmed,
      spots: lay.spots.map((p) => p && [r6(p.x), r6(p.z)]), start: lay.start && [r6(lay.start.x), r6(lay.start.z)], samples };
  }
  return out;
}

export async function gameInvarianceTest() {
  if (!existsSync(BASE)) throw new Error("taban yok: node scripts/game-invariance.mjs --write");
  const now = JSON.stringify(await snapshot()), base = JSON.stringify(JSON.parse(readFileSync(BASE, "utf8")));
  if (now !== base) throw new Error("oyun arazisi/çarpışma/eğim sınırı DEĞİŞTİ (scripts/game-invariance.baseline.json ile karşılaştırın)");
  return `${Object.keys(JSON.parse(now).windows).length} pencere aynı (ağ, istasyon, 20 zemin örneği, sınırlar)`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes("--write")) { writeFileSync(BASE, JSON.stringify(await snapshot(), null, 1) + "\n"); console.log("taban yazıldı"); }
  else console.log(await gameInvarianceTest());
}
