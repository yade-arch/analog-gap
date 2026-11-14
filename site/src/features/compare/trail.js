// Birimin arkasında kalan iz çizgisi (yüzeye yapışık: yükseklik DEM'den). Noktalar [x, h, z]; dikey abartı değişince yeniden yazılır.
import * as THREE from "three";
import { cssVar } from "../../common.jsx";

const MAX = 4000, LIFT = 0.04, MIN_STEP2 = 0.02 * 0.02;

export function makeTrail() {
  const attr = new THREE.BufferAttribute(new Float32Array(MAX * 3), 3), geo = new THREE.BufferGeometry(); geo.setAttribute("position", attr);
  geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: cssVar("--panel-solid", "#ffffff"), transparent: true, opacity: 0.8, depthTest: false }));
  line.renderOrder = 3; line.frustumCulled = false;
  const pts = [];
  const write = (i, exag) => { const p = pts[i]; attr.setXYZ(i, p[0], p[1] * exag + LIFT, p[2]); };
  return {
    line,
    add(pos, exag) {                                   // veri boşluğunda (h NaN) nokta eklenmez
      if (Number.isNaN(pos.h) || pts.length >= MAX) return false;
      const l = pts[pts.length - 1];
      if (l && (l[0] - pos.x) ** 2 + (l[2] - pos.z) ** 2 < MIN_STEP2) return false;
      pts.push([pos.x, pos.h, pos.z]); write(pts.length - 1, exag);
      geo.setDrawRange(0, pts.length); attr.needsUpdate = true; return true;
    },
    rescale(exag) { for (let i = 0; i < pts.length; i++) write(i, exag); attr.needsUpdate = true; },
    clear() { pts.length = 0; geo.setDrawRange(0, 0); },
    dispose() { geo.dispose(); line.material.dispose(); },
  };
}
