import React from "react";
import { t } from "../../i18n/index.js";
import { PROFILES, Tag } from "../../common.jsx";
import { GAME } from "./rules.js";
import { refOf, targetThermal, VAR_KEYS } from "./data.js";
import { Lbl, Missing, N, tf } from "./ui.jsx";

const UNITS = { slope: "°", relief: "m", rough: "m" };

/** Aşama 1: acil durum brifingi, hedef ortamın bilinen ve bilinmeyen özellikleri. */
export default function StageBrief({ D, profile, setProfile, onStart }) {
  const ref = refOf(D, profile), th = targetThermal(D.tM, profile);
  return (
    <section className="g-brief">
      <div className="g-alert" role="alert">
        <strong>{t("game.brief.alert")}</strong>
        <p>{t("game.brief.story." + profile)}</p>
      </div>
      <div className="g-choice" role="group" aria-label={t("profile.label")}>
        {["moon", "mars"].map((k) => (
          <button key={k} className={profile === k ? "on" : ""} aria-pressed={profile === k} onClick={() => setProfile(k)}>
            {t("game.target." + k)}<small>{PROFILES[k].name}</small>
          </button>
        ))}
      </div>
      <div className="g-grid2">
        <div className="card">
          <h3>{t("game.brief.known")} <Tag kind="obs" /><Tag kind="der" /></h3>
          <p className="muted">{ref?.label} · {ref?.dem}</p>
          <table className="g-table">
            <thead><tr><th>{t("game.var")}</th><th>P10</th><th>P50</th><th>P90</th></tr></thead>
            <tbody>
              {VAR_KEYS.map((k) => (
                <tr key={k}><td>{t("game.var." + k)}</td>
                  {["p10", "p50", "p90"].map((q) => <td key={q}><N v={ref?.variables?.[k]?.[q]} u={UNITS[k]} /></td>)}</tr>
              ))}
            </tbody>
          </table>
          <h4>{t("game.thermal")}</h4>
          {th ? (
            <>
              <ul className="g-list">
                {th.map((w) => <li key={w.id}>{w.id} ({w.name}): {t("game.th.avg")} P50 <N v={w.avg?.[1]} u="K" /> · {t("game.th.max")} P50 <N v={w.max?.[1]} u="K" /></li>)}
              </ul>
              <p className="muted">{D.tM?.product} · {t("game.th.dtdn")}: <Missing /></p>
            </>
          ) : <p><Missing /> — {t("game.th.mars")}</p>}
        </div>
        <div className="card">
          <h3>{t("game.brief.unknown")} <Tag kind="int" /></h3>
          <ul className="g-list">
            {["geology", "dust", "subsurface", "spectral"].map((k) => <li key={k}>{t("game.unk." + k)}: <span className="g-missing">{t("game.outscope")}</span></li>)}
            {!th && <li>{t("game.thermal")}: <Missing /></li>}
            {th && <li>{t("game.th.dtdn")}: <Missing /></li>}
          </ul>
          <h4>{t("game.brief.budget")} <Lbl k="sim" /></h4>
          <p>{tf("game.brief.budget.d", { min: GAME.startMin, ins: GAME.cost.inspect, test: GAME.cost.test, suit: GAME.cost.suit })}</p>
          <button className="btn-accent g-big" onClick={onStart}>{t("game.brief.start")}</button>
        </div>
      </div>
    </section>
  );
}
