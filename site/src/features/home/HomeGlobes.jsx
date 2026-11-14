import React, { useMemo, useState } from "react";
import { fmt, Tag } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import GlobeView from "../../components/GlobeView.jsx";
import DLegend from "./DLegend.jsx";
import TargetPanel from "./TargetPanel.jsx";
import { dMarkers } from "./markers.js";

/** Seçili adayın kısa özeti: sıra, bölge, merkez, D (Hesaplanmış) ve sonraki adım bağlantıları. */
function Selected({ p, profile }) {
  if (!p) return <p className="muted">{t("home.pick")}</p>;
  return (
    <>
      <p><strong>{p.id}</strong> · {regionLabel(p.region)} · {t("home.sel.rank")} {p.rank}</p>
      <p>{t("home.sel.D")}: <strong>{fmt(p.D, 3)}</strong> <Tag kind="der" /></p>
      <p className="muted small">{t("home.sel.Dhint")}</p>
      <p className="muted small">{t("home.sel.coord")}: {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}°</p>
      <div className="home-links">
        <a className="btn-accent" href={`#/compare/${p.id}/${profile}`}>{t("home.sel.mission")} →</a>
        <a href={`#/card/${p.id}/${profile}`}>{t("home.sel.card")}</a>
      </div>
    </>
  );
}

/** Ana ekran küreleri: Dünya (aday pencereler, D rengi, arama bölgeleri) + hedef gövde. Ayrı parça: three.js yalnızca burada yüklenir. */
export default function HomeGlobes({ cand, regions, reference, profile }) {
  const markers = useMemo(() => dMarkers(cand), [cand]);
  const [sel, setSel] = useState(null);
  const p = useMemo(() => cand?.features.find((f) => f.properties.id === sel)?.properties, [cand, sel]);
  return (
    <div className="home-globes">
      <section className="card home-earth">
        <h3>{t("home.globe.earth.t")}</h3>
        <GlobeView body="earth" markers={markers} outlines={regions} selectedId={p ? sel : null} onPick={(m) => m.id && setSel(m.id)} />
        <p className="muted small">{t("home.globe.earth.d")}</p>
      </section>
      <div className="home-side">
        <section className="card">
          <h3>{t("home.sel.title")}</h3>
          <Selected p={p} profile={profile} />
          <DLegend />
        </section>
        <TargetPanel reference={reference} profile={profile} />
      </div>
    </div>
  );
}
