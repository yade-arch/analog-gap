// Two real terrain windows side by side (left: Moon/Mars reference, right: Earth candidate) in one three.js scene.
// Heights come only from the DEMs; the mesh is a 3× denser bilinear interpolation between the 90 m points (display
// smoothing, no new detail). Triangles touching no-data are not drawn. No side walls. Exaggeration EXAG.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SETTINGS } from "../../config.js";
import { grid, layerCanvas, zAt } from "./layers.js";

export const EXAG = 2, DENSE = 3;
const W = SETTINGS.windowKm, GAP = 1.6, OFF = (W + GAP) / 2;

function denseTerrain(dem) {
  const g = grid(dem), N = (g.G - 1) * DENSE + 1, mid = (g.lo + g.hi) / 2;
  const pos = new Float32Array(N * N * 3), uv = new Float32Array(N * N * 2), ok = new Uint8Array(N * N), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = i * N + j, e = zAt(g, i / DENSE, j / DENSE);
    ok[k] = Number.isNaN(e) ? 0 : 1;
    pos.set([(j / (N - 1) - 0.5) * W, ok[k] ? ((e - mid) / 1000) * EXAG : 0, (i / (N - 1) - 0.5) * W], k * 3);
    uv.set([j / (N - 1), 1 - i / (N - 1)], k * 2);
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
    const a = i * N + j, b = a + 1, c = a + N, d = c + 1;
    if (ok[a] && ok[c] && ok[b]) idx.push(a, c, b);
    if (ok[b] && ok[c] && ok[d]) idx.push(b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return { geo, N, bottom: ((g.lo - mid) / 1000) * EXAG - 0.6, top: ((g.hi - mid) / 1000) * EXAG };
}

function texture(dem, layer, body) {
  const t = new THREE.CanvasTexture(layerCanvas(dem, layer, body)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

function tile(dem, layer, body) {
  const { geo } = denseTerrain(dem), tex = texture(dem, layer, body), g = new THREE.Group();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 }));
  g.add(mesh);                                                       // no side walls (reference design)
  g.userData = { mesh, tex, dem, body };
  return g;
}

export function createPairScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, 0.05, 400);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x5a6478, 1.25));
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.4); sun.position.set(-7, 12, 10); scene.add(sun);
  const floor = new THREE.GridHelper(80, 40, 0x3d7bff, 0x1f4fa8); floor.position.y = -4;          // faint reference grid (decoration)
  Object.assign(floor.material, { transparent: true, opacity: 0.22, depthWrite: false }); scene.add(floor);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, minDistance: 4, maxDistance: 140, maxPolarAngle: Math.PI * 0.49, screenSpacePanning: true });
  const tiles = [null, null];
  let mode = "3d", raf = 0;
  const home = () => {
    controls.target.set(0, 0, 0);
    const k = Math.max(1, 2.4 / (camera.aspect || 1));               // narrow screens: step back so both tiles fit
    if (mode === "2d") camera.position.set(0, 26 * k, 0.01); else camera.position.set(0, 6.6 * k, 11.6 * k);
    controls.update();
  };
  const resize = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize(); home();
  const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  loop();
  const place = () => tiles.forEach((t, i) => { if (t) t.position.x = i === 0 ? -OFF : OFF; });
  const drop = (t) => { if (!t) return; scene.remove(t); t.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); }); };

  return {
    /** side 0 = left, 1 = right */
    setTile(side, dem, layer, body) { drop(tiles[side]); tiles[side] = dem ? tile(dem, layer, body) : null; if (tiles[side]) scene.add(tiles[side]); place(); },
    setLayer(layer) {
      for (const t of tiles) if (t) { const u = t.userData; u.tex.dispose(); u.tex = texture(u.dem, layer, u.body); u.mesh.material.map = u.tex; u.mesh.material.needsUpdate = true; }
    },
    swap() { tiles.reverse(); place(); },
    setMode(m) { mode = m; controls.enableRotate = m !== "2d"; home(); },
    zoom(f) { const d = camera.position.clone().sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(d); },
    north() { home(); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); tiles.forEach(drop); renderer.dispose(); renderer.domElement.remove(); },
  };
}
