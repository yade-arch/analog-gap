import React, { useMemo, useState } from "react";
import { t } from "../../i18n/index.js";
import { Warn } from "../../common.jsx";
import MapView from "../../MapView.jsx";
import GlobeView from "../../components/GlobeView.jsx";
import { GAME } from "./rules.js";
import { candMarkers } from "./data.js";
import CompareCard from "./CompareCard.jsx";
import { tf } from "./ui.jsx";

/** Aşama 2: Dünya küresinde aday pencereleri gör; seçince 2D MapView + CompareCard (her yeni pencere süre harcar). */
export default function StageScout({ D, profile, cand, target, sel, inspected, onInspect, onChoose }) {
  const [view, setView] = useState("globe");
  const markers = useMemo(() => candMarkers(cand), [cand]);      // sayaç her saniye çizer; kamera sıfırlanmasın
  const pickGlobe = (m) => { if (m?.id) { onInspect(m.id); setView("2d"); } };
  return (
    <section className="g-scout">
      <p className="g-hint">{tf("game.scout.hint", { n: cand.features.length, c: GAME.cost.inspect })} {view === "globe" && t("game.scout.globehint")}</p>
      <div className="g-viewbar">
        {view === "globe"
          ? <button type="button" onClick={() => setView("2d")}>{t("game.scout.to2d")}</button>
          : <button type="button" onClick={() => setView("globe")}>← {t("game.scout.toglobe")}</button>}
      </div>
      <div className="maprow g-maprow">
        {view === "globe"
          ? <GlobeView body="earth" markers={markers} selectedId={sel?.id || null} onPick={pickGlobe} />
          : <MapView data={cand} regions={D.regions} onSelect={onInspect} selectedId={sel?.id || null} />}
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
