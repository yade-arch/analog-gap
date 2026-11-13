import React from "react";
import { PROFILES, Tag, Warn } from "../common.jsx";
import MapView from "../MapView.jsx";
import PageIntro from "../components/PageIntro.jsx";
import { t } from "../i18n/index.js";

export default function MapPage({ cand, profile, D, onSelect }) {
  const P = PROFILES[profile];
  return (
    <div>
      <PageIntro purpose={t("map.purpose")} how={t("map.how")} />
      <div className="maprow">
        <MapView data={cand} regions={D.regions} onSelect={onSelect} selectedId={null} />
        <div>
          <div className="card">
            <h3>{P.name}</h3>
            <p className="muted">{t(`profile.${profile}.tr`)} · {P.sub}</p>
            <div className="legend"><span>yakın</span><span className="bar" /><span>uzak (D)</span></div>
            <p>{t("map.legend")} <Tag kind="der" /></p>
            <p className="muted">Palet tek yönlüdür; iyi/kötü anlamı yoktur. Kesikli çizgi: arama bölgesi.</p>
            <p>Gösterilen: bölge başına filtreyi geçen en iyi 250 pencere ({cand.features.length}). Toplam {cand.meta.n_windows_total} pencere tarandı; filtreyi geçen {cand.meta.n_pass_filter}.</p>
          </div>
          <Warn>Mesafe yalnızca topografik dağılım yakınlığıdır; termal, regolit, spektral, atmosfer, yerçekimi ve radyasyon karşılaştırılamaz. Bkz. Gap paneli.</Warn>
        </div>
      </div>
    </div>
  );
}
