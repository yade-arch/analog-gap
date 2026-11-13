// Düşük poligonlu şematik birim modelleri (prosedürel; dış model indirilmez). Ölçeksiz: yalnızca konum/yön işareti, gerçek boyut değildir.
// Her modelin önü +x yönündedir. userData.tick(dt, moving): hafif bekleme animasyonu ve hareket animasyonu (tekerlek/bacak).
// Yeni birim türü = buraya model fonksiyonu ekle.
import * as THREE from "three";

const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });
const S = 1.0;                                 // km birimi cinsinden görsel boyut (şematik; önceki 0,28'in ~3,5 katı)
const box = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * S, h * S, d * S), M(c)); m.position.set(x * S, y * S, z * S); return m; };
const cyl = (rt, rb, h, seg, c) => new THREE.Mesh(new THREE.CylinderGeometry(rt * S, rb * S, h * S, seg), M(c));

let blobTex = null;
function blob() {                              // yumuşak zemin gölgesi (görsel; ışık gölgesi modeli değil)
  if (!blobTex) {
    const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * S, 2.6 * S), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, depthTest: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.renderOrder = 1; return m;
}

function rover() {
  const g = new THREE.Group(); g.add(blob());
  g.add(box(1.5, 0.3, 0.9, "#c9d3e0", 0, 0.62, 0));                         // gövde
  g.add(box(0.9, 0.22, 0.7, "#8fa0b6", -0.1, 0.88, 0));                      // üst kabin
  g.add(box(0.5, 0.05, 1.3, "#2a4a7a", -0.5, 0.95, 0));                      // güneş paneli
  const mast = new THREE.Group(); mast.position.set(0.55 * S, 1.0 * S, 0); g.add(mast);
  mast.add(cyl(0.03, 0.03, 0.7, 6, "#f0b445")).position.y = 0.35 * S;
  const head = box(0.22, 0.14, 0.34, "#1b2536", 0, 0.75, 0); mast.add(head);
  const dish = cyl(0.01, 0.2, 0.12, 8, "#eef2f8"); dish.position.set(-0.7 * S, 1.1 * S, 0.3 * S); dish.rotation.z = 0.5; g.add(dish);
  const wheels = [];
  for (const x of [-0.6, 0, 0.6]) for (const z of [-0.62, 0.62]) {
    const w = new THREE.Group(); w.position.set(x * S, 0.28 * S, z * S);
    const tire = cyl(0.28, 0.28, 0.22, 10, "#1b2536"); tire.rotation.x = Math.PI / 2; w.add(tire);
    const hub = cyl(0.12, 0.12, 0.24, 6, "#9aa7b8"); hub.rotation.x = Math.PI / 2; w.add(hub);
    g.add(w); wheels.push(w);
    g.add(box(0.06, 0.4, 0.06, "#6b7a90", x, 0.5, z * 0.85));                  // süspansiyon
  }
  let ph = 0, t = 0;
  g.userData.tick = (dt, mv) => {
    t += dt; if (mv) { ph += dt * 6; wheels.forEach((w) => { w.rotation.z = -ph; }); }
    mast.rotation.y = mv ? 0 : Math.sin(t * 0.8) * 0.7;                      // bekleme: direk yavaşça döner
    head.position.y = (0.75 + Math.sin(t * 2) * 0.01) * S;
    g.children[1].position.y = (0.62 + (mv ? Math.sin(ph * 2) * 0.012 : Math.sin(t * 1.6) * 0.008)) * S;
  };
  return g;
}

function astronaut() {
  const g = new THREE.Group(); g.add(blob());
  const suit = "#eef2f8", trim = "#b8c4d4";
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * S, 0.5 * S, 2, 6), M(suit)); torso.position.y = 1.3 * S; g.add(torso);
  g.add(box(0.28, 0.65, 0.5, trim, -0.34, 1.35, 0));                         // sırt çantası
  const head = new THREE.Group(); head.position.y = 2.05 * S; g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.34 * S, 8, 6), M(suit)));
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.25 * S, 8, 6), M("#d8a93c")); visor.position.set(0.14 * S, 0.02 * S, 0); visor.scale.set(0.8, 0.9, 1); head.add(visor);
  const limb = (x, y, z, len, w, c) => { const p = new THREE.Group(); p.position.set(x * S, y * S, z * S); const m = box(w, len, w, c, 0, -len / 2, 0); p.add(m); g.add(p); return p; };
  const arms = [limb(0, 1.65, 0.42, 0.7, 0.2, suit), limb(0, 1.65, -0.42, 0.7, 0.2, suit)];
  const legs = [limb(0, 0.95, 0.17, 0.95, 0.26, trim), limb(0, 0.95, -0.17, 0.95, 0.26, trim)];
  let ph = 0, t = 0;
  g.userData.tick = (dt, mv) => {
    t += dt; if (mv) ph += dt * 7;
    const sw = mv ? Math.sin(ph) * 0.6 : 0;
    legs[0].rotation.z = sw; legs[1].rotation.z = -sw; arms[0].rotation.z = -sw * 0.8; arms[1].rotation.z = sw * 0.8;
    if (!mv) { arms[0].rotation.z = Math.sin(t * 1.4) * 0.05; arms[1].rotation.z = -Math.sin(t * 1.4) * 0.05; head.rotation.y = Math.sin(t * 0.7) * 0.35; } else head.rotation.y = 0;
    torso.position.y = (1.3 + (mv ? Math.abs(Math.sin(ph)) * 0.04 : Math.sin(t * 1.5) * 0.012)) * S;
  };
  return g;
}

export const MODELS = { rover, astronaut };
