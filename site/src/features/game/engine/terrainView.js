// Yakın arazi: YALNIZCA gerçek DEM penceresi (features/compare buildTerrain). Doku/görüntü yok: tek renkli malzeme + güneş
// gölgelemesi; renk gövdeye göre (gösterim). Dikey abartı EXAG (Kaynaklar'da yazılı). Test noktaları = layout() istasyonları.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildTerrain } from "../../compare/terrainMesh.js";
import { layout, sampleH } from "../../compare/route.js";
import { slopeDeg } from "../../compare/demLoader.js";
import { SETTINGS } from "../../../config.js";
import { disposeScene } from "./stage.js";

export const EXAG = 2;
const LOOK = {
  earth: { ground: 0xb08a63, sky: 0x9cc3e6, fog: 0xbcd4ea },
  moon: { ground: 0x8d8b88, sky: 0x000000, fog: null },
  mars: { ground: 0xa65a32, sky: 0x2a1a14, fog: 0x6b4a38 },
};

function beacon() {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.4, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
  col.position.y = 1.2; g.add(col);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  return g;
}

export function makeTerrainView(el, dem, body, { spots = 3 } = {}) {
  const L = LOOK[body], scene = new THREE.Scene();
  scene.background = new THREE.Color(L.sky);
  if (L.fog) scene.fog = new THREE.Fog(L.fog, 8, 26);
  const { geometry } = buildTerrain(dem);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1, metalness: 0 }));
  mesh.scale.y = EXAG; scene.add(mesh);
  scene.add(new THREE.HemisphereLight(body === "moon" ? 0x222222 : 0xbfd6ff, 0x2a2018, body === "moon" ? 0.15 : 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, body === "moon" ? 3.2 : 2.4); sun.position.set(-6, 5, 3); scene.add(sun);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 200);
  camera.position.set(0, 4, 6);
  const controls = new OrbitControls(camera, el);
  Object.assign(controls, { enablePan: false, enableDamping: true, minDistance: 0.6, maxDistance: 14, maxPolarAngle: Math.PI * 0.48 });

  const lay = layout(dem, spots), W = SETTINGS.windowKm;
  const h = (x, z) => sampleH(dem, x, z) * EXAG;
  const points = lay.spots.map((p, i) => {
    if (!p) return null;
    const b = beacon(); b.position.set(p.x, h(p.x, p.z), p.z); scene.add(b);
    return { i, x: p.x, z: p.z, obj: b, done: false };
  });
  let follow = null, dive = null;

  return {
    scene, camera, dem, points, start: lay.start,
    height: h,
    slopeAt(x, z) {
      const G = dem.G, j = Math.round((x / W + 0.5) * (G - 1)), i = Math.round((z / W + 0.5) * (G - 1));
      return i < 0 || j < 0 || i >= G || j >= G ? NaN : slopeDeg(dem, i * G + j);
    },
    add(o) { scene.add(o); },
    follow(o) { follow = o; },
    markDone(i) { const p = points[i]; if (p) { p.done = true; p.obj.children[0].material.opacity = 0.08; p.obj.children[1].material.color.set(0x9db0c6); } },
    /** Sinematik: kamera yukarıdan hedefe alçalır. */
    descend(target, dur = 3) { dive = { t: 0, dur, a: new THREE.Vector3(target.x + 6, target.y + 12, target.z + 10), b: new THREE.Vector3(target.x + 1.6, target.y + 1.1, target.z + 2.2), target }; },
    update(dt) {
      for (const p of points) if (p && !p.done) p.obj.rotation.y += dt;
      if (dive) {
        dive.t = Math.min(1, dive.t + dt / dive.dur); const e = 1 - (1 - dive.t) ** 3;
        camera.position.copy(dive.a).lerp(dive.b, e); controls.target.copy(dive.target); camera.lookAt(dive.target);
        if (dive.t >= 1) dive = null;
        return;
      }
      if (follow) {
        const d = follow.position.clone().sub(controls.target);
        controls.target.add(d); camera.position.add(d);
      }
      controls.update();
    },
    dispose() { controls.dispose(); disposeScene(scene); },
  };
}
