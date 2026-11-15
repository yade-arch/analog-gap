// Ay sahnesi GÖRÜNÜMÜ (yalnızca görsel; arazi yüksekliği/çarpışma değişmez — scripts/game-invariance.mjs).
// Fiziksel ilke: atmosfer yok -> siyah gökyüzü, sis yok, tek Güneş, sert siyah gölgeler, çok zayıf "Dünya ışığı".
// Regolit dokusu ve yıldız alanı prosedürel ve tohumludur (her açılışta aynı); ölçüm değildir. İndirme yok.
import * as THREE from "three";
import { MOBILE } from "./stage.js";

// Güneş: Ay güney kutbu ROI'lerinde Güneş ufka çok yakındır (yükselti birkaç derece). Kesin değer tarih/konuma bağlı;
// burada GÖSTERİM AÇISI: yükselti 5°, azimut sabit (ekranda sol-arka). Uzun gölgeler bu düşük açıdan gelir.
export const SUN_ELEV_DEG = 5, SUN_AZ_DEG = 215;

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Tohumlu değer gürültüsü (tekrar eden döşeme için kenarları sarılır). */
function noiseGrid(n, cells, seed) {
  const r = rng(seed), g = Float32Array.from({ length: cells * cells }, r), out = new Float32Array(n * n), s = n / cells;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const fx = x / s, fy = y / s, x0 = fx | 0, y0 = fy | 0, u = fx - x0, v = fy - y0, a = (i, j) => g[((j % cells) * cells) + (i % cells)];
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    out[y * n + x] = (a(x0, y0) * (1 - su) + a(x0 + 1, y0) * su) * (1 - sv) + (a(x0, y0 + 1) * (1 - su) + a(x0 + 1, y0 + 1) * su) * sv;
  }
  return out;
}

/** Regolit: ince taneli albedo (gri, hafif sıcak-nötr) + toz mikro kabartması normal haritası. Döşenir (RepeatWrapping). */
export function regolithMaps(seed = 4720) {
  const n = MOBILE ? 512 : 1024, h = new Float32Array(n * n);
  for (const [cells, amp, s] of [[8, 0.45, 1], [32, 0.3, 2], [128, 0.17, 3], [n / 2, 0.08, 4]]) { const g = noiseGrid(n, cells, seed + s); for (let k = 0; k < h.length; k++) h[k] += g[k] * amp; }
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = n; return c; };
  const ca = mk(), cn = mk(), ia = ca.getContext("2d").createImageData(n, n), inn = cn.getContext("2d").createImageData(n, n), r = rng(seed ^ 0x51);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = y * n + x, p = k * 4, v = 0.42 + 0.34 * h[k] + (r() - 0.5) * 0.06;            // albedo ~ 0.4–0.75 (görsel ölçek)
    ia.data[p] = 255 * v * 1.02; ia.data[p + 1] = 255 * v; ia.data[p + 2] = 255 * v * 0.96; ia.data[p + 3] = 255;
    const dx = h[y * n + (x + 1) % n] - h[y * n + (x - 1 + n) % n], dy = h[((y + 1) % n) * n + x] - h[((y - 1 + n) % n) * n + x];
    const nx = -dx * 6, ny = -dy * 6, l = Math.hypot(nx, ny, 1);
    inn.data[p] = (nx / l * 0.5 + 0.5) * 255; inn.data[p + 1] = (ny / l * 0.5 + 0.5) * 255; inn.data[p + 2] = (1 / l * 0.5 + 0.5) * 255; inn.data[p + 3] = 255;
  }
  ca.getContext("2d").putImageData(ia, 0, 0); cn.getContext("2d").putImageData(inn, 0, 0);
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: tex(ca, true), normalMap: tex(cn, false) };
}

/** Regolit malzemesi: düşük parlaklık (metalness 0, roughness 1), plastik görünüm yok. repeat = pencere başına döşeme. */
export function regolithMaterial(maps, repeat) {
  const m = { map: maps.map.clone(), normalMap: maps.normalMap.clone() };
  for (const t of Object.values(m)) { t.repeat.set(repeat, repeat); t.needsUpdate = true; }
  return new THREE.MeshStandardMaterial({ ...m, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1, metalness: 0 });
}

/** Rastgele yıldız alanı (GÖSTERİM; gerçek katalog değil). Tohumlu; titreşme yok (Ay'da atmosfer yok). */
export function starField(seed = 1969) {
  const r = rng(seed), grp = new THREE.Group();
  for (const [count, size] of [[MOBILE ? 1600 : 3200, 1.1], [MOBILE ? 140 : 260, 2.2], [24, 3.2]]) {
    const pos = [], col = [];
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), b = 0.35 + 0.65 * Math.pow(r(), 2.5), w = r();
      pos.push(150 * s * Math.cos(a), 150 * u, 150 * s * Math.sin(a));
      col.push(b * (w < 0.15 ? 0.85 : 1), b * (w > 0.85 ? 0.9 : 1), b);             // hafif renk sıcaklığı farkı (gösterim)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    grp.add(new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })));
  }
  return grp;
}

/** Tek Güneş (sert gölge) + çok zayıf Dünya ışığı. W = pencere (km); gölge kamerası pencereyi kapsar. */
export function lunarLights(W) {
  const grp = new THREE.Group(), e = (SUN_ELEV_DEG * Math.PI) / 180, a = (SUN_AZ_DEG * Math.PI) / 180, d = 40;
  const sun = new THREE.DirectionalLight(0xfffaf2, 3.4);
  sun.position.set(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d);
  sun.castShadow = true; const sz = MOBILE ? 1024 : 2048; sun.shadow.mapSize.set(sz, sz);
  Object.assign(sun.shadow.camera, { left: -W * 0.75, right: W * 0.75, top: W * 0.75, bottom: -W * 0.75, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  grp.add(sun, sun.target, new THREE.AmbientLight(0x9fb4d8, 0.035));      // Dünya ışığı: çok düşük, gölgeleri doldurmaz
  return grp;
}
