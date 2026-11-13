// npm run offline: internet gerektirmeyen kopya. offline/analog-gap-offline/ (klasör) ve offline/analog-gap-offline.zip üretir.
// Dış istek yok: GIBS altlığı derlemeden çıkarılır (VITE_OFFLINE=1), yazı tipi/CDN kullanılmaz. Adımlar: docs/OFFLINE.md
import { rmSync, mkdirSync, cpSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const site = join(fileURLToPath(import.meta.url), "..", ".."), repo = join(site, ".."), out = join(repo, "offline"), pkg = join(out, "analog-gap-offline");
const run = (cmd, args, env = {}) => { const r = spawnSync(cmd, args, { cwd: site, stdio: "inherit", env: { ...process.env, ...env } }); if (r.status !== 0) { console.error("başarısız:", cmd, args.join(" ")); process.exit(1); } };

rmSync(pkg, { recursive: true, force: true }); mkdirSync(pkg, { recursive: true });
run(process.execPath, [join(site, "node_modules", "vite", "bin", "vite.js"), "build", "--outDir", join(pkg, "site"), "--emptyOutDir"], { VITE_OFFLINE: "1" });
cpSync(join(site, "offline-kit", "serve.mjs"), join(pkg, "serve.mjs"));
cpSync(join(site, "offline-kit", "baslat.bat"), join(pkg, "baslat.bat"));
cpSync(join(repo, "docs", "OFFLINE.md"), join(pkg, "OKU-BENI.md"));
cpSync(join(repo, "LICENSE"), join(pkg, "LICENSE"));
const sz = (d) => readdirSync(d, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).reduce((a, e) => a + statSync(join(e.parentPath, e.name)).size, 0);
console.log(`klasör: ${pkg} (${(sz(pkg) / 1048576).toFixed(1)} MB)`);
const zip = join(out, "analog-gap-offline.zip"); rmSync(zip, { force: true });
const z = spawnSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${pkg}' -DestinationPath '${zip}' -Force`], { stdio: "inherit" });
console.log(z.status === 0 && existsSync(zip) ? `zip: ${zip} (${(statSync(zip).size / 1048576).toFixed(1)} MB)` : "zip üretilemedi (klasör kullanılabilir)");
