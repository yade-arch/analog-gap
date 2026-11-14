import React from "react";
import { fmt } from "../../common.jsx";
import { Term } from "../../components/PageIntro.jsx";
import { t } from "../../i18n/index.js";
import { SETTINGS } from "../../config.js";
import { REF_NAME } from "../world/known.js";
import ReliefThumb from "./ReliefThumb.jsx";

// Referans bölge kartı (Ay/Mars). Değerler dosyadan: tipik eğim ve yükseklik farkı (reference_*.json P50), sıcaklık yalnız Ay (Diviner, model).
const c = (k) => (k == null ? null : k - 273.15);
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

export default function RefCard({ target, reference, tM, wide }) {
  const v = reference?.variables || {};
  const moonT = target === "moon" ? med(Object.values(tM?.windows || {}).map((w) => w.temp_avg_K_p10_p50_p90?.[1])) : null;
  return (
    <div className={"g-card refcard" + (wide ? " wide" : "")}>
      <ReliefThumb id={SETTINGS.references[target][0]} body={target} label={t("side." + target)} h={wide ? 170 : 200} />
      <div className="refcard-main">
        <div className="g-kicker">{t("ui.refRegion")}</div>
        <h2 className="g-h">{REF_NAME[target]}</h2>
        <p className="muted">{t("ui.refDesc." + target)}</p>
      </div>
      <div className="refcard-stats">
        <div className="g-sub">{t("ui.props")}</div>
        <dl className="stats">
          <div><dt><Term k="slope" /> <span className="muted small">(<Term k="typical">tipik</Term>)</span></dt><dd>{fmt(v.slope?.p50, 1)}°</dd></div>
          <div><dt><Term k="relief" /></dt><dd>{fmt(v.relief?.p50, 1)} m</dd></div>
          <div><dt>{t("ui.temp")}</dt><dd>{moonT == null ? <span className="muted small">{t("ui.noTemp." + target)}</span> : `${fmt(c(moonT), 0)} °C`}</dd></div>
        </dl>
        {moonT != null && <p className="muted small">{t("ui.moonTempNote")}</p>}
        <p className="muted small">{t("ui.refSrc." + target)}</p>
      </div>
    </div>
  );
}
