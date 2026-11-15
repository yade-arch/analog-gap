// STORY MODE: the robot explains, step by step, why an Earth place looks like the Moon or Mars, using the real comparison values
// (same D, d_k, P10/P50/P90 as the rest of the app). Nothing is invented; missing values say so.
import React, { useEffect, useState } from "react";
import "../guide.css";
import { t } from "../i18n/index.js";
import { tf } from "../features/game/ui.jsx";
import { fmt } from "../common.jsx";
import { RobotSays } from "../features/guide/Robot.jsx";
import PlacePicker from "../features/guide/PlacePicker.jsx";
import { analysePoint, pointCand } from "../features/planet/pointAnalysis.js";
import { dCut } from "../features/game/data.js";
import { GAME } from "../features/game/rules.js";

const V = [["slope", "°", 1], ["relief", "m", 0], ["rough", "m", 2]];
const STEPS = ["meet", "slope", "rough", "relief", "diff", "end"];

function words(step, p, ref, body, cand) {
  const c = p.derived_percentiles || {}, r = ref?.variables || {}, d = p.d || {};
  const cmp = (k, dg, u) => (c[k] && r[k] ? tf("gd.st.vals", { e: `${fmt(c[k].p50, dg)} ${u}`, b: `${fmt(r[k].p50, dg)} ${u}`, body }) : t("gd.st.missing"));
  if (step === "meet") return tf("gd.st.meet", { body });
  if (step === "slope") return `${t(d.slope == null ? "gd.st.slope.na" : d.slope <= GAME.similarD ? "gd.st.slope.same" : "gd.st.slope.diff")} ${cmp("slope", 1, "°")}`;
  if (step === "rough") { const m = c.rough && r.rough ? (c.rough.p50 > r.rough.p50 * 1.1 ? "more" : c.rough.p50 < r.rough.p50 * 0.9 ? "less" : "same") : "na"; return `${tf("gd.st.rough." + m, { body })} ${cmp("rough", 2, "m")}`; }
  if (step === "relief") return `${t("gd.st.relief")} ${cmp("relief", 0, "m")}`;
  if (step === "diff") {
    const big = V.filter(([k]) => d[k] != null && d[k] > GAME.similarD).map(([k]) => t("pt.v." + k).toLowerCase());
    return `${t("gd.st.diff")} ${big.length ? tf("gd.st.diff.list", { v: big.join(", ") }) : t("gd.st.diff.none")} ${tf("gd.st.diff.not", { body })}`;
  }
  const cut = dCut(cand);
  if (p.D == null) return t("gd.st.end.noD");
  return `${tf("gd.st.end", { body, D: fmt(p.D, 3) })} ${t(cut != null && p.D <= cut ? "gd.st.end.good" : "gd.st.end.weak")} ${tf("gd.st.end.warn", { body })}`;
}

export default function Story({ D, profile, setProfile, cand }) {
  const [place, setPlace] = useState(null), [p, setP] = useState(null), [st, setSt] = useState("idle"), [i, setI] = useState(0);
  const ref = profile === "moon" ? D.rm : D.rs, body = t("ui.body." + profile);
  useEffect(() => {
    setI(0); if (!place) return undefined; let live = true;
    if (place.kind === "cand") { setP(cand.features.find((f) => f.properties.id === place.id)?.properties || null); setSt("ok"); return undefined; }
    setSt("load");
    analysePoint(place.lat, place.lon, { moon: D.rm, mars: D.rs }).then((r) => { if (!live) return; if (r.missing || !r.P?.slope) { setSt("nodata"); return; } setP(pointCand(r, profile)); setSt("ok"); })
      .catch(() => live && setSt("err"));
    return () => { live = false; };
  }, [place?.lat, place?.lon, profile]);
  const step = STEPS[i], c = p?.derived_percentiles || {}, r = ref?.variables || {};
  const show = { slope: ["slope"], rough: ["rough"], relief: ["relief"], diff: ["slope", "relief", "rough"], end: ["slope", "relief", "rough"] }[step] || [];
  return (
    <div className="gd-page">
      <div className="gd-head">
        <h1>{t("gd.story.title")}</h1>
        <div className="gd-planet" role="group">{["moon", "mars"].map((b) => <button key={b} className={profile === b ? "on" : ""} onClick={() => setProfile(b)}>{t("ui.body." + b)}</button>)}</div>
        <PlacePicker cand={cand} onPick={setPlace} value={place?.kind === "cand" ? "c:" + place.id : ""} />
      </div>
      {!place && <RobotSays text={tf("gd.story.hello", { body })} />}
      {place && st === "load" && <RobotSays text={t("gd.loading")} />}
      {place && (st === "err" || st === "nodata") && <RobotSays text={t(st === "err" ? "gd.err" : "gd.nodata")} />}
      {place && st === "ok" && p && (
        <>
          <div className="gd-pair">
            <div className="gd-ter"><b>🌍 {t("gd.earth")}: {place.label}</b>{p.onDemand && <small> · {t("game.rs.tag.approx")}</small>}
              {show.map((k) => { const [, u, dg] = V.find((v) => v[0] === k); return <div key={k} className="gd-val">{t("pt.v." + k)}: <strong>{c[k] ? `${fmt(c[k].p50, dg)} ${u}` : t("ui.noData")}</strong></div>; })}
            </div>
            <div className="gd-ter gd-ter-t"><b>{profile === "moon" ? "🌕" : "🔴"} {body}: {ref?.label}</b>
              {show.map((k) => { const [, u, dg] = V.find((v) => v[0] === k); return <div key={k} className="gd-val">{t("pt.v." + k)}: <strong>{r[k] ? `${fmt(r[k].p50, dg)} ${u}` : t("ui.noData")}</strong></div>; })}
              {step === "end" && <div className="gd-val">{t("gd.dName")}: <strong>{p.D != null ? fmt(p.D, 3) : t("ui.noData")}</strong></div>}
            </div>
          </div>
          <RobotSays text={words(step, p, ref, body, cand)}>
            <div className="gd-nav">
              <span>{tf("gd.step", { n: i + 1, of: STEPS.length })}</span>
              <button className="g-btn2" disabled={i === 0} onClick={() => setI(i - 1)}>{t("gd.prev")}</button>
              <button className="g-go" disabled={i === STEPS.length - 1} onClick={() => setI(i + 1)}>{t("gd.next")}</button>
              <button className="g-btn2" onClick={() => setI(0)}>{t("gd.restart")}</button>
              <button className="g-btn2" onClick={() => { setPlace(null); setP(null); }}>{t("gd.exit")}</button>
            </div>
          </RobotSays>
          <details className="card gd-sci"><summary>{t("game.rs.sci.title")}</summary>
            <table><thead><tr><th></th><th>{t("gd.earth")} P10 / P50 / P90</th><th>{body} P10 / P50 / P90</th><th>d_k</th><th>O_k</th></tr></thead><tbody>
              {V.map(([k, u, dg]) => <tr key={k}><td>{t("pt.v." + k)} ({u})</td><td>{c[k] ? [c[k].p10, c[k].p50, c[k].p90].map((x) => fmt(x, dg)).join(" / ") : t("ui.noData")}</td><td>{r[k] ? [r[k].p10, r[k].p50, r[k].p90].map((x) => fmt(x, dg)).join(" / ") : t("ui.noData")}</td><td>{fmt(p.d?.[k], 3)}</td><td>{fmt(p.O?.[k], 2)}</td></tr>)}
            </tbody></table>
            <p className="small">{t("gd.formula")}</p>
            <p className="small">{p.onDemand ? t("game.rs.approxNote") : "Earth: NASADEM_HGT v001 (NASA, 30 m)."} {body}: {String(ref?.dem || "").replace("ortalama", "average")}.</p>
            <p className="small">{t("gd.limits")}</p>
          </details>
        </>
      )}
    </div>
  );
}
