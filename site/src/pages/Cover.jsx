// Home cover: full-bleed 3D stage. Hero planet rises from the bottom; the other two peek in at the left/right edges.
// Textures are the NASA maps already in the repo (data/tex): Blue Marble (Earth), LROC colour + LOLA relief (Moon), Viking mosaic (Mars).
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { tex } from "../features/game/engine/stage.js";
import "../cover.css";

const BODIES = ["earth", "moon", "mars"];
const LOOK = { earth: { map: "earth_bmng_200412_2048.jpg", glow: [0.35, 0.6, 1] }, moon: { map: "moon_lroc_color_2048.jpg", bump: "moon_ldem_bump_1024.jpg" }, mars: { map: "mars_viking_clr_2048.jpg", glow: [0.9, 0.55, 0.35] } };
const SUB = {
  earth: "Astronauts and rovers practise in Earth's harshest places before they go to the Moon and Mars. Find those places with real NASA elevation data.",
  moon: "The Moon has no air and very cold, steep crater rims. We look for Earth places whose ground is shaped like the lunar south pole.",
  mars: "Mars has dust, rocks and old lake craters like Jezero. We look for Earth places whose ground is shaped like it.",
};
const SLOT = { hero: { x: 0, y: -3.15, s: 2.6 }, left: { x: -4.3, y: 0.3, s: 0.95 }, right: { x: 4.3, y: 0.3, s: 0.95 } };

function rim(c) {
  return new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false, uniforms: { c: { value: new THREE.Color(...c) } },
    vertexShader: "varying vec3 n; void main(){ n = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "uniform vec3 c; varying vec3 n; void main(){ float k = pow(0.72 - dot(n, vec3(0.,0.,1.)), 3.); gl_FragColor = vec4(c, 1.) * k; }" });
}

export default function Cover({ setProfile }) {
  const host = useRef(null), [hero, setHero] = useState("earth"), st = useRef({});
  const slots = (h) => { const o = BODIES.filter((b) => b !== h); return { [h]: "hero", [o[0]]: "left", [o[1]]: "right" }; };

  useEffect(() => {
    const el = host.current, r = new THREE.WebGLRenderer({ antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(r.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.1, 200); cam.position.set(0, 0, 9);
    scene.add(new THREE.AmbientLight(0xffffff, 0.08)); const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(-4, 3, 5); scene.add(sun);
    const sg = new THREE.BufferGeometry(), N = 2500, P = [], C = [];   // star field (visual)
    for (let i = 0; i < N; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 60); P.push(v.x, v.y, v.z - 30); const w = Math.random(); C.push(0.8 + 0.2 * w, 0.85, 1 - 0.2 * w); }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.12, vertexColors: true })); scene.add(stars);
    const P3 = {};
    for (const b of BODIES) {
      const L = LOOK[b], m = new THREE.MeshStandardMaterial({ map: tex(L.map), roughness: 1 }); if (L.bump) { m.bumpMap = tex(L.bump, false); m.bumpScale = 3; }
      const g = new THREE.Group(), s = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), m); g.add(s);
      if (L.glow) g.add(new THREE.Mesh(new THREE.SphereGeometry(1.08, 64, 48), rim(L.glow)));
      const k = slots("earth")[b], t = SLOT[k]; g.position.set(t.x, t.y, 0); g.scale.setScalar(t.s); scene.add(g); P3[b] = { g, s, slot: k };
    }
    let mx = 0, my = 0, raf = 0;
    const mv = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    const size = () => { const w = el.clientWidth, h = el.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < 700 ? 55 : 40; cam.updateProjectionMatrix(); };
    const loop = () => {
      for (const b of BODIES) { const p = P3[b], t = SLOT[p.slot]; p.g.position.x += (t.x * Math.min(1, cam.aspect / 1.6) - p.g.position.x) * 0.06; p.g.position.y += (t.y - p.g.position.y) * 0.06; p.g.scale.setScalar(p.g.scale.x + (t.s - p.g.scale.x) * 0.06); p.s.rotation.y += 0.0015; }
      cam.position.x += (mx * 0.6 - cam.position.x) * 0.05; cam.position.y += (-my * 0.4 - cam.position.y) * 0.05; cam.lookAt(0, 0, 0); stars.rotation.y += 0.00008;
      r.render(scene, cam); raf = requestAnimationFrame(loop);
    };
    st.current = { P3 }; size(); loop(); addEventListener("resize", size); addEventListener("pointermove", mv);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("pointermove", mv);
      scene.traverse((o) => { o.geometry?.dispose(); const ms = [].concat(o.material || []); ms.forEach((x) => { x.map?.dispose(); x.bumpMap?.dispose(); x.dispose(); }); }); r.dispose(); r.domElement.remove(); };
  }, []);

  const pick = (b) => { setHero(b); const s = slots(b); for (const k of BODIES) if (st.current.P3) st.current.P3[k].slot = s[k]; if (b !== "earth") setProfile?.(b); };
  const s = slots(hero), side = (k) => BODIES.find((b) => s[b] === k);
  let x0 = null;
  return (
    <div className="cv" onPointerDown={(e) => { x0 = e.clientX; }} onPointerUp={(e) => { if (x0 != null && Math.abs(e.clientX - x0) > 60) pick(side(e.clientX < x0 ? "right" : "left")); x0 = null; }}>
      <div ref={host} className="cv-stage" />
      <nav className="cv-nav">
        <a className="cv-brand" href="#/start">space sync</a>
        <div className="cv-links"><a href="#/map">Explore</a><a href="#/compare">Compare</a><a href="#/list">My places</a><a href="#/game">Mission</a><a className="cv-cta" href="#/game">Launch</a></div>
      </nav>
      <button className="cv-side cv-l" onClick={() => pick(side("left"))}>{side("left").toUpperCase()}</button>
      <button className="cv-side cv-r" onClick={() => pick(side("right"))}>{side("right").toUpperCase()}</button>
      <div className="cv-mid">
        <div className="cv-eye">{hero === "earth" ? "PLANET" : "CELESTIAL BODY"}</div>
        <h1 key={hero}>{hero.toUpperCase()}</h1>
        <i className="cv-line" />
        <p>{SUB[hero]}</p>
        <a className="cv-go" href="#/game">GET STARTED</a>
      </div>
      <a className="cv-down" href="#/map" aria-label="Explore">↓</a>
      <small className="cv-data">Data: NASA Blue Marble · LRO LROC / LOLA · Viking MDIM</small>
    </div>
  );
}
