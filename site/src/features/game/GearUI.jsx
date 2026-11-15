// 2-player analog testing UI: Earth garage + stress meter (right), uplink + telemetry (left), loadout with Earth badges.
import React, { useEffect, useState } from "react";
import { t } from "../../i18n/index.js";
import { tf } from "./ui.jsx";
import { MODS6, SUITS6, badges, failsOn, testGear, FAIL_MIN } from "./gear.js";

const name = (k) => t("gear." + k);
const Grid = ({ kind, items, v, set, bd }) => (
  <div className="gr-grid">{Object.keys(items).map((k) => (
    <button key={k} className={"gr-item" + (v === k ? " on" : "")} onClick={() => set(k)}>
      <i style={{ background: "#" + (items[k].look?.body ?? items[k].color).toString(16).padStart(6, "0") }} />
      <b>{name(k)}</b>{bd?.[k] === "ok" ? <em className="gr-ok">✅</em> : bd?.[k] === "bad" ? <em className="gr-bad">❌</em> : bd?.[k] === "mix" ? <em>✅❌</em> : null}
      <small>{t("gear." + k + ".d")}</small>
    </button>))}</div>
);

/** Earth garage (G): swap suit and rover module at any time. */
export function Garage({ gear, setGear, onClose }) {
  return (
    <div className="gr-panel gr-right" onPointerDown={(e) => e.stopPropagation()}>
      <h3>🔧 {t("gear.garage")}</h3>
      <Grid kind="suit" items={SUITS6} v={gear.suit} set={(s) => setGear({ ...gear, suit: s })} />
      <Grid kind="mod" items={MODS6} v={gear.mod} set={(m) => setGear({ ...gear, mod: m })} />
      <button className="g-go" onClick={onClose}>{t("gear.close")}</button>
      <p className="g-note">{t("gear.rule")}</p>
    </div>
  );
}

/** Compact stress meter for the next Earth beacon (zone copied from the Moon/Mars beacon with the same number). */
export function Stress({ zone, gear }) {
  if (!zone) return null;
  const s = testGear(zone, gear.suit, gear.mod);
  return (
    <div className="gr-stress">
      <span>{tf("gear.next", { z: t("gear.z." + zone.type) + (zone.steep ? " + " + t("gear.z.steep") : "") })}</span>
      {["thermal", "traction", "hull"].map((k) => <div key={k} className={"gr-bar" + (s[k] >= 100 ? " bad" : "")}><em>{t("gear.s." + k)}</em><i><b style={{ width: s[k] + "%" }} /></i></div>)}
    </div>
  );
}

/** Uplink: 1.5 s Deep Space Network bar, then the telemetry pill on the left screen. */
export function Uplink({ log, onDone }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t0 = performance.now(), id = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / 1500); setP(k); if (k >= 1) { clearInterval(id); onDone(); } }, 50); return () => clearInterval(id); }, []);
  return <div className="gr-uplink">📡 {t("gear.uplinking")} <i><b style={{ width: p * 100 + "%" }} /></i></div>;
}

export function Telemetry({ log }) {
  const okC = log.filter((e) => e.ok).map((e) => `${name(e.suit)} + ${name(e.mod)}`), bad = [...new Set(log.filter((e) => !e.ok).map((e) => tf("gear.failed", { g: name(e.why === "cold" || e.why === "hot" ? e.suit : e.mod), z: t("gear.z." + e.why) })))];
  return <div className="gr-tele">📡 {t("gear.report")}: {bad.map((b) => "❌ " + b).join(" | ")}{bad.length && okC.length ? " | " : ""}{okC.length ? "✅ " + [...new Set(okC)].join(", ") : ""}{!log.length && t("gear.noTests")}</div>;
}

/** Left loadout: 6 suits + 6 modules with Earth badges (only after uplink). Shows how many zones the combo fails (game rule). */
export function Loadout({ zones, log, uplinked, onGo }) {
  const [g, setG] = useState({ suit: "carbon", mod: "mesh" }), bd = uplinked ? badges(log) : {}, f = failsOn(zones, g.suit, g.mod);
  return (
    <div className="gr-load">
      <div className="rs-card">
        <h2>🧑‍🚀 {t("gear.load")}</h2>
        <p className="rs-small">{uplinked ? t("gear.loadHelp") : t("gear.noUplink")}</p>
        <Grid kind="suit" items={SUITS6} v={g.suit} set={(s) => setG({ ...g, suit: s })} bd={bd} />
        <Grid kind="mod" items={MODS6} v={g.mod} set={(m) => setG({ ...g, mod: m })} bd={bd} />
        <ul className="rs-small">{zones.map((z) => { return <li key={z.i}>{tf("gear.zone", { n: z.i + 1, z: t("gear.z." + z.type) + (z.steep ? " + " + t("gear.z.steep") : ""), s: Math.round(z.slope) })}</li>; })}</ul>
        <button className="g-go" onClick={() => onGo(g, f)}>{t("gear.go")}</button>
        <p className="g-note">{tf("gear.rule2", { m: FAIL_MIN })}</p>
      </div>
    </div>
  );
}

let ac = null;
export function beep(f = 440, ms = 160) {   // short warning / ping tone (Web Audio); silent if audio is blocked
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.06; o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + ms / 1000); } catch { /* no audio */ }
}
