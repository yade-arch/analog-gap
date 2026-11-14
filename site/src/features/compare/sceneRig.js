// İki sahneli (sol/sağ) tek renderer; tek kamera iki yarım görünüm alanında kullanılır (aynı bakış, adil karşılaştırma).
// Gerçek DEM'den arazi; sahte arazi yok. Yeniden çizim yalnızca değişimde (render-on-demand).
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildSlopeCanvas } from "./slopeTexture.js";
import { buildReliefCanvas } from "./reliefTexture.js";
import { buildTerrain } from "./terrainMesh.js";
import { MODELS } from "./unitModels.js";
import { makeMarkers, setMarkerExag, setMarkerStates, makeRoute, disposeObj } from "./rigOverlay.js";
import { makeTrail } from "./trail.js";
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
  const trail = makeTrail(); scene.add(trail.line);
  return { scene, mesh: null, unit: null, hf: null, tex: null, pos: null, markers: null, route: null, trail };
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
  const st = { exag: SETTINGS.defaultExag, mode: "follow", unit: "rover", view: "relief", pal: ["moon", "earth"], limit: [null, null], dem: [null, null], labels: [[], []], states: [] };
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fol = new THREE.Vector3();                      // yumuşatılmış takip hedefi
  let raf = 0, loopRaf = 0, lastMove = -1e9, lastTick = 0, dead = false, lastW = 0, lastH = 0;

  const draw = () => {
    raf = 0; if (dead) return;
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / 2 / h;
    if (st.mode === "follow" && matchMedia("(min-width: 1280px)").matches) cam.setViewOffset(w / 2, h, 0, -h * 0.16, w / 2, h); else cam.clearViewOffset();   // geniş ekranda birim, üstteki şeridin altında kalsın
    cam.updateProjectionMatrix();
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
    dropOverlay(s); s.trail.clear(); s.pos = null;
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
      place(s); s.trail.rescale(st.exag); if (s.markers) setMarkerExag(s.markers, st.exag);
      if (s.route) setRouteObj(s, s.route.userData.pts);
    });
  }
  function applyUnit(k) {
    const s = sides[k]; if (s.unit) { s.scene.remove(s.unit); s.unit = null; }
    if (!s.mesh) return;
    s.unit = MODELS[st.unit](); s.scene.add(s.unit); place(s);
  }
  // Doku: "relief" = gölgeli yükselti (görsel), "slope" = eğim sınıfı veri katmanı (sınır konturu yalnızca burada).
  function makeTex(k) {
    const slope = st.view === "slope", tx = new THREE.CanvasTexture(slope ? buildSlopeCanvas(st.dem[k], st.limit[k]) : buildReliefCanvas(st.dem[k], st.pal[k]));
    tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = slope ? THREE.NearestFilter : THREE.LinearFilter; tx.minFilter = THREE.LinearMipmapLinearFilter; tx.anisotropy = 8;
    return tx;
  }
  function applySide(k) {
    const s = sides[k], dem = st.dem[k]; clearSide(s);
    if (!dem) { request(); return; }
    const { geometry, heightAt } = buildTerrain(dem);
    s.tex = makeTex(k);
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
    const f = st.mode === "follow", tg = f ? fol : new THREE.Vector3();
    cam.position.copy(dir.multiplyScalar(d * (f ? SETTINGS.followZoom : 1))).add(tg); cam.lookAt(tg); controls.target.copy(tg);
  }
  // Takip: birim(ler)in yatay konumu (iki tarafın ortalaması; kamera tek). Yükseklik 0: iki taraf farklı aralıkta.
  function followTarget() {
    const ps = sides.map((s) => s.pos).filter(Boolean);
    return new THREE.Vector3(ps.reduce((a, p) => a + p.x, 0) / (ps.length || 1), 0, ps.reduce((a, p) => a + p.z, 0) / (ps.length || 1));
  }
  function applyCamera() {
    fol.copy(followTarget()); fitCamera(); controls.enabled = st.mode === "free"; controls.update();
    renderer.domElement.style.touchAction = st.mode === "free" ? "none" : "pan-y";   // serbest dışında dokunmatik kaydırma sayfayı kaydırır
    request();
  }
  applyCamera();
  // Hafif animasyon döngüsü (render-on-demand korunur): bekleme/hareket animasyonu + yumuşak kamera takibi; hareket azaltma tercihinde animasyon yok, kamera anında izler.
  const loop = (now) => {
    if (dead) return; loopRaf = requestAnimationFrame(loop);
    const mv = now - lastMove < 200;
    if (now - lastTick < (mv ? 30 : 60)) return;
    const dt = Math.min((now - lastTick) / 1000, 0.1); lastTick = now; let dirty = false;
    if (!reduce) { sides.forEach((s) => { if (s.unit?.userData.tick) s.unit.userData.tick(dt, mv); }); dirty = true; }
    if (st.mode === "follow") { const goal = followTarget(); if (fol.distanceToSquared(goal) > 1e-6) { fol.lerp(goal, reduce ? 1 : 0.15); fitCamera(); dirty = true; } }
    if (dirty) request();
  };
  loopRaf = requestAnimationFrame(loop);

  return {
    setSide(k, dem, limit, pal) { st.dem[k] = dem; st.limit[k] = limit; if (pal) st.pal[k] = pal; applySide(k); },
    setView(v) { st.view = v; sides.forEach((s, k) => { if (!s.mesh) return; s.tex?.dispose(); s.tex = makeTex(k); s.mesh.material.map = s.tex; s.mesh.material.needsUpdate = true; }); request(); },
    setExag(v) { st.exag = v; applyExag(); request(); },
    setCamera(m) { st.mode = m; applyCamera(); },
    setUnit(u) { st.unit = u; applyUnit(0); applyUnit(1); request(); },
    setStations(k, spots, labels) { const s = sides[k]; if (labels) st.labels[k] = labels; if (s.markers) { s.scene.remove(s.markers); disposeObj(s.markers); s.markers = null; } if (spots && s.mesh) { s.markers = makeMarkers(spots.map((p) => p && { ...p }), st.exag, st.labels[k], st.states); s.scene.add(s.markers); } request(); },
    setStationStates(states) { st.states = states; sides.forEach((s) => s.markers && setMarkerStates(s.markers, states)); request(); },
    clearTrail() { sides.forEach((s) => s.trail.clear()); request(); },
    setRoute(k, pts) { setRouteObj(sides[k], pts); request(); },
    setUnitPos(k, pos) { const s = sides[k]; if (!s.pos) return; s.pos = pos; lastMove = performance.now(); place(s); s.trail.add(pos, st.exag); request(); },
    snapshot: () => renderer.domElement.toDataURL("image/png"),
    dispose() { dead = true; cancelAnimationFrame(raf); cancelAnimationFrame(loopRaf); ro.disconnect(); controls.dispose(); sides.forEach(clearSide); renderer.dispose(); renderer.domElement.remove(); },
  };
}
