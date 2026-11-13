// Şematik birim modelleri (ölçeksiz, yalnızca konum işareti). Her modelin önü +x yönündedir (hareket yönü). Yeni birim türü = buraya model fonksiyonu ekle.
import * as THREE from "three";

const M = (c) => new THREE.MeshLambertMaterial({ color: c });
const S = 0.28;                                // km birimi cinsinden görsel boyut (şematik)

function rover() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4 * S, 0.35 * S, 0.9 * S), M("#b8c4d4")); body.position.y = 0.45 * S; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6 * S, 0.3 * S, 0.6 * S), M("#8fa0b6")); cab.position.y = 0.78 * S; g.add(cab);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * S, 0.02 * S, 0.6 * S), M("#f0b445")); mast.position.set(0.5 * S, 1.1 * S, 0); g.add(mast);
  for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * S, 0.22 * S, 0.16 * S, 14), M("#1b2536"));
    w.rotation.x = Math.PI / 2; w.position.set(x * S, 0.22 * S, z * S); g.add(w);
  }
  return g;
}

function astronaut() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28 * S, 0.7 * S, 4, 10), M("#eef2f8")); body.position.y = 0.85 * S; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3 * S, 14, 10), M("#eef2f8")); head.position.y = 1.55 * S; g.add(head);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.2 * S, 12, 8), M("#1b2c52")); visor.position.set(0.18 * S, 1.58 * S, 0); g.add(visor);
  return g;
}

export const MODELS = { rover, astronaut };
