// npm run check: derleme öncesi kontroller + vite build. Hızlı mod: node scripts/check.mjs --no-build
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const src = join(root, "src"), pub = join(root, "public", "data");
const MAX_LINES = 300;
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const rel = (p) => relative(root, p).replaceAll("\\", "/");
let failed = 0;
const step = async (name, fn) => {
  try { const note = await fn(); console.log(`ok   ${name}${note ? " — " + note : ""}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${String(e.message).split("\n").join("\n     ")}`); }
};

await step("dosya boyutu (< 300 satır)", () => {
  const files = walk(src).filter((p) => [".js", ".jsx", ".css"].includes(extname(p)));
  const big = files.map((p) => [rel(p), readFileSync(p, "utf8").split("\n").length]).filter(([, n]) => n > MAX_LINES);
  assert.equal(big.length, 0, "çok uzun: " + big.map(([f, n]) => `${f} (${n})`).join(", "));
  return `${files.length} dosya`;
});

await step("i18n anahtarları (sabit kullanımlar tr.js'de var)", async () => {
  const tr = (await import(pathToFileURL(join(src, "i18n", "tr.js")).href)).default;
  const used = new Map();
  for (const p of walk(src).filter((p) => [".js", ".jsx"].includes(extname(p)) && !p.includes("i18n"))) {
    const s = readFileSync(p, "utf8");
    for (const m of s.matchAll(/\bt\(\s*"([\w.]+)"\s*\)/g)) used.set(m[1], rel(p));
    for (const m of s.matchAll(/\b(?:titleKey|labelKey)\s*:\s*"([\w.]+)"/g)) used.set(m[1], rel(p));
  }
  const missing = [...used].filter(([k]) => !(k in tr));
  assert.equal(missing.length, 0, "tr.js'de yok: " + missing.map(([k, f]) => `${k} (${f})`).join(", "));
  return `${used.size} anahtar`;
});

await step("veri dosyaları (JSON ayrışır, DEM dizini eşleşir)", () => {
  const all = walk(pub), js = all.filter((p) => /\.(json|geojson)$/.test(p));
  for (const p of js) {
    const txt = readFileSync(p, "utf8");
    try { JSON.parse(txt); } catch (e) { throw new Error(`${rel(p)}: ${e.message}`); }
    if (txt.includes("\uFFFD")) throw new Error(`${rel(p)}: bozuk karakter (U+FFFD); kaynak UTF-8 değil, betikte encoding="utf-8" kullanın`);
  }
  const idxPath = join(pub, "dem", "index.json"); assert.ok(existsSync(idxPath), "dem/index.json yok");
  const idx = JSON.parse(readFileSync(idxPath, "utf8")), ids = Object.keys(idx.windows);
  const miss = ids.filter((id) => !existsSync(join(pub, "dem", id + ".bin.gz")));
  assert.equal(miss.length, 0, "eksik DEM dosyası: " + miss.slice(0, 5).join(", "));
  return `${js.length} JSON, ${ids.length} DEM penceresi`;
});

await step("rover protokolü (MockLink)", async () => {
  const { decode, LineSplitter } = await import(pathToFileURL(join(src, "hardware", "protocol.js")).href);
  const { createLink, availability } = await import(pathToFileURL(join(src, "hardware", "index.js")).href);
  assert.equal(decode("{bozuk").ok, false); assert.equal(decode('{"v":9,"type":"ack","id":1,"ok":true}').ok, false);
  assert.equal(decode('{"v":0,"type":"yok"}').ok, false); assert.equal(decode('{"v":0,"type":"cmd","id":1,"cmd":"goto","args":{}}').ok, false);
  assert.equal(decode('{"v":0,"type":"ack","id":1,"ok":true}').ok, true);
  const sp = new LineSplitter(); assert.deepEqual(sp.feed('{"a":1}\n{"b"'), ['{"a":1}']); assert.deepEqual(sp.feed(":2}\n"), ['{"b":2}']);
  assert.equal(availability().mock, true);

  const link = createLink("mock", { speedKmPerS: 200, tickMs: 5, ackTimeoutMs: 300 });
  const tele = [], errs = []; let hello = null;
  link.on("telemetry", (t) => tele.push(t)); link.on("hello", (h) => (hello = h)); link.on("error", (e) => errs.push(e));
  await assert.rejects(link.send("ping"), /açık değil/);
  await link.open(); await new Promise((r) => setTimeout(r, 10));
  try {
    assert.equal(hello?.source, "mock");
    assert.equal((await link.send("ping")).ok, true);
    await link.send("goto", { target: { x_km: 1, z_km: 0.5 } });
    await new Promise((r) => { const t0 = Date.now(), i = setInterval(() => { if (tele.at(-1)?.state === "idle" || Date.now() - t0 > 3000) { clearInterval(i); r(); } }, 10); });
    const last = tele.at(-1);
    assert.ok(last && last.state === "idle", "varış telemetrisi gelmedi");
    assert.deepEqual(last.pos, { x_km: 1, z_km: 0.5 });
    assert.ok(tele.every((t) => t.source === "mock"), "mock telemetri source:'mock' olmalı");
    await assert.rejects(link.send("goto", {}), /zaman aşımı/);          // geçersiz goto: rover error yollar, ack yok
    assert.ok(errs.some((e) => e.code === "bad_message"), "bad_message hatası gelmedi");
  } finally { await link.close(); }
  assert.equal(link.state, "closed");
  return `${tele.length} telemetri`;
});

await step("gezegen çekirdeği (coords, picking, registry, provider)", async () => {
  const { planetTests } = await import(pathToFileURL(join(root, "scripts", "planet.test.mjs")).href);
  return planetTests((p) => import(pathToFileURL(join(src, p)).href));
});

if (process.argv.includes("--no-build")) console.log("--   derleme atlandı (--no-build)");
else await step("vite build", () => {
  const r = spawnSync(process.execPath, [join(root, "node_modules", "vite", "bin", "vite.js"), "build"], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, (r.stdout + r.stderr).split("\n").slice(-15).join("\n"));
});

console.log(failed ? `\n${failed} kontrol başarısız` : "\ntüm kontroller geçti");
process.exit(failed ? 1 : 0);
