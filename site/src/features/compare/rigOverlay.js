// Sahne katmanı: istasyon işaretleri (numaralı, ışık huzmeli, etiketli) ve rota çizgisi. Yükseklik h (km) DEM'den; dikey abartı çağıran tarafından uygulanır.
// İşaret renkleri yalnızca durumu gösterir (ziyaret edildi / bekliyor / veri eksik); iyi-kötü anlamı yoktur.
import * as THREE from "three";
import { SETTINGS } from "../../config.js";
import { cssVar } from "../../common.jsx";

// Etiket renkleri theme.css'ten: koyu lacivert kabarcık (--ink) + açık metin (--panel-solid); her iki zeminde de okunur.
const bubble = () => cssVar("--ink", "#14243a"), bubbleInk = () => cssVar("--panel-solid", "#ffffff");

const LIFT = 0.03;                                   // km: çizginin arazi üçgenlerine gömülmemesi için sabit kaldırma
const stateColor = (s) => ({ visited: cssVar("--good-edge", "#2c7d57"), missing: cssVar("--nodata", "#8a94a3") })[s] || SETTINGS.routeColor;

const spr = (c, w, h) => {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true, sizeAttenuation: false }));   // ekranda sabit boyut: yakınlaşınca büyümez
  m.scale.set(w, h, 1); m.renderOrder = 5; return m;
};
function numberSprite(n, col) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"); g.fillStyle = bubble(); g.globalAlpha = 0.92; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill();
  g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 5; g.stroke();
  g.fillStyle = bubbleInk(); g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n), 32, 34);
  return spr(c, 0.05, 0.05);
}
function labelSprite(text, col) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 56;
  const g = c.getContext("2d"); g.fillStyle = bubble(); g.globalAlpha = 0.9; g.beginPath(); g.roundRect(2, 2, 252, 52, 12); g.fill();
  g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 3; g.stroke();
  g.fillStyle = bubbleInk(); g.font = "600 26px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 128, 30, 236);
  return spr(c, 0.2, 0.044);
}
function paint(m, state) {                            // işaret grubunu duruma göre (yeniden) çiz
  const col = stateColor(state);
  for (const k of ["num", "lab"]) { const o = m.userData[k]; if (o) { m.remove(o); o.material.map.dispose(); o.material.dispose(); } }
  m.userData.num = numberSprite(m.userData.i + 1, col); m.userData.num.position.y = 1.7;
  m.userData.lab = labelSprite(m.userData.text, col); m.userData.lab.position.y = 1.7; m.userData.lab.center.set(0.5, -0.75);   // etiket numaranın hemen üstünde
  m.add(m.userData.num, m.userData.lab); m.userData.beam.material.color.set(col); m.userData.state = state;
}

/** spots: [{x,z,h}|null], labels: ["Eğim", ...], states: ["pending"|"visited"|"missing"] -> Group. */
export function makeMarkers(spots, exag, labels = [], states = []) {
  const g = new THREE.Group();
  spots.forEach((p, i) => {
    if (!p) return;
    const m = new THREE.Group(); m.position.set(p.x, p.h * exag, p.z); m.userData = { h: p.h, i, text: `${i + 1} · ${labels[i] || ""}` };
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.6, 8, 1, true), new THREE.MeshBasicMaterial({ color: cssVar("--panel-solid", "#ffffff"), transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 0.8; m.add(beam); m.userData.beam = beam; paint(m, states[i] || "pending"); g.add(m);
  });
  return g;
}
export const setMarkerExag = (g, exag) => g.children.forEach((m) => { m.position.y = m.userData.h * exag; });
export const setMarkerStates = (g, states) => g.children.forEach((m) => { const s = states[m.userData.i] || "pending"; if (m.userData.state !== s) paint(m, s); });

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
