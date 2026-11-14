// Yakın arazi: yükseklik YALNIZCA gerçek DEM penceresinden (features/compare buildTerrain/sampleH/layout).
// Görsel katmanlar veri değildir: prosedürel yüzey dokusu, pencere dışı düz zemin, süs kayaları, yıldızlar, gökte Dünya.
// Dikey abartı EXAG. Test noktaları = layout() istasyonları. Sürüşte takip kamerası, diğer anlarda yörünge kamerası.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildTerrain } from "../../compare/terrainMesh.js";
import { layout, sampleH } from "../../compare/route.js";
import { slopeDeg, elev } from "../../compare/demLoader.js";
import { SETTINGS } from "../../../config.js";
import { disposeScene, tex } from "./stage.js";
import { rocks } from "./voxel.js";

export const EXAG = 2;
const LOOK = {
  earth: { ground: [176, 138, 99], rock: 0x8a6a4c, sky: 0x9cc3e6, fog: 0xbcd4ea },
  moon: { ground: [150, 148, 145], rock: 0x6f6d6a, sky: 0x02030a, fog: null },
  mars: { ground: [178, 96, 56], rock: 0x7a3a22, sky: 0x3a2318, fog: 0x8a5a40 },
};

function surfaceTex([r, g, b]) {                       // blok desenli yüzey (görsel; veri değil)
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
    const k = 0.82 + Math.random() * 0.3; x.fillStyle = `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`; x.fillRect(i * 4, j * 4, 4, 4);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 24);
  t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function stars() {
  const p = []; for (let i = 0; i < 1500; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(80); if (v.y > -5) p.push(v.x, v.y, v.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false }));
}

function beacon() {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x5fb4ff, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  col.position.y = 1.5; g.add(col);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: 0x5fb4ff, fog: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.05; g.add(ring);
  return g;
}

export function makeTerrainView(el, dem, body, { spots = 3 } = {}) {
  const L = LOOK[body], scene = new THREE.Scene();
  scene.background = new THREE.Color(L.sky);
  if (L.fog) scene.fog = new THREE.Fog(L.fog, 7, 30);
  const { geometry, zmed } = buildTerrain(dem);
  const mat = new THREE.MeshStandardMaterial({ map: surfaceTex(L.ground), roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, mat); mesh.scale.y = EXAG; scene.add(mesh);
  let zmin = Infinity; for (let k = 0; k < dem.z.length; k++) { const e = elev(dem, k); if (!Number.isNaN(e) && e < zmin) zmin = e; }
  const base = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: surfaceTex(L.ground.map((v) => v * 0.8)), roughness: 1 }));
  base.material.map.repeat.set(600, 600); base.rotation.x = -Math.PI / 2;
  base.position.y = ((zmin - zmed) / 1000) * EXAG - 0.05; scene.add(base);       // pencere dışı düz zemin (veri değil)
  const h = (x, z) => sampleH(dem, x, z) * EXAG;
  scene.add(rocks(h, L.rock, 260, SETTINGS.windowKm));
  if (body !== "earth") scene.add(stars());
  if (body === "moon") {                               // Ay güney kutbundan Dünya ufka yakın görünür (görsel)
    const earth = new THREE.Mesh(new THREE.SphereGeometry(3, 48, 32), new THREE.MeshStandardMaterial({ map: tex("earth_bmng_200412_2048.jpg"), roughness: 1, fog: false }));
    earth.position.set(-40, 9, -45); scene.add(earth);
  }
  scene.add(new THREE.HemisphereLight(body === "moon" ? 0x30323a : 0xbfd6ff, 0x2a2018, body === "moon" ? 0.25 : 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, body === "moon" ? 3 : 2.3); sun.position.set(-6, 5, 3); scene.add(sun);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 300);
  camera.position.set(0, 4, 6);
  const controls = new OrbitControls(camera, el);
  Object.assign(controls, { enablePan: false, enableDamping: true, minDistance: 0.6, maxDistance: 9, maxPolarAngle: Math.PI * 0.46 });

  const lay = layout(dem, spots), W = SETTINGS.windowKm;
  const points = lay.spots.map((p, i) => {
    if (!p) return null;
    const b = beacon(); b.position.set(p.x, h(p.x, p.z), p.z); scene.add(b);
    return { i, x: p.x, z: p.z, obj: b, done: false };
  });
  let follow = null, chase = null, dive = null;
  const tmp = new THREE.Vector3();

  return {
    scene, camera, dem, points, start: lay.start, height: h,
    slopeAt(x, z) {
      const G = dem.G, j = Math.round((x / W + 0.5) * (G - 1)), i = Math.round((z / W + 0.5) * (G - 1));
      return i < 0 || j < 0 || i >= G || j >= G ? NaN : slopeDeg(dem, i * G + j);
    },
    add(o) { scene.add(o); },
    follow(o) { follow = o; chase = null; },
    /** Takip kamerası: aracın arkasından (sürüş). */
    chase(o) { chase = o; follow = null; controls.enabled = false; },
    orbit(o) { chase = null; follow = o; controls.enabled = true; },
    markDone(i) { const p = points[i]; if (p) { p.done = true; p.obj.children[0].visible = false; p.obj.children[1].material.color.set(0x57d17a); } },   // biten: ışık söner, halka yeşil
    descend(target, dur = 3) { dive = { t: 0, dur, a: new THREE.Vector3(target.x + 6, target.y + 12, target.z + 10), b: new THREE.Vector3(target.x + 2.4, target.y + 1.3, target.z + 2.6), target }; },
    update(dt) {
      for (const o of scene.children) o.userData.tick?.(dt);
      for (const p of points) if (p && !p.done) p.obj.rotation.y += dt;
      if (dive) {
        dive.t = Math.min(1, dive.t + dt / dive.dur); const e = 1 - (1 - dive.t) ** 3;
        camera.position.copy(dive.a).lerp(dive.b, e); controls.target.copy(dive.target); camera.lookAt(dive.target);
        if (dive.t >= 1) dive = null;
        return;
      }
      if (chase) {
        const hd = chase.rotation.y, p = chase.position;
        tmp.set(p.x - Math.cos(hd) * 1.6, p.y + 0.75, p.z + Math.sin(hd) * 1.6);
        camera.position.lerp(tmp, Math.min(1, dt * 4)); camera.lookAt(p.x + Math.cos(hd) * 1.2, p.y + 0.3, p.z - Math.sin(hd) * 1.2);
        return;
      }
      if (follow) { const d = follow.position.clone().sub(controls.target); controls.target.add(d); camera.position.add(d); }
      controls.update();
    },
    dispose() { controls.dispose(); disposeScene(scene); },
  };
}
