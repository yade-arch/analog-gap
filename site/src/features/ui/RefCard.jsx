import React from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { tipOf } from "../../i18n/terms.js";
import { SETTINGS } from "../../config.js";
import { REF_NAME } from "../world/known.js";
import ReliefThumb from "./ReliefThumb.jsx";

// Referans bölge kartı (referans tasarım). Değerler dosyadan: tipik eğim ve yükseklik farkı (reference_*.json P50); sıcaklık yalnız Ay (Diviner modeli).
// Kaynak ve anlam: her değerin title ipucunda; ayrıntı sayfadaki "Detayları göster" kısmında.
export const ICON = { slope: "⛰", relief: "▲", temp: "🌡" };
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

export function refStats(target, reference, tM) {
  const v = reference?.variables || {};
  const T = target === "moon" ? med(Object.values(tM?.windows || {}).map((w) => w.temp_avg_K_p10_p50_p90?.[1])) : null;
  return [
    ["slope", t("ui.slope"), v.slope?.p50 == null ? null : `${fmt(v.slope.p50, 1)}°`, tipOf("slope")],
    ["relief", t("ui.relief"), v.relief?.p50 == null ? null : `${fmt(v.relief.p50, 1)} m`, tipOf("relief")],
    ["temp", t("ui.temp"), T == null ? null : `${fmt(T - 273.15, 0)} °C`, T == null ? t("ui.noTemp." + target) : t("ui.moonTempNote")],
  ];
}

export default function RefCard({ target, reference, tM, wide }) {
  const st = refStats(target, reference, tM);
  const val = (x, tip) => <span title={tip}>{x ?? <span className="muted small">{t("list.nodata")}</span>}</span>;
  const thumb = (
    <div className="ref-img">
      <ReliefThumb id={SETTINGS.references[target][0]} body={target} h={wide ? 190 : 250} />
      <span className={"body-pill " + target}><i />{t("ui.body." + target)}</span>
    </div>
  );
  if (!wide) return (
    <div className="g-card refcard" title={t("ui.refSrc." + target)}>
      {thumb}
      <h2 className="g-h big">{t("ui.refRegion")}</h2>
      <p className="ref-sub">{REF_NAME[target]}</p>
      <hr />
      <div className="g-sub">📊 {t("ui.props")}</div>
      {st.map(([k, n, x, tip]) => <div className="prop-row" key={k}><span><span className="ic">{ICON[k]}</span>{n}</span><b>{val(x, tip)}</b></div>)}
    </div>
  );
  return (
    <div className="g-card refcard wide" title={t("ui.refSrc." + target)}>
      {thumb}
      <div className="refcard-main">
        <div className="g-kicker">{t("ui.refRegion")}</div>
        <h2 className="g-h big">{REF_NAME[target]}</h2>
        <p>{t("ui.refDesc." + target)}</p>
      </div>
      <div className="refcard-stats">
        <div className="g-sub">⛰ {t("ui.props2")}</div>
        <div className="stat3">{st.map(([k, n, x, tip]) => <div key={k}><span className="muted"><span className="ic">{ICON[k]}</span>{n}</span><b>{val(x, tip)}</b></div>)}</div>
      </div>
    </div>
  );
}
