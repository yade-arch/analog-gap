// Earth-to-Space Rescue panels (solo mode). Real values carry a tag (real / approximate / calculated / missing); game rules say so.
import React, { useEffect, useRef, useState } from "react";
import { t } from "../../i18n/index.js";
import { fmt } from "../../common.jsx";
import { tf } from "./ui.jsx";
import { EQUIP, RESCUE } from "./rules.js";
import { VARS, assess, suggest } from "./rescue.js";

export const Tag = ({ k }) => <span className={"rs-tag rs-tag-" + k}>{t("game.rs.tag." + k)}</span>;
const val = (v, d, u) => (v == null || Number.isNaN(v) ? null : `${fmt(v, d)} ${u}`);
// Well-known analog areas (approximate centres; the terrain values are fetched live for that point).
const SPOTS = [["Atacama Desert", -24.1, -69.9], ["Iceland lava fields", 64.85, -16.83], ["Devon Island", 75.38, -89.68], ["Mojave Desert", 35.0, -115.6], ["Namib Desert", -24.75, 15.35]];
export const siteName = (s) => (s.kind === "cand" ? tf("game.rs.site.cand", { id: s.id }) : s.name || t("game.rs.site.free"));
export const coords = (s) => `${fmt(Math.abs(s.center_lat), 3)}° ${s.center_lat >= 0 ? "N" : "S"}, ${fmt(Math.abs(s.center_lon), 3)}° ${s.center_lon >= 0 ? "E" : "W"}`;

/** Earth value vs target reference for one variable (typical P50 and steep part P90). Missing never shows as zero. */
export function VarRows({ s, truth }) {
  return VARS.map(([k, u, d]) => {
    const e = s.vars?.[k], r = truth.v?.[k];
    return (
      <div key={k} className="rs-row">
        <b>{t("pt.v." + k)}</b>
        <span>{t("game.rs.earth")} {e ? <>{val(e.p50, d, u)} <small>({t("game.rs.steepPart")} {val(e.p90, d, u)})</small> <Tag k={s.approx ? "approx" : "real"} /></> : <><em>{t("ui.noData")}</em> <Tag k="missing" /></>}</span>
        <span>{t("game.rs.target")} {r ? <>{val(r.p50, d, u)} <small>({t("game.rs.steepPart")} {val(r.p90, d, u)})</small> <Tag k="real" /></> : <em>{t("ui.noData")}</em>}</span>
      </div>
    );
  });
}

export function TempRows({ s, truth, profile }) {
  return (
    <div className="rs-row">
      <b>{t("game.rs.temp")}</b>
      <span>{t("game.rs.earth")} {s.thermal ? <>{tf("game.rs.temp.earth", { dt: fmt(s.thermal.dT_dn_K_median, 1), m: fmt(s.thermal.T_mean2_K_median - 273.15, 0) })} <Tag k="real" /></> : <><em>{t("game.rs.temp.none")}</em> <Tag k="missing" /></>}</span>
      <span>{t("game.rs.target")} {truth.thermal ? <>{tf("game.rs.temp.moon", { a: fmt(truth.thermal.temp_avg_K_p10_p50_p90[1], 0), n: truth.thermal.name })} <Tag k="real" /></> : <><em>{t("game.rs.temp.noMars")}</em> <Tag k="missing" /></>}</span>
      <small className="rs-warn">{t("game.rs.temp.notSame." + profile)}</small>
    </div>
  );
}

/** Earth team desk: investigate any place, compare alternatives, choose the one for the report. */
export function EarthDesk({ r, profile }) {
  const { S, truth } = r, s = r.site();
  return (
    <aside className="rs-desk" onPointerDown={(e) => e.stopPropagation()}>
      <h3>🌍 {tf("game.rs.desk.title", { b: t("ui.body." + profile) })}</h3>
      <div className="rs-sites">{SPOTS.map(([n, la, lo]) => <button key={n} className="g-btn2" onClick={() => r.investigate({ lat: la, lon: lo, free: true, name: n })}>{n}</button>)}</div>
      {S.sites.length > 0 && <div className="rs-tabs" role="tablist"><span className="rs-small">{t("game.rs.desk.checked")}</span>{S.sites.map((x) => (
        <button key={x.key} role="tab" aria-selected={x.key === S.focus} className={x.key === S.focus ? "on" : ""} onClick={() => r.focus(x.key)}>{x.letter}</button>
      ))}</div>}
      {s ? <SiteBox s={s} truth={truth} profile={profile} /> : <p className="rs-small">{t("game.rs.desk.empty")}</p>}
      {s && <div className="rs-acts">
        <button className="g-btn2" onClick={() => r.focus(null)}>{t("game.rs.another")}</button>
        <button className="g-go" disabled={s.status !== "ok"} onClick={r.chooseReport}>{t("game.rs.useThis")}</button>
      </div>}
    </aside>
  );
}

function SiteBox({ s, truth, profile }) {
  if (s.status === "load") return <p className="rs-small">{tf("game.rs.loading", { c: coords(s) })}</p>;
  if (s.status === "err") return <p className="rs-warn">{t("game.rs.loadErr")} ({s.err})</p>;
  if (s.status === "nodata") return <p className="rs-warn">{s.letter}: {t("game.rs.noLand")}</p>;
  const a = assess(s, truth);
  return (
    <div className="rs-site">
      <strong>{s.letter} · {siteName(s)}</strong> <span className="rs-small">{coords(s)}</span>
      <VarRows s={s} truth={truth} />
      {s.elev && <div className="rs-row"><b>{t("game.rs.elev")}</b><span>{fmt(s.elev.min, 0)} – {fmt(s.elev.max, 0)} m <Tag k="approx" /></span></div>}
      <TempRows s={s} truth={truth} profile={profile} />
      <div className="rs-row"><b>{t("game.rs.match")}</b><span>{s.D != null ? <>D = {fmt(s.D, 3)} <Tag k="calc" /> <small>{t("game.rs.matchMeans")}</small></> : <><em>{t(s.noDreason === "overlap" ? "game.rs.noD.overlap" : "game.rs.noD")}</em> <Tag k={s.noDreason === "overlap" ? "calc" : "missing"} /></>}</span></div>
      <p className={"rs-verdict rs-q-" + a.quality}>{t("game.rs.q." + a.quality)}</p>
      {s.approx && <p className="rs-small">⚠ {t("game.rs.approxNote")}</p>}
    </div>
  );
}

const Pick = ({ k, opts, v, set, hint, hl = "game.rs.dataSays" }) => (
  <fieldset className="rs-pick"><legend>{t("game.rs.pick." + k)}</legend>
    {opts.map((o) => <label key={o} className={v === o ? "on" : ""}><input type="radio" name={k} checked={v === o} onChange={() => set(o)} />{t("game.rs." + k + "." + o)}{hint === o && <em> · {t(hl)}</em>}</label>)}
  </fieldset>
);

/** Earth -> space: findings drafted from the data, plus the Earth team's advice. Sending costs time. */
export function Transmit({ r, profile }) {
  const s = r.site(r.S.report), a = assess(s, r.truth), sg = suggest(a), lim = r.truth.lim;
  const [rec, setRec] = useState(() => sg || { suit: "suit1", route: "safe", equip: "wheels" });
  const set = (k) => (v) => setRec({ ...rec, [k]: v });
  return (
    <div className="rs-modal"><div className="rs-card">
      <h2>📡 {tf("game.rs.tx.title", { b: t("ui.body." + profile) })}</h2>
      <p className="rs-small">{s.letter} · {siteName(s)} · {coords(s)}</p>
      <ul className="rs-find">
        <li>{a.siteSteep === null ? t("game.rs.f.slopeNone") : tf(a.siteSteep ? "game.rs.f.steep" : "game.rs.f.gentle", { p90: fmt(s.vars.slope.p90, 0), lim: lim?.num, who: t("game.rs.limWho." + profile) })}</li>
        <li>{s.vars?.rough ? tf("game.rs.f.rough", { v: fmt(s.vars.rough.p50, 2) }) : t("game.rs.f.roughNone")}</li>
        <li>{s.thermal ? t("game.rs.f.temp") : t("game.rs.f.tempNone")}</li>
        {s.approx && <li>{t("game.rs.f.approx")}</li>}
      </ul>
      <Pick k="suit" opts={["suit1", "suit2"]} v={rec.suit} set={set("suit")} hint={sg?.suit} />
      <Pick k="route" opts={["safe", "direct"]} v={rec.route} set={set("route")} hint={sg?.route} />
      <Pick k="equip" opts={EQUIP} v={rec.equip} set={set("equip")} hint={sg?.equip} />
      {!sg && <p className="rs-warn">{t("game.rs.tx.noAdvice")}</p>}
      <div className="rs-acts"><button className="g-btn2" onClick={r.back}>{t("game.rs.tx.back")}</button><button className="g-go" onClick={() => r.send(rec)}>{tf("game.rs.tx.send", { c: RESCUE.cost.send })}</button></div>
      <p className="g-note">{t("game.rs.gameRule")}</p>
    </div></div>
  );
}

/** Space astronaut: reads the Earth message, then picks suit, equipment and route. */
export function Loadout({ r }) {
  const m = r.S.sent, [load, setLoad] = useState({ ...m }), set = (k) => (v) => setLoad({ ...load, [k]: v });
  return (
    <div className="rs-modal rs-modal-low"><div className="rs-card">
      <h2>🧑‍🚀 {t("game.rs.lo.title")}</h2>
      <blockquote className="rs-msg">{tf("game.rs.lo.msg", { suit: t("game.rs.suit." + m.suit), route: t("game.rs.route." + m.route), equip: t("game.rs.equip." + m.equip) })}</blockquote>
      <Pick k="suit" opts={["suit1", "suit2"]} v={load.suit} set={set("suit")} hint={m.suit} hl="game.rs.earthSays" />
      <Pick k="route" opts={["safe", "direct"]} v={load.route} set={set("route")} hint={m.route} hl="game.rs.earthSays" />
      <Pick k="equip" opts={EQUIP} v={load.equip} set={set("equip")} hint={m.equip} hl="game.rs.earthSays" />
      <p className="rs-small">{t("game.rs.lo.effects")}</p>
      <button className="g-go" onClick={() => r.startDrive(load)}>{t("game.rs.lo.go")}</button>
      <p className="g-note">{t("game.rs.gameRule")}</p>
    </div></div>
  );
}

function useTick(read, ms = 200) {
  const [v, setV] = useState(read); const f = useRef(read); f.current = read;
  useEffect(() => { const id = setInterval(() => setV(f.current()), ms); return () => clearInterval(id); }, [ms]);
  return v;
}
const Gauge = ({ k, v }) => <div className={"rs-g" + (v < 25 ? " low" : "")}><span>{t("game.rs.g." + k)}</span><i><b style={{ width: Math.max(0, Math.round(v)) + "%" }} /></i><em>{Math.round(v)}%</em></div>;

/** Drive HUD: gauges, temperature line, mode switch, commands, supplies. */
export function DriveHud({ r, clock, hud, profile }) {
  const { S, truth, cmd } = r, h = useTick(() => hud.current?.p1) || {};
  const o2 = (clock.left / 300) * 100;
  return (
    <>
      <div className="rs-gauges">
        <Gauge k="o2" v={o2} /><Gauge k="energy" v={h.battery ?? 100} /><Gauge k="suit" v={S.suit} /><Gauge k="water" v={S.water} /><Gauge k="rover" v={h.health ?? 100} />
        <div className="rs-temp">🌡 {truth.thermal ? tf("game.rs.temp.out", { a: fmt(truth.thermal.temp_avg_K_p10_p50_p90[1], 0) }) : t("game.rs.temp.noMars")} · {t("game.rs.suitTemp." + (S.event?.kind === "cold" ? "cold" : S.water <= 0 ? "hot" : "ok"))}</div>
        <small className="g-note">{t("game.rs.gaugeNote")}</small>
      </div>
      {S.event && <div className={"rs-event rs-ev-" + S.event.kind}>{t("game.rs.ev." + S.event.kind + ".short")}</div>}
      <div className="rs-ctrl">
        <div className="rs-obj">📦 {tf("game.rs.obj", { n: S.collected.length, of: S.need })}</div>
        <div className="rs-mode" role="group">
          <button className={S.ctrl === "direct" ? "on" : ""} onClick={() => cmd.mode("direct")}>{t("game.rs.mode.direct")}</button>
          <button className={S.ctrl === "cmd" ? "on" : ""} onClick={() => cmd.mode("cmd")}>{t("game.rs.mode.cmd")}</button>
        </div>
        {S.ctrl === "direct" ? <p className="rs-small">{t("game.rs.mode.directHelp")}</p> : (
          <div className="rs-cmds">
            <button onClick={cmd.next}>{t("game.rs.cmd.next")}</button>
            <button onClick={cmd.scan}>{tf("game.rs.cmd.scan", { c: RESCUE.cost.scan })}</button>
            <button className={S.avoid ? "on" : ""} onClick={cmd.avoid}>{t("game.rs.cmd.avoid")}: {t(S.avoid ? "game.rs.on" : "game.rs.off")}</button>
            <button onClick={cmd.follow}>{tf("game.rs.cmd.follow", { r: t("game.rs.route." + (S.load?.route || "safe")) })}</button>
            <button onClick={cmd.stop}>{t("game.rs.cmd.stop")}</button>
            <button onClick={cmd.base}>{t("game.rs.cmd.base")}</button>
          </div>
        )}
        {h.atBase && S.collected.length > 0 && S.collected.length < S.need && <button className="g-go" onClick={cmd.endHere}>{t("game.rs.endHere")}</button>}
      </div>
    </>
  );
}

/** Decision moment: short question, options with their real costs. The clock keeps running. */
export function Decision({ r }) {
  const d = r.S.decision; if (!d) return null;
  const C = RESCUE.cost, hasBackup = r.S.load?.equip === "backup";
  const opts = {
    suit: [["continue", ""], ["backup", hasBackup ? tf("game.rs.cost", { c: C.switchSuit }) : t("game.rs.d.noBackup"), !hasBackup], ["rover", tf("game.rs.cost", { c: C.toRover })]],
    terrain: [["orig", ""], ["alt", t("game.rs.d.slower")], ["ask", tf("game.rs.cost", { c: C.askEarth })]],
    terrain2: [["orig", ""], ["alt", t("game.rs.d.slower")]],
    better: [["continue", ""], ["wait", tf("game.rs.cost", { c: C.waitAnalysis })], ["plan", t("game.rs.d.oneLess")]],
  }[d.id];
  const text = d.id === "terrain" || d.id === "terrain2" ? tf("game.rs.d.terrain.q", { max: fmt(d.scan.max, 0), pct: Math.round(d.scan.over * 100), lim: d.scan.lim }) : d.id === "better" ? tf("game.rs.d.better.q", { id: d.best.id }) : t("game.rs.d.suit.q");
  return (
    <div className="rs-modal" role="dialog" aria-live="assertive"><div className="rs-card rs-dec">
      <h2>⚠ {t("game.rs.d.title")}</h2><p>{text}</p>
      {opts.map(([o, note, off]) => <button key={o} className="g-btn2 rs-opt" disabled={!!off} onClick={() => r.decide(o)}><b>{t("game.rs.d." + d.id.replace("2", "") + "." + o)}</b>{note && <small> · {note}</small>}</button>)}
      <p className="g-note">{t("game.rs.d.clock")}</p>
    </div></div>
  );
}
