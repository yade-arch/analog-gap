// Uzak düzlük kayaları (yalnızca görsel; veri değildir): DEM penceresinin (±5 km) dışındaki düz zemine,
// ufka kadar seyrelen blok kayalar. Gökyüzüne bir şey eklenmez. DEM penceresine dokunmaz.
import * as THREE from "three";

const COLOR = { earth: [0x8a6a4c, 0x6d5440], moon: [0x77746f, 0x5c5a56], mars: [0x8c4a2c, 0x6a3420] };

export function scenery(body, baseY, n = 900) {
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const [c1, c2] = COLOR[body], geo = new THREE.BoxGeometry(1, 1, 1);
  const mats = [c1, c2].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 }));
  const meshes = mats.map((m) => new THREE.InstancedMesh(geo, m, n));
  const o = new THREE.Object3D(), cnt = [0, 0];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = 5.5 + r() ** 1.4 * 60;              // yakında sık, uzakta seyrek
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) < 5.2 && Math.abs(z) < 5.2) continue;                  // DEM penceresinin üstüne koyma
    const k = (0.03 + r() ** 3 * 0.3) * (1 + d / 40);
    o.position.set(x, (typeof baseY === "function" ? baseY(x, z) : baseY) + k * 0.4, z); o.rotation.set(0, r() * 3, 0); o.scale.set(k * (1 + r()), k, k * (1 + r())); o.updateMatrix();
    const j = r() > 0.5 ? 1 : 0; meshes[j].setMatrixAt(cnt[j]++, o.matrix);
  }
  const g = new THREE.Group();
  meshes.forEach((m, j) => { m.count = cnt[j]; m.instanceMatrix.needsUpdate = true; g.add(m); });
  return g;
}
