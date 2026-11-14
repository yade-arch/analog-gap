// Gezegen görünümü: doğrulanmış NASA dokulu küre, güneş ışığı (kameraya göre sabit açı), atmosfer kenar parıltısı
// (Dünya mavi, Mars ince kızıl, Ay yok), aday/referans işaretçileri, seçim ve kameranın bir noktaya uçuşu.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { angle, toLatLon, toXYZ } from "../../../components/globe/geo.js";
import { MOBILE, disposeScene, tex } from "./stage.js";

const BODY = {
  earth: { map: "earth_bmng_200412_2048.jpg", atmo: [0.35, 0.6, 1.0], atmoK: 1.0 },
  moon: { map: "moon_lroc_color_2048.jpg", bump: "moon_ldem_bump_1024.jpg", atmo: null },
  mars: { map: "mars_viking_clr_2048.jpg", atmo: [0.85, 0.5, 0.35], atmoK: 0.45 },
};

function atmosphere(rgb, k) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { c: { value: new THREE.Vector3(...rgb) }, k: { value: k } },
    vertexShader: "varying vec3 n; varying vec3 v; void main(){ vec4 w = modelViewMatrix*vec4(position,1.); n = normalize(normalMatrix*normal); v = normalize(-w.xyz); gl_Position = projectionMatrix*w; }",
    fragmentShader: "uniform vec3 c; uniform float k; varying vec3 n; varying vec3 v; void main(){ float f = pow(1.0 - abs(dot(n, v)), 3.0); gl_FragColor = vec4(c * f * k, f * k); }",
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 48), mat);
}

export function makePlanetView(el, body, { markers = [], onPick, color = 0x7fb2e0 } = {}) {
  const B = BODY[body], scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
  camera.position.set(0, 0.4, 3.4);
  const mat = new THREE.MeshStandardMaterial({ map: tex(B.map), roughness: 1, metalness: 0 });
  if (B.bump) { mat.bumpMap = tex(B.bump, false); mat.bumpScale = 3; }
  const seg = MOBILE ? 64 : 128, planet = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), mat);
  scene.add(planet);
  if (B.atmo) scene.add(atmosphere(B.atmo, B.atmoK));
  scene.add(new THREE.AmbientLight(0xffffff, 0.05));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); camera.add(sun); sun.position.set(-3, 1.5, 1); scene.add(camera);

  const pts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ vertexColors: true, size: MOBILE ? 7 : 6, sizeAttenuation: false }));
  pts.geometry.setAttribute("position", new THREE.Float32BufferAttribute(markers.flatMap((m) => toXYZ(m.lat, m.lon, 1.003)), 3));
  const cc = new THREE.Color();
  pts.geometry.setAttribute("color", new THREE.Float32BufferAttribute(markers.flatMap((m) => cc.set(m.color ?? color).toArray()), 3));
  scene.add(pts);
  const sel = new THREE.Mesh(new THREE.RingGeometry(0.006, 0.0095, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a, side: THREE.DoubleSide, depthTest: false }));
  sel.visible = false; scene.add(sel);

  const controls = new OrbitControls(camera, el);
  Object.assign(controls, { enablePan: false, enableDamping: true, minDistance: 1.12, maxDistance: 8, rotateSpeed: 0.45, zoomSpeed: 0.7 });
  let fly = null, down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onDown = (e) => { down = [e.clientX, e.clientY]; };
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || !onPick) return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(planet)[0]; if (!hit) return;
    const ll = toLatLon(hit.point.x, hit.point.y, hit.point.z), tol = 0.03 * (camera.position.length() - 0.9);
    let best = null, bd = tol;
    for (const m of markers) { const d = angle(ll, m); if (d < bd) { bd = d; best = m; } }
    if (best) onPick(best);
  };
  el.addEventListener("pointerdown", onDown); el.addEventListener("pointerup", onUp);

  return {
    scene, camera, planet,
    update(dt) {
      if (fly) {
        fly.t = Math.min(1, fly.t + dt / fly.dur);
        const e = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - (-2 * fly.t + 2) ** 2 / 2;
        camera.position.copy(fly.a).lerp(fly.b, e).setLength(fly.da + (fly.db - fly.da) * e);
        if (fly.t >= 1) fly = null;
      } else controls.update();
      camera.lookAt(0, 0, 0);
    },
    flyTo(lat, lon, dist = 2.2, dur = 1.6) {
      const b = new THREE.Vector3(...toXYZ(Math.max(-85, Math.min(85, lat)), lon, 1));
      fly = { a: camera.position.clone().normalize(), b, da: camera.position.length(), db: dist, t: 0, dur };
    },
    select(m) {
      sel.visible = !!m; if (!m) return;
      sel.position.set(...toXYZ(m.lat, m.lon, 1.004)); sel.lookAt(0, 0, 0);
    },
    setDistance(d) { camera.position.setLength(d); },
    dispose() { el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointerup", onUp); controls.dispose(); disposeScene(scene); },
  };
}
