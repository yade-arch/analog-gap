import React from "react";
import { t } from "../../i18n/index.js";
import { Warn } from "../../common.jsx";
import MapView from "../../MapView.jsx";
import { GAME } from "./rules.js";
import CompareCard from "./CompareCard.jsx";
import { tf } from "./ui.jsx";

/** Aşama 2: Dünya haritasında aday pencereleri incele (her yeni pencere süre harcar), birini analog seç. */
export default function StageScout({ D, profile, cand, target, sel, inspected, onInspect, onChoose }) {
  return (
    <section className="g-scout">
      <p className="g-hint">{tf("game.scout.hint", { n: cand.features.length, c: GAME.cost.inspect })}</p>
      <div className="maprow g-maprow">
        <MapView data={cand} regions={D.regions} onSelect={onInspect} selectedId={sel?.id || null} />
        <div>
          {sel ? (
            <>
              <CompareCard p={sel} target={target} D={D} profile={profile} />
              <button className="btn-accent g-big" onClick={onChoose}>{t("game.scout.choose")}</button>
            </>
          ) : <div className="card"><p>{t("game.scout.empty")}</p></div>}
          <p className="muted">{tf("game.scout.count", { n: inspected })}</p>
          <Warn>{t("game.scout.warn")}</Warn>
        </div>
      </div>
    </section>
  );
}
