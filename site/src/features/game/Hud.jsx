import React, { useEffect, useRef, useState } from "react";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { tf } from "./ui.jsx";

/** rAF ile ref'ten okuyan küçük yardımcı: 3D sahne her karede React'i yeniden çizdirmez. */
function useTick(read, ms = 150) {
  const [v, setV] = useState(() => read());
  useEffect(() => { const id = setInterval(() => setV(read()), ms); return () => clearInterval(id); }, []);
  return v;
}

/** Üstte küçük oksijen yazısı (oyun saati; Simülasyon varsayımı). */
export const Oxygen = ({ clock }) => (
  <div className={"g-o2 g-o2-" + clock.level} role="timer">{tf("game.o2.text", { l: clock.left })}</div>
);

export const Location = ({ text, side = "left" }) => <div className={"g-loc g-loc-" + side}><span aria-hidden="true">📍</span> {text}</div>;

const Bar = ({ k, v }) => (
  <div className={"g-bar g-bar-" + k}><span>{t("game.hud." + k)}</span><i><b style={{ width: Math.round(v) + "%" }} /></i><em>%{Math.round(v)}</em></div>
);

/** Rover durumu (pil, yakıt, sağlamlık) + hız. Değerler oyun mekaniğidir. */
export function RoverHud({ hud, who, side = "left" }) {
  const s = useTick(() => hud.current?.[who]);
  if (!s) return null;
  return (
    <>
      <div className={"g-rhud g-rhud-" + side}><Bar k="battery" v={s.battery} /><Bar k="fuel" v={s.fuel} /><Bar k="health" v={s.health} /></div>
      <div className={"g-speed g-speed-" + side}>{tf("game.hud.speed", { v: Math.round(s.speed * 100) })}</div>
    </>
  );
}

/** Sıradaki test noktasının üstünde mesafe etiketi (DEM penceresi içindeki gerçek uzaklık). */
export function WaypointTags({ hud }) {
  const s = useTick(() => hud.current, 60);
  return ["p1", "p2"].map((k) => s?.[k]?.tag && (
    <div key={k} className="g-wtag" style={{ left: s[k].tag.x, top: s[k].tag.y }}>{tf("game.hud.dist", { m: s[k].tag.m })}</div>
  ));
}

/** Tek oyunculu: sağ üstte açılır-kapanır "Dünya Verileri" (analog bölgede toplanan testler). */
export function EarthPanel({ sel, n, of }) {
  const [open, setOpen] = useState(true), pct = Math.round((n / of) * 100);
  return (
    <button className={"g-earth" + (open ? "" : " closed")} onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="g-earth-t">🌍 {t("game.earth.title")}</span>
      {open && <><span className="g-earth-s">{sel ? regionLabel(sel.region) : ""} · {t(n < of ? "game.earth.collecting" : "game.earth.done")}</span><span className="g-ring" style={{ "--p": pct }}>%{pct}</span></>}
    </button>
  );
}

export const LinkBadge = ({ n, of }) => <div className="g-link"><i />{tf("game.link", { n, of })}</div>;

/** Konuşma balonu: karakterin başında; konum anchors ref'inden. */
export function Speech({ text, anchorRef, onNext }) {
  const el = useRef(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => { const a = anchorRef.current, s = el.current; if (s) { if (a) { s.style.left = a.x + "px"; s.style.top = a.y + "px"; s.classList.remove("free"); } else s.classList.add("free"); } raf = requestAnimationFrame(tick); };
    tick(); return () => cancelAnimationFrame(raf);
  }, [anchorRef]);
  if (!text) return null;
  return <button ref={el} className="g-speech" onClick={onNext}>{text}<small>{t("game.say.next")}</small></button>;
}

export const Toast = ({ text }) => (text ? <div className="g-toast" role="status">{text}</div> : null);
export const Prompt = ({ text }) => (text ? <div className="g-prompt">{text}</div> : null);

/** Keşif: bölge düğmeleri (Dünya'nın neresinde aday var). */
export const RegionBar = ({ regions, onGo }) => (
  <div className="g-regions">{regions.map((r) => <button key={r.code} onClick={() => onGo(r)}>{regionLabel(r.code)}</button>)}</div>
);

/** İniş kartı: seçilen yerin adı ve kısa durumu; "Buraya in". */
export const LandCard = ({ p, line, onLand, onCancel }) => (
  <div className="g-land">
    <span className="g-kicker">{t("game.land.kicker")}</span>
    <strong>{regionLabel(p.region)}</strong>
    <span>{tf("game.land.where", { lat: p.center_lat.toFixed(2), lon: p.center_lon.toFixed(2) })}</span>
    <span>{line}</span>
    <div><button className="g-go" onClick={onLand}>{t("game.land.go")}</button><button className="g-btn2" onClick={onCancel}>{t("game.land.other")}</button></div>
  </div>
);

/** Dokunmatik: yön pedi + güçlendirici (yalnızca dokunmatik cihazda). */
export function TouchPad({ keys, actions }) {
  const hold = (k) => ({ onPointerDown: (e) => { e.preventDefault(); keys.current.add(k); }, onPointerUp: () => keys.current.delete(k), onPointerLeave: () => keys.current.delete(k) });
  return (
    <div className="g-touch">
      <div className="g-pad">{["w", "a", "s", "d"].map((k) => <button key={k} className={"g-pad-" + k} {...hold(k)} aria-label={t("game.key." + k)} />)}</div>
      <div className="g-acts"><button {...hold("shift")}>{t("game.hud.boost")}</button>{actions.map(([k, label, fn]) => <button key={k} onClick={fn}>{label}</button>)}</div>
    </div>
  );
}
