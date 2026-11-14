// Ana ekran küresi (three.js). Yalnızca görsel: NASA dokulu küre, yavaş dönüş, sürükleyerek döndürme, tekerlek/iki parmakla hafif yakınlaştırma.
// Dünya/Mars'ta ince atmosfer parıltısı (fresnel, arka yüz), Ay'da yok. Dokular tembel yüklenir ve önbellekte tutulur; dispose() her şeyi bırakır.
import * as THREE from "three";

const cache = new Map();
const loader = new THREE.TextureLoader();
function tex(name) {
  if (!cache.has(name)) cache.set(name, new Promise((ok, no) => loader.load(import.meta.env.BASE_URL + "data/tex/" + name, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, no)));
  return cache.get(name);
}
const GLOW_VS = "varying vec3 vN; varying vec3 vV; void main(){ vec4 p = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }";
const GLOW_FS = "uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c, f * .9); }";

export function webglOk() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }

export function createHeroGlobe(host) {
  const mobile = innerWidth < 700;
  const r = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5));
  host.appendChild(r.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const seg = mobile ? 64 : 128;
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), mat);
  const glowMat = new THREE.ShaderMaterial({ vertexShader: GLOW_VS, fragmentShader: GLOW_FS, uniforms: { c: { value: new THREE.Color("#6fb2ff") } }, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 32), glowMat);
  scene.add(globe, glow, new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-3, 2, 4); scene.add(sun);
  let seq = 0, dist = 4.6, rotY = 0, rotX = 0.25, drag = null, pinch = null, raf = 0, alive = true;
  const fit = () => { const w = host.clientWidth, h = host.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const loop = () => {
    if (!alive) return;
    if (!drag) rotY += 0.0012;
    globe.rotation.set(rotX, rotY, 0);
    cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0);
    r.render(scene, cam); raf = requestAnimationFrame(loop);
  };
  const el = r.domElement; el.style.touchAction = "pan-y";
  const pts = new Map();
  const down = (e) => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 1) drag = [e.clientX, e.clientY]; else { drag = null; const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } el.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); dist = Math.min(5.6, Math.max(4.4, dist * (pinch / d))); pinch = d; return; }
    if (drag) { rotY += (e.clientX - drag[0]) * 0.005; rotX = Math.max(-1.2, Math.min(1.2, rotX + (e.clientY - drag[1]) * 0.003)); drag = [e.clientX, e.clientY]; }
  };
  const up = (e) => { pts.delete(e.pointerId); drag = null; pinch = null; };
  const wheel = (e) => { e.preventDefault(); dist = Math.min(5.6, Math.max(4.4, dist + e.deltaY * 0.0015)); };
  el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", wheel, { passive: false });
  const ro = new ResizeObserver(fit); ro.observe(host); fit(); loop();
  return {
    async setBody(b) {
      const my = ++seq;                                  // geç gelen eski doku yeni seçimin üstüne yazmasın
      glow.visible = !!b.glow; if (b.glow) glowMat.uniforms.c.value.set(b.glow);
      const [m, bump] = await Promise.all([tex(b.tex.map), b.tex.bump ? tex(b.tex.bump) : null]);
      if (!alive || my !== seq) return;
      mat.map = m; mat.bumpMap = bump; mat.bumpScale = bump ? 2 : 0; mat.needsUpdate = true;
    },
    dispose() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect();
      globe.geometry.dispose(); glow.geometry.dispose(); mat.dispose(); glowMat.dispose(); r.dispose(); el.remove();   // dokular önbellekte kalır (geri dönüşte yeniden indirilmez)
    },
  };
}
