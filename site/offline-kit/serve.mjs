// Bağımlılıksız statik sunucu (yalnızca Node 18+). Kullanım: node serve.mjs [port]. Yalnızca bu bilgisayardan (127.0.0.1) erişilir.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "site"), port = +(process.argv[2] || process.env.PORT || 4180);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".geojson": "application/geo+json; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".gz": "application/octet-stream", ".bin": "application/octet-stream" };

createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
    if (p.split(sep).includes("..")) throw new Error("yasak");
    let f = join(root, p || "index.html");
    if ((await stat(f).catch(() => null))?.isDirectory()) f = join(f, "index.html");
    const body = await readFile(f);
    res.writeHead(200, { "Content-Type": MIME[extname(f)] || "application/octet-stream", "Cache-Control": "no-cache" }); res.end(body);
  } catch { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Bulunamadı"); }
}).listen(port, "127.0.0.1", () => console.log(`ANALOG GAP (çevrimdışı) http://127.0.0.1:${port}/  (kapatmak için Ctrl+C)`));
