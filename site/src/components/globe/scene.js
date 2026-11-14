// three.js küre sahnesi: düz küre (doku yok) + ızgara + kıyı çizgisi + işaretçiler. Sürükle/yakınlaştır OrbitControls ile.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { angle, graticule, toLatLon, toXYZ } from "./geo.js";

const css = (el, v, d) => getComputedStyle(el).getPropertyValue(v).trim() || d;
const lines = (pos, color, opacity) => {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
};

export function createGlobe(el) {
  const C = { body: css(el, "--bg2", "#101a2e"), line: css(el, "--line", "#2a3b57"), land: css(el, "--muted", "#9db0c6"), mark: css(el, "--cool", "#7fb2e0"), sel: css(el, "--accent", "#f0b445") };
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50);
  camera.position.set(0, 0, 3.2);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshBasicMaterial({ color: C.body })));
  scene.add(lines(graticule(30), C.line, 0.9));
  const land = new THREE.Group(); scene.add(land);
  const pts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: C.mark, size: 6, sizeAttenuation: false }));
  scene.add(pts);
  const sel = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.03, 24), new THREE.MeshBasicMaterial({ color: C.sel, side: THREE.DoubleSide }));
  sel.visible = false; scene.add(sel);

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enablePan: false, enableDamping: true, minDistance: 1.25, maxDistance: 6, rotateSpeed: 0.5, zoomSpeed: 0.8 });
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.4;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  let markers = [], pick = () => {}, raf = 0, down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  loop();

  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
  cv.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
    const r = cv.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(scene.children[0])[0]; if (!hit) return;
    const ll = toLatLon(hit.point.x, hit.point.y, hit.point.z);
    const tol = 0.035 * (camera.position.length() - 1);              // ekranda yaklaşık sabit tolerans
    let best = null, bd = tol;
    for (const m of markers) { const d = angle(ll, m); if (d < bd) { bd = d; best = m; } }
    pick(best || ll);
  });

  return {
    setLand(pos) { land.clear(); if (pos?.length) land.add(lines(pos, C.land, 0.8)); },
    setMarkers(list) {
      markers = list || [];
      pts.geometry.dispose(); pts.geometry = new THREE.BufferGeometry();
      pts.geometry.setAttribute("position", new THREE.Float32BufferAttribute(markers.flatMap((m) => toXYZ(m.lat, m.lon, 1.004)), 3));
    },
    setSelected(id) {
      const m = markers.find((x) => x.id === id); sel.visible = !!m; if (!m) return;
      sel.position.set(...toXYZ(m.lat, m.lon, 1.006)); sel.lookAt(0, 0, 0);
    },
    lookAt(lat, lon) { const d = camera.position.length(); camera.position.set(...toXYZ(Math.max(-80, Math.min(80, lat)), lon, d)); controls.update(); },
    zoom(f) { camera.position.multiplyScalar(f); camera.position.setLength(Math.max(controls.minDistance, Math.min(controls.maxDistance, camera.position.length()))); },
    onPick(cb) { pick = cb; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose(); cv.remove();
    },
  };
}
