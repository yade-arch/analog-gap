import React, { useEffect, useRef } from "react";
import { t } from "../../i18n/index.js";
import { GAME, SUITS } from "./rules.js";
import { tf } from "./ui.jsx";

/** İnce oksijen çizgisi (oyunun tek sürekli öğesi). Seviye düşünce renk ve ritim değişir. */
export function Oxygen({ clock }) {
  return (
    <div className={"g-o2 g-o2-" + clock.level} role="timer" aria-label={tf("game.o2.aria", { l: clock.left, m: GAME.startMin })}>
      <div className="g-o2-fill" style={{ width: Math.round(clock.frac * 100) + "%" }} />
    </div>
  );
}

/** Karakterin başının yanında konuşma balonu; konum her karede anchorRef'ten (sahne izdüşümü). */
export function Speech({ text, anchorRef, onNext }) {
  const el = useRef(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const a = anchorRef.current, s = el.current;
      if (s) { if (a) { s.style.left = a.x + "px"; s.style.top = a.y + "px"; s.classList.remove("free"); } else s.classList.add("free"); }
      raf = requestAnimationFrame(tick);
    };
    tick(); return () => cancelAnimationFrame(raf);
  }, [anchorRef]);
  if (!text) return null;
  return <button ref={el} className="g-speech" onClick={onNext}>{text}<small>{t("game.say.next")}</small></button>;
}

export const Toast = ({ text }) => (text ? <div className="g-toast" role="status">{text}</div> : null);
export const Prompt = ({ text }) => (text ? <div className="g-prompt">{text}</div> : null);

/** Dokunmatik: yön pedi + eylem tuşları (yalnızca dokunmatik cihazda). */
export function TouchPad({ keys, actions }) {
  const hold = (k) => ({ onPointerDown: (e) => { e.preventDefault(); keys.current.add(k); }, onPointerUp: () => keys.current.delete(k), onPointerLeave: () => keys.current.delete(k) });
  return (
    <div className="g-touch">
      <div className="g-pad">{["w", "a", "s", "d"].map((k) => <button key={k} className={"g-pad-" + k} {...hold(k)} aria-label={t("game.key." + k)} />)}</div>
      <div className="g-acts">{actions.map(([k, label, fn]) => <button key={k} onClick={fn}>{label}</button>)}</div>
    </div>
  );
}

/** Kıyafet seçimi: iki seçenek, artı/eksi kısa; değerler Simülasyon varsayımı. Seçim astronotta görünür. */
export function SuitPick({ suit, setSuit, onConfirm, left }) {
  return (
    <div className="g-suits">
      {Object.values(SUITS).map((s) => (
        <button key={s.id} className={"g-suit" + (suit === s.id ? " on" : "")} onClick={() => setSuit(s.id)}>
          <strong>{t("game." + s.id)}</strong>
          <span>+ {t(`game.${s.id}.p1`)}</span><span>− {t(`game.${s.id}.c1`)}</span>
          <em>{tf("game.suit.time", { r: s.returnMin, s: GAME.cost.suit })} · {t("game.lbl.sim")}</em>
          {left < s.returnMin + GAME.cost.suit && <em className="g-warnline">{t("game.suit.short2")}</em>}
        </button>
      ))}
      <button className="g-go" disabled={!suit} onClick={onConfirm}>{t("game.suit.go")}</button>
    </div>
  );
}
