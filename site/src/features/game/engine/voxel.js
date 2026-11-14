// Voxel (blok) tarzı oyun modelleri: astronot (3 kıyafet), rover, arızalı iniş aracı, süs kayaları.
// Kullanıcının referans görsellerine göre prosedürel; gerçek araç/giysi modeli değildir (Kaynaklar'da yazılı).
import * as THREE from "three";

const mats = new Map();
const M = (c, e = 0) => {
  const k = c + ":" + e;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.05, emissive: e ? c : 0x000000, emissiveIntensity: e }));
  return mats.get(k);
};
const geo = new THREE.BoxGeometry(1, 1, 1);
function box(g, c, w, h, d, x, y, z, e) {
  const m = new THREE.Mesh(geo, M(c, e)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
}

export const SUIT_LOOK = {
  base: { body: 0xf2f2ee, trim: 0xc8322c, dark: 0x5a4a3c, visor: 0xd99a2b, light: 0xffa640 },
  suit1: { body: 0x2a2a30, trim: 0xd6262b, dark: 0x1a1a1e, visor: 0x111111, light: 0xff4a3a },     // Kızıl Astronot
  suit2: { body: 0x1f2126, trim: 0x6c7078, dark: 0x111216, visor: 0x0c0c10, light: 0x37e0ff },     // Siyah Astronot
};

/** Astronot; önü +x. Boy ≈ 1 birim (ölçek çağıran tarafta). */
export function astronaut(variant = "base") {
  const L = SUIT_LOOK[variant] || SUIT_LOOK.base, g = new THREE.Group();
  const legs = [-0.09, 0.09].map((z) => { const p = new THREE.Group(); p.position.set(0, 0.42, z); g.add(p); box(p, L.body, 0.16, 0.42, 0.15, 0, -0.21, 0); box(p, L.trim, 0.17, 0.05, 0.16, 0, -0.14, 0); box(p, L.dark, 0.2, 0.08, 0.17, 0.02, -0.4, 0); return p; });
  box(g, L.body, 0.24, 0.36, 0.36, 0, 0.6, 0);
  box(g, L.trim, 0.25, 0.05, 0.37, 0, 0.7, 0);
  box(g, 0x9aa4b0, 0.03, 0.1, 0.14, 0.13, 0.62, 0);                                   // göğüs paneli
  box(g, L.light, 0.03, 0.03, 0.03, 0.15, 0.6, 0.04, 1.2);
  box(g, L.body, 0.16, 0.34, 0.3, -0.2, 0.62, 0); box(g, L.light, 0.04, 0.16, 0.04, -0.29, 0.62, 0.1, 1.4);   // sırt çantası
  const arms = [-0.24, 0.24].map((z) => { const a = new THREE.Group(); a.position.set(0, 0.76, z); g.add(a); box(a, L.body, 0.13, 0.34, 0.12, 0, -0.17, 0); box(a, L.trim, 0.14, 0.05, 0.13, 0, -0.06, 0); box(a, L.dark, 0.13, 0.08, 0.12, 0, -0.36, 0); return a; });
  const head = new THREE.Group(); head.position.y = 0.92; g.add(head);
  box(head, L.body, 0.3, 0.3, 0.3, 0, 0, 0);
  box(head, L.visor, 0.04, 0.18, 0.22, 0.14, 0, 0, variant === "base" ? 0.25 : 0.05);
  if (variant !== "base") { box(head, L.trim, 0.31, 0.05, 0.31, 0, 0.12, 0); box(head, L.light, 0.03, 0.05, 0.05, 0.05, 0.02, 0.16, 1.2); }
  if (variant === "suit1") { box(g, L.trim, 0.26, 0.12, 0.38, 0.01, 0.48, 0); arms.forEach((a) => box(a, L.trim, 0.15, 0.1, 0.14, 0, -0.25, 0)); }  // zırh parçaları
  let t = 0;
  g.userData.tick = (dt, moving) => {
    t += dt * (moving ? 7 : 1.6);
    const s = moving ? Math.sin(t) * 0.5 : 0;
    legs[0].rotation.z = s; legs[1].rotation.z = -s; arms[0].rotation.z = -s * 0.8; arms[1].rotation.z = s * 0.8;
    head.rotation.y = moving ? 0 : Math.sin(t * 0.5) * 0.25;
  };
  g.userData.wave = (on) => { arms[1].rotation.x = on ? -2.6 : 0; };
  return g;
}

/** Rover (referans görseldeki beyaz gövde, kırmızı/mavi ışık, anten, 6 teker); önü +x. */
export function rover(accent = 0xc8322c) {
  const g = new THREE.Group(), wheels = [];
  box(g, 0xf2f2ee, 1.1, 0.32, 0.7, 0, 0.5, 0);
  box(g, accent, 1.12, 0.08, 0.72, 0, 0.42, 0);
  box(g, 0xe8e8e4, 0.45, 0.3, 0.55, -0.1, 0.8, 0);
  box(g, 0x2b4f8f, 0.04, 0.2, 0.45, 0.13, 0.82, 0, 0.15);                              // ön cam
  box(g, 0x3fa0ff, 0.12, 0.08, 0.12, -0.1, 1.0, 0, 1.6);                               // tepe ışığı
  box(g, 0x333333, 0.04, 0.5, 0.04, -0.3, 1.15, 0.25);                                 // anten
  box(g, 0xffe2a8, 0.04, 0.08, 0.12, 0.56, 0.52, 0.24, 1.5); box(g, 0xffe2a8, 0.04, 0.08, 0.12, 0.56, 0.52, -0.24, 1.5);
  box(g, 0xff3b30, 0.04, 0.08, 0.14, -0.56, 0.52, 0.22, 1.5); box(g, 0xff3b30, 0.04, 0.08, 0.14, -0.56, 0.52, -0.22, 1.5);
  for (const x of [-0.38, 0, 0.38]) for (const z of [-0.44, 0.44]) {
    const w = new THREE.Group(); w.position.set(x, 0.22, z); g.add(w);
    box(w, 0x1d1d20, 0.36, 0.36, 0.18, 0, 0, 0); box(w, 0x55575c, 0.16, 0.16, 0.2, 0, 0, 0); wheels.push(w);
  }
  g.userData.tick = (dt, moving, v = 0) => { for (const w of wheels) w.rotation.z -= v * dt * 6; };
  return g;
}

/** Arızalı iniş aracı (hikâye: geri dönüş sistemi bozuk). Eğik gövde + duman parçacıkları. */
export function lander() {
  const g = new THREE.Group();
  box(g, 0xd9d4c6, 1.0, 0.7, 1.0, 0, 1.0, 0); box(g, 0xc9a227, 1.04, 0.2, 1.04, 0, 0.62, 0);
  box(g, 0x8f9399, 0.5, 0.4, 0.5, 0, 1.55, 0); box(g, 0x222222, 0.3, 0.25, 0.3, 0, 0.35, 0);
  for (const [x, z] of [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]]) box(g, 0x777b80, 0.08, 0.7, 0.08, x, 0.35, z);
  box(g, 0xff5a2a, 0.12, 0.12, 0.12, 0.52, 1.1, 0.2, 1.8);                             // arıza ışığı
  g.rotation.z = 0.18; g.rotation.x = -0.1;
  const puffs = Array.from({ length: 8 }, (_, i) => { const p = box(g, 0x8d8d8d, 0.18, 0.18, 0.18, 0, 1.8 + i * 0.25, 0); p.material = p.material.clone(); p.material.transparent = true; return p; });
  let t = 0;
  g.userData.tick = (dt) => { t += dt; puffs.forEach((p, i) => { const k = (t * 0.35 + i / puffs.length) % 1; p.position.set(Math.sin(i) * 0.2 * k, 1.8 + k * 2.2, Math.cos(i) * 0.2 * k); p.scale.setScalar(0.12 + k * 0.4); p.material.opacity = 0.6 * (1 - k); }); };
  return g;
}

/** Süs kayaları (veri değil): DEM yüksekliğine oturtulur. */
export function rocks(height, color, n = 140, W = 10, seed = 7) {
  const g = new THREE.Group(); let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const x = (rnd() - 0.5) * W * 0.96, z = (rnd() - 0.5) * W * 0.96, y = height(x, z);
    if (Number.isNaN(y)) continue;
    const k = 0.015 + rnd() ** 3 * 0.09;
    box(g, color, k * (1 + rnd()), k, k * (1 + rnd()), x, y + k * 0.35, z).rotation.y = rnd() * 3;
  }
  return g;
}
