// Two real terrain windows side by side (left: Moon/Mars reference, right: Earth candidate) in one three.js scene.
// Heights come only from the DEMs (buildTerrain); the dark base slab under each tile is decoration. Height exaggeration EXAG.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildTerrain } from "../compare/terrainMesh.js";
import { SETTINGS } from "../../config.js";
import { layerCanvas } from "./layers.js";

export const EXAG = 1.5;
const W = SETTINGS.windowKm, GAP = 1.6, OFF = (W + GAP) / 2;

/** Closed side walls ("cut block" look): from the real edge heights of the window down to a flat base. Decoration only. */
function walls(geometry, G, base) {
  const p = geometry.attributes.position, pos = [], idx = [];
  const edges = [[...Array(G).keys()].map((j) => j), [...Array(G).keys()].map((i) => i * G + G - 1), [...Array(G).keys()].map((j) => (G - 1) * G + G - 1 - j), [...Array(G).keys()].map((i) => (G - 1 - i) * G)];
  for (const e of edges) {
    const s = pos.length / 3;
    e.forEach((k, n) => { pos.push(p.getX(k), p.getY(k) * EXAG, p.getZ(k), p.getX(k), base, p.getZ(k)); if (n) { const a = s + (n - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x24324f, roughness: 1, side: THREE.DoubleSide }));
}

function tile(dem, layer, body) {
  const { geometry } = buildTerrain(dem);
  const tex = new THREE.CanvasTexture(layerCanvas(dem, layer, body)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }));
  mesh.scale.y = EXAG; g.add(mesh);
  geometry.computeBoundingBox();
  const base = geometry.boundingBox.min.y * EXAG - 0.5;
  g.add(walls(geometry, dem.G, base));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshStandardMaterial({ color: 0x1b2440, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = base; g.add(floor);
  g.position.y = -(geometry.boundingBox.min.y + geometry.boundingBox.max.y) * EXAG / 2;     // centre the block vertically
  g.userData = { mesh, tex, dem, body };
  return g;
}

export function createPairScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, 1, 0.05, 400);
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x1a2030, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-8, 10, 6); scene.add(sun);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, minDistance: 4, maxDistance: 140, maxPolarAngle: Math.PI * 0.49, screenSpacePanning: true });
  const tiles = [null, null];
  let mode = "3d", raf = 0;
  const home = () => {
    controls.target.set(0, 0, 0);
    const k = Math.max(1, 1.7 / (camera.aspect || 1));               // narrow screens: step back so both tiles fit
    if (mode === "2d") camera.position.set(0, 26 * k, 0.01); else camera.position.set(0, 10.5 * k, 17 * k);
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
      for (const t of tiles) if (t) { const u = t.userData; u.tex.dispose(); u.tex = new THREE.CanvasTexture(layerCanvas(u.dem, layer, u.body)); u.tex.colorSpace = THREE.SRGBColorSpace; u.mesh.material.map = u.tex; u.mesh.material.needsUpdate = true; }
    },
    swap() { tiles.reverse(); place(); },
    setMode(m) { mode = m; controls.enableRotate = m !== "2d"; home(); },
    zoom(f) { const d = camera.position.clone().sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(d); },
    north() { home(); },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); tiles.forEach(drop); renderer.dispose(); renderer.domElement.remove(); },
  };
}
