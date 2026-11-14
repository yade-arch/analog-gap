// Tek WebGL renderer, iki görünüm (sol: Dünya, sağ: Ay/Mars) scissor ile. Her görünümün kendi sahnesi, kamerası ve
// olay alanı (yarım ekran div) vardır; OrbitControls o div'e bağlanır. Düzen: "split" | "left" | "right".
import * as THREE from "three";

export const TOUCH = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
export const MOBILE = typeof matchMedia === "function" && matchMedia("(max-width: 900px), (pointer: coarse)").matches;

export function createStage(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(MOBILE ? 1.25 : 2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setScissorTest(true);
  renderer.domElement.className = "g-canvas";
  host.appendChild(renderer.domElement);
  const els = { left: document.createElement("div"), right: document.createElement("div") };
  for (const k of ["left", "right"]) { els[k].className = "g-half g-half-" + k; host.appendChild(els[k]); }

  const views = { left: null, right: null };
  let layout = "split", raf = 0, last = performance.now(), frameCbs = [];
  const rect = (k) => {
    const w = host.clientWidth, h = host.clientHeight;
    if (layout === "split") return k === "left" ? [0, 0, w / 2, h] : [w / 2, 0, w / 2, h];
    return layout === k ? [0, 0, w, h] : null;
  };
  const applyLayout = () => {
    for (const k of ["left", "right"]) {
      const r = rect(k), s = els[k].style;
      s.display = r ? "block" : "none";
      if (r) Object.assign(s, { left: r[0] + "px", width: r[2] + "px" });
    }
    host.dataset.layout = layout;
  };
  const resize = () => { renderer.setSize(host.clientWidth, host.clientHeight, false); applyLayout(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    renderer.setScissor(0, 0, host.clientWidth, host.clientHeight); renderer.setClearColor(0x000000); renderer.clear();
    for (const k of ["left", "right"]) {
      const v = views[k], r = rect(k); if (!v || !r) continue;
      v.update?.(dt);
      renderer.setViewport(...r); renderer.setScissor(...r);
      v.camera.aspect = r[2] / r[3]; v.camera.updateProjectionMatrix();
      renderer.render(v.scene, v.camera);
    }
    for (const cb of frameCbs) cb(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    els,
    setView(k, v) { views[k]?.dispose?.(); views[k] = v; },
    view: (k) => views[k],
    setLayout(l) { layout = l; applyLayout(); },
    /** Görünümdeki 3D noktanın ana alan içindeki piksel konumu (konuşma balonu için); görünmüyorsa null. */
    project(k, v3) {
      const v = views[k], r = rect(k); if (!v || !r) return null;
      const p = v3.clone().project(v.camera); if (p.z > 1) return null;
      return { x: r[0] + ((p.x + 1) / 2) * r[2], y: host.clientHeight - (r[1] + ((p.y + 1) / 2) * r[3]) };
    },
    onFrame(cb) { frameCbs.push(cb); return () => { frameCbs = frameCbs.filter((f) => f !== cb); }; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      for (const k of ["left", "right"]) { views[k]?.dispose?.(); els[k].remove(); }
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}

/** Yükleyici: data/tex altındaki doğrulanmış dokular (data_inventory.csv T1–T4). */
const loader = new THREE.TextureLoader();
export function tex(name, color = true) {
  const t = loader.load(import.meta.env.BASE_URL + "data/tex/" + name);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function disposeScene(scene) {
  scene.traverse((o) => {
    o.geometry?.dispose?.();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) { for (const key of ["map", "bumpMap"]) m[key]?.dispose?.(); m.dispose(); }
  });
}
