import React from "react";
import { t } from "../i18n/index.js";
import { VARIABLES } from "../features/variables/index.js";

/** İstasyon çubuğu: her istasyon tıklanır; ziyaret edilenler işaretlenir. Veri eksik istasyon da ziyaret edilir ("Veri eksik" kaydı). */
export default function StationBar({ profile, cur, visited, onVisit, busy }) {
  return (
    <div className="hud-panel stations">
      <div className="cards">
        {VARIABLES.map((v) => {
          const a = v.availability(profile), seen = visited.has(v.id);
          return (
            <button key={v.id} className={"station " + a.status + (seen ? " seen" : "") + (cur === v.id ? " cur" : "")} title={a.note} aria-pressed={cur === v.id} disabled={busy} onClick={() => onVisit(v.id)}>
              <span className="dia" aria-hidden="true" />
              <b>{VARIABLES.indexOf(v) + 1}. {t(v.titleKey)}</b>
              <small>{seen ? t("station.seen") : t("station." + a.status)}</small>
            </button>
          );
        })}
      </div>
      <p className="hud-note">{t("station.foot")} {visited.size}/{VARIABLES.length}</p>
    </div>
  );
}