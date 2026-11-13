// Sahne katmanı: istasyon işaretleri (numaralı) ve rota çizgisi. Yükseklik h (km) DEM'den; dikey abartı çağıran tarafından uygulanır.
import * as THREE from "three";
import { SETTINGS } from "../../config.js";

const LIFT = 0.03;                                   // km: çizginin arazi üçgenlerine gömülmemesi için sabit kaldırma

function numberSprite(n) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"); g.fillStyle = "rgba(10,20,38,.85)"; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill();
  g.strokeStyle = SETTINGS.routeColor; g.lineWidth = 4; g.stroke();
  g.fillStyle = "#f4f1e6"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 32, 34);
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  m.scale.set(0.55, 0.55, 1); m.renderOrder = 5; return m;
}

/** spots: [{x,z,h}|null] -> Group (numaralı işaretler). */
export function makeMarkers(spots, exag) {
  const g = new THREE.Group();
  spots.forEach((p, i) => { if (!p) return; const m = numberSprite(i + 1); m.position.set(p.x, p.h * exag + 0.45, p.z); m.userData.h = p.h; g.add(m); });
  return g;
}
export const setMarkerExag = (g, exag) => g.children.forEach((m) => { m.position.y = m.userData.h * exag + 0.45; });

/** pts: [{x,z,h}] -> Line (veri boşluğunda NaN noktalar çizgiyi böler). */
export function makeRoute(pts, exag) {
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (Number.isNaN(a.h) || Number.isNaN(b.h)) continue;
    pos.push(a.x, a.h * exag + LIFT, a.z, b.x, b.h * exag + LIFT, b.z);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: SETTINGS.routeColor, depthTest: false, transparent: true }));
  l.renderOrder = 4; l.userData.pts = pts; return l;
}
export function disposeObj(o) { o.traverse((c) => { c.geometry?.dispose(); c.material?.map?.dispose(); c.material?.dispose(); }); }
