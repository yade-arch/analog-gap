// İki sahneli (sol/sağ) tek renderer; tek kamera iki yarım görünüm alanında kullanılır (aynı bakış, adil karşılaştırma).
// Gerçek DEM'den arazi; sahte arazi yok. Yeniden çizim yalnızca değişimde (render-on-demand).
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildSlopeCanvas } from "./slopeTexture.js";
import { buildTerrain } from "./terrainMesh.js";
import { MODELS } from "./unitModels.js";
import { makeMarkers, setMarkerExag, makeRoute, disposeObj } from "./rigOverlay.js";
import { SETTINGS } from "../../config.js";

const DIR = { follow: [0, 0.6, 0.8], free: [0, 0.6, 0.8], top: [0, 1, 0.001] };   // kamera yönü (pencere merkezinden)
const FIT_MARGIN = 1.06;

export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

function makeSide() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xfff2d8, 1.9); sun.position.set(-6, 5, 4); scene.add(sun);   // görsel aydınlatma; gölge modeli değil
  return { scene, mesh: null, unit: null, hf: null, tex: null, pos: null, markers: null, route: null };
}

export function createRig(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = false; controls.maxPolarAngle = Math.PI / 2.05; controls.target.set(0, 0.2, 0);
  const sides = [makeSide(), makeSide()];
  const st = { exag: SETTINGS.defaultExag, mode: "follow", unit: "rover", limit: [null, null], dem: [null, null] };
  let raf = 0, dead = false, lastW = 0, lastH = 0;

  const draw = () => {
    raf = 0; if (dead) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / 2 / h; cam.updateProjectionMatrix();
    if (st.mode !== "free" && (w !== lastW || h !== lastH)) { lastW = w; lastH = h; fitCamera(); }
    renderer.setScissorTest(true);
    sides.forEach((s, k) => {
      renderer.setViewport(k * w / 2, 0, w / 2, h); renderer.setScissor(k * w / 2, 0, w / 2, h);
      renderer.render(s.scene, cam);
    });
  };
  const request = () => { if (!raf && !dead) raf = requestAnimationFrame(draw); };
  controls.addEventListener("change", request);
  const ro = new ResizeObserver(request); ro.observe(container);

  function clearSide(s) {
    if (s.mesh) { s.scene.remove(s.mesh); s.mesh.geometry.dispose(); s.tex.dispose(); s.mesh.material.dispose(); s.mesh = null; }
    if (s.unit) { s.scene.remove(s.unit); s.unit = null; }
    dropOverlay(s); s.pos = null;
  }
  function dropOverlay(s) {
    for (const key of ["markers", "route"]) if (s[key]) { s.scene.remove(s[key]); disposeObj(s[key]); s[key] = null; }
  }
  function place(s) {
    if (!s.unit || !s.pos) return;
    s.unit.position.set(s.pos.x, s.pos.h * st.exag, s.pos.z); s.unit.rotation.y = s.pos.heading || 0;
  }
  function setRouteObj(s, pts) {
    if (s.route) { s.scene.remove(s.route); disposeObj(s.route); s.route = null; }
    if (pts && s.mesh) { s.route = makeRoute(pts, st.exag); s.scene.add(s.route); }
  }
  function applyExag() {
    sides.forEach((s) => {
      if (s.mesh) s.mesh.scale.y = st.exag;
      place(s); if (s.markers) setMarkerExag(s.markers, st.exag);
      if (s.route) setRouteObj(s, s.route.userData.pts);
    });
  }
  function applyUnit(k) {
    const s = sides[k]; if (s.unit) { s.scene.remove(s.unit); s.unit = null; }
    if (!s.mesh) return;
    s.unit = MODELS[st.unit](); s.scene.add(s.unit); place(s);
  }
  function applySide(k) {
    const s = sides[k], dem = st.dem[k]; clearSide(s);
    if (!dem) { request(); return; }
    const { geometry, heightAt } = buildTerrain(dem);
    s.tex = new THREE.CanvasTexture(buildSlopeCanvas(dem, st.limit[k]));
    s.tex.colorSpace = THREE.SRGBColorSpace; s.tex.magFilter = THREE.NearestFilter; s.tex.minFilter = THREE.LinearMipmapLinearFilter; s.tex.anisotropy = 8;
    s.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ map: s.tex }));
    s.hf = heightAt(dem.G >> 1, dem.G >> 1); s.pos = { x: 0, z: 0, h: s.hf, heading: 0 };
    s.scene.add(s.mesh); applyUnit(k); applyExag(); request();
  }
  // 10×10 km pencerenin tamamı kadrajda: yarım görünüm alanının en dar boyutuna göre mesafe (birim pencerenin merkezinde, kadrajda kalır).
  function fitCamera() {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    const dir = new THREE.Vector3(...DIR[st.mode]).normalize();
    const v = THREE.MathUtils.degToRad(cam.fov / 2), asp = w / 2 / h;
    const R = 0.5 * SETTINGS.windowKm * (st.mode === "top" ? 1 : 1.2) * FIT_MARGIN;
    const d = R / Math.tan(Math.min(v, Math.atan(Math.tan(v) * asp)));
    const f = st.mode === "follow", tg = f ? followTarget() : new THREE.Vector3();
    cam.position.copy(dir.multiplyScalar(d * (f ? SETTINGS.followZoom : 1))).add(tg); cam.lookAt(tg); controls.target.copy(tg);
  }
  // Takip: birim(ler)in yatay konumu (iki tarafın ortalaması; kamera tek). Yükseklik 0: iki taraf farklı aralıkta.
  function followTarget() {
    const ps = sides.map((s) => s.pos).filter(Boolean);
    return new THREE.Vector3(ps.reduce((a, p) => a + p.x, 0) / (ps.length || 1), 0, ps.reduce((a, p) => a + p.z, 0) / (ps.length || 1));
  }
  function applyCamera() {
    fitCamera(); controls.enabled = st.mode === "free"; controls.update(); request();
  }
  applyCamera();

  return {
    setSide(k, dem, limit) { st.dem[k] = dem; st.limit[k] = limit; applySide(k); },
    setExag(v) { st.exag = v; applyExag(); request(); },
    setCamera(m) { st.mode = m; applyCamera(); },
    setUnit(u) { st.unit = u; applyUnit(0); applyUnit(1); request(); },
    setStations(k, spots) { const s = sides[k]; if (s.markers) { s.scene.remove(s.markers); disposeObj(s.markers); s.markers = null; } if (spots && s.mesh) { s.markers = makeMarkers(spots.map((p) => p && { ...p }), st.exag); s.scene.add(s.markers); } request(); },
    setRoute(k, pts) { setRouteObj(sides[k], pts); request(); },
    setUnitPos(k, pos) { const s = sides[k]; if (!s.pos) return; s.pos = pos; place(s); if (st.mode === "follow") fitCamera(); request(); },
    snapshot: () => renderer.domElement.toDataURL("image/png"),
    dispose() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); sides.forEach(clearSide); renderer.dispose(); renderer.domElement.remove(); },
  };
}
