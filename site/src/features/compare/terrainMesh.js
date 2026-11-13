// Gerçek DEM'den arazi ağı. Yatay ölçek: pencere = windowKm birim (sol/sağ aynı ölçek). Veri olmayan köşelere dokunan üçgenler maskelenir (çizilmez).
import * as THREE from "three";
import { SETTINGS } from "../../config.js";
import { elev } from "./demLoader.js";

export function medianElev(dem) {
  const a = [];
  for (let k = 0; k < dem.z.length; k++) { const e = elev(dem, k); if (!Number.isNaN(e)) a.push(e); }
  a.sort((x, y) => x - y);
  return a.length ? a[a.length >> 1] : 0;
}

/** -> { geometry, zmed, heightAt(i, j) } ; y = (z - zmed)/1000 (km), dikey abartı mesh.scale.y ile. */
export function buildTerrain(dem) {
  const G = dem.G, W = SETTINGS.windowKm, zmed = medianElev(dem);
  const pos = new Float32Array(G * G * 3), uv = new Float32Array(G * G * 2), idx = [];
  const h = (i, j) => { const e = elev(dem, i * G + j); return ((Number.isNaN(e) ? zmed : e) - zmed) / 1000; };
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const k = i * G + j;
    pos.set([(j / (G - 1) - 0.5) * W, h(i, j), (i / (G - 1) - 0.5) * W], k * 3);
    uv.set([(j + 0.5) / G, 1 - (i + 0.5) / G], k * 2);
  }
  // Yükseklik verisi olmayan köşeye dokunan üçgenler çizilmez (yükseklik uydurulmaz, duvar/etek yok).
  const ok = (k) => !Number.isNaN(elev(dem, k));
  for (let i = 0; i < G - 1; i++) for (let j = 0; j < G - 1; j++) {
    const a = i * G + j, b = a + 1, c = a + G, d = c + 1;
    if (ok(a) && ok(c) && ok(b)) idx.push(a, c, b);
    if (ok(b) && ok(c) && ok(d)) idx.push(b, c, d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return { geometry, zmed, heightAt: h };
}
