import React, { useMemo, useState } from "react";
import { PROFILES, Warn } from "../common.jsx";
import MapView from "../MapView.jsx";
import GlobeView from "../components/GlobeView.jsx";
import PageIntro from "../components/PageIntro.jsx";
import DLegend from "../features/home/DLegend.jsx";
import { D_SCALE, dMarkers } from "../features/home/markers.js";
import { t } from "../i18n/index.js";
import "../features/home/home.css";

const VIEWS = ["globe", "flat"];

export default function MapPage({ cand, profile, D, onSelect }) {
  const P = PROFILES[profile];
  const [view, setView] = useState("globe");
  const markers = useMemo(() => dMarkers(cand), [cand]);
  const shown = t("map.shown").replace("{n}", cand.features.length).replace("{total}", cand.meta.n_windows_total).replace("{pass}", cand.meta.n_pass_filter);
  return (
    <div>
      <PageIntro purpose={t("map.purpose")} how={t("map.how")} />
      <div className="map-views" role="group" aria-label={t("map.view")}>
        {VIEWS.map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{t("map.view." + v)}</button>)}
      </div>
      <div className="maprow">
        {view === "globe"
          ? <GlobeView body="earth" markers={markers} colorScale={D_SCALE} outlines={D.regions} onPick={(m) => m.id && onSelect(m.id)} />
          : <MapView data={cand} regions={D.regions} onSelect={onSelect} selectedId={null} />}
        <div>
          <div className="card">
            <h3>{P.name}</h3>
            <p className="muted">{t(`profile.${profile}.tr`)} · {P.sub}</p>
            <DLegend />
            <p>{shown}</p>
            {view === "globe" && <p className="muted small">{t("map.globe.flatNote")}</p>}
          </div>
          <Warn>{t("map.warn")}</Warn>
        </div>
      </div>
    </div>
  );
}
