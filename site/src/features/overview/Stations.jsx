import React, { useMemo, useState } from "react";
import { t } from "../../i18n/index.js";
import { VARIABLES, stationResult } from "../variables/index.js";
import { exceedFraction } from "../compare/stats.js";
import StationCard from "../../hud/StationCard.jsx";
import { roverLimit } from "../game/data.js";

const ICON = { slope: "◢", relief: "⛰", rough: "≋", thermal: "🌡", mars_thermal: "◈", spectral: "✦" };

/** Six measurement cards (reference design). Status comes from each variable's data availability; a click opens the
 *  existing comparison card with real values (or "Data missing" with the reason). */
export default function Stations({ D, profile, reference, p, dems }) {
  const [cur, setCur] = useState(null);
  const lim = roverLimit(D.params, profile);
  const ctx = useMemo(() => ({ p, profile, reference, tE: D.tE, tM: D.tM, lim: lim && { ...lim, value: lim.num },
    stats: { ref: dems.r && lim ? exceedFraction(dems.r, lim.num) : null, cand: dems.c && lim ? exceedFraction(dems.c, lim.num) : null } }), [p, profile, reference, D, dems]);
  const i = VARIABLES.findIndex((v) => v.id === cur);
  const res = i >= 0 ? stationResult(VARIABLES[i], profile, ctx) : null;
  return (
    <>
      <div className="ov-stations">
        {VARIABLES.map((v, k) => {
          const st = v.availability(profile).status;
          return (
            <button key={v.id} className={"ov-st ov-st-" + st + (cur === v.id ? " on" : "")} onClick={() => setCur(cur === v.id ? null : v.id)} aria-pressed={cur === v.id}>
              <b aria-hidden="true">{ICON[v.id]}</b>
              <strong>{k + 1}. {t(v.titleKey)}</strong>
              <span>{t(st === "missing" ? "station.missing" : st === "limited" ? "station.limited" : "station.ok")}</span>
            </button>
          );
        })}
      </div>
      {res && (
        <div className="ov-stcard">
          <StationCard res={res} refTitle={t("ui.body." + profile)} candTitle={t("side.earth")} D={p?.D}
            onClose={() => setCur(null)} onNext={() => setCur(VARIABLES[(i + 1) % VARIABLES.length].id)} last={false} nextLabel={t("station.next")} />
        </div>
      )}
    </>
  );
}
