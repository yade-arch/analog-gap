import React, { useMemo, useState } from "react";
import { Warn } from "../common.jsx";
import MapView from "../MapView.jsx";
import GlobeView from "../components/GlobeView.jsx";
import DLegend from "../features/home/DLegend.jsx";
import { D_SCALE, dMarkers } from "../features/home/markers.js";
import { t } from "../i18n/index.js";
import RegionCard from "../features/world/RegionCard.jsx";
import RefCard from "../features/ui/RefCard.jsx";
import RegionPanel from "../features/ui/RegionPanel.jsx";
import PlaceSearch from "../features/ui/PlaceSearch.jsx";
import "../features/home/home.css";
import "../features/ui/glass.css";

const VIEWS = ["globe", "flat"];
const PHOTO = import.meta.env.BASE_URL + "data/tex/earth_bmng_200412_5400.jpg";   // sharper NASA Blue Marble (same product, 5400 px)

// Harita: solda referans kartı, sağda 3B küre / 2B harita; "Ek bilgiler" açılır kutusu gerçek sayılarla (meta). Bölge kartı ve uyarı altta.
export default function MapPage({ cand, candAll, region, setRegion, profile, D, onSelect }) {
  const [view, setView] = useState("globe"), [sel, setSel] = useState(null);
  const markers = useMemo(() => dMarkers(cand), [cand]);
  const refs = useMemo(() => ({ moon: D.rm, mars: D.rs }), [D.rm, D.rs]);
  const m = cand.meta;
  return (
    <div className="glass">
      <div className="mapgrid">
        <div>
          {sel ? <RegionPanel sel={sel} cand={candAll || cand} target={profile} refs={refs} onSelect={onSelect} onClose={() => setSel(null)} />
            : <RefCard target={profile} reference={profile === "moon" ? D.rm : D.rs} tM={D.tM} />}
        </div>
        <div className="g-card mappanel">
          <div className="viewtabs" role="group" aria-label={t("map.view")}>
            {VIEWS.map((v) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{v === "globe" ? "🌐 3D Globe" : "🗺 2D Map"}</button>)}
            <span className="muted small pick-hint">{t("ui.pickHint")}</span>
          </div>
          <PlaceSearch onPick={setSel} />
          <details className="g-card extra">
            <summary>ⓘ {t("ui.extra")}</summary>
            <dl className="stats three">
              <div><dt>{t("ui.scanned")}</dt><dd>{m.n_windows_total}</dd></div>
              <div><dt>{t("ui.passed")}</dt><dd>{m.n_pass_filter}</dd></div>
              <div><dt>{t("ui.shown")}</dt><dd>{cand.features.length}</dd></div>
            </dl>
            <DLegend />
            <p className="muted small">{t("map.how")} {t("ui.photoSrc")} {view === "globe" ? t("map.globe.flatNote") : ""}</p>
            <RegionCard code={region} regions={D.regions} cand={candAll || cand} target={profile} tE={D.tE} known={D.known} onSelect={onSelect} />
            <Warn>{t("map.warn")}</Warn>
          </details>
          <div className="darkstage">
            {view === "globe"
              ? <GlobeView body="earth" markers={markers} colorScale={D_SCALE} outlines={D.regions} photo={PHOTO} onPick={(x) => (x.id ? onSelect(x.id) : x.lat != null && setSel({ lat: x.lat, lon: x.lon }))} />
              : <MapView data={cand} regions={D.regions} onSelect={onSelect} onRegion={setRegion} onPoint={setSel} selectedId={null} />}
          </div>
        </div>
      </div>
    </div>
  );
}
