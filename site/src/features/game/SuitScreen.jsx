import { dangerMin } from "./data.js";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { t } from "../../i18n/index.js";
import { GAME, SUITS } from "./rules.js";
import { astronaut } from "./engine/voxel.js";
import { tf } from "./ui.jsx";

const STATS = ["dur", "spd", "o2", "cargo"];

function studio(w, h) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(w, h, false); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, w / h, 0.1, 20);
  cam.position.set(2.6, 1.0, 1.4); cam.lookAt(0, 0.55, 0);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x303040, 1.2)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(3, 4, 2); scene.add(d);
  return { r, scene, cam };
}

/** Kıyafet önizleme görselleri (bir kez çizilir, kartlarda resim olarak). */
function useShots() {
  const [shots, set] = useState({});
  useEffect(() => {
    const s = studio(220, 260), out = {};
    for (const id of Object.keys(SUITS)) { const a = astronaut(id); s.scene.add(a); s.r.render(s.scene, s.cam); out[id] = s.r.domElement.toDataURL(); s.scene.remove(a); }
    s.r.dispose(); set(out);
  }, []);
  return shots;
}

/** Büyük, dönen önizleme: seçilen kıyafet karakterin üstünde. */
function Preview({ suit }) {
  const el = useRef(null);
  useEffect(() => {
    const box = el.current, s = studio(box.clientWidth || 300, box.clientHeight || 400); box.appendChild(s.r.domElement);
    const a = astronaut(suit); s.scene.add(a); let raf = 0;
    const loop = () => { a.rotation.y += 0.01; a.userData.tick?.(0.016, false); s.r.render(s.scene, s.cam); raf = requestAnimationFrame(loop); };
    loop(); return () => { cancelAnimationFrame(raf); s.r.dispose(); s.r.domElement.remove(); };
  }, [suit]);
  return <div ref={el} className="g-suit-big" aria-label={t("game." + suit)} />;
}

/** Kıyafet seçimi: iki kart (görsel + özellikler), sağda büyük önizleme. Değerler Simülasyon varsayımı (rules.js). */
export default function SuitScreen({ suit, setSuit, onConfirm, left }) {
  const shots = useShots(), cur = suit || "suit1";
  return (
    <div className="g-suitscr">
      <div className="g-suit-l">
        <h2>{t("game.suit.title")}</h2>
        <div className="g-suit-cards">
          {Object.values(SUITS).map((s) => (
            <button key={s.id} className={"g-scard g-scard-" + s.id + (cur === s.id ? " on" : "")} onClick={() => setSuit(s.id)} aria-pressed={cur === s.id}>
              {shots[s.id] ? <img src={shots[s.id]} alt="" /> : <span className="g-shot" />}
              <strong>{t("game." + s.id)}</strong>
              {STATS.map((k) => <span key={k} className={"g-stat g-stat-" + k}><em>{t("game.stat." + k)}</em><i><b style={{ width: s.stats[k] + "%" }} /></i><u>{s.stats[k]}</u></span>)}
              <small>{tf("game.suit.time", { r: s.returnMin, s: GAME.cost.suit })}</small>
              <small className="g-effect">{tf("game.suit.effect", { d: dangerMin(s) })} {t(s.tolerant ? "game.suit.tol" : "game.suit.notol")}</small>
              {left < s.returnMin + GAME.cost.suit && <small className="g-warnline">{t("game.suit.short2")}</small>}
            </button>
          ))}
        </div>
        <button className="g-go g-pick" onClick={() => { if (!suit) setSuit(cur); onConfirm(cur); }}>{t("game.suit.go")}</button>
        <p className="g-note">{t("game.suit.sim")}</p>
      </div>
      <Preview suit={cur} />
    </div>
  );
}
