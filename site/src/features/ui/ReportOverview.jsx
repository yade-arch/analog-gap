import React from "react";
import { Tag, fmt } from "../../common.jsx";
import { Term } from "../../components/PageIntro.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { SETTINGS } from "../../config.js";
import { REF_NAME } from "../world/known.js";
import "./glass.css";

// Rapor özeti (referans görsel düzeni): halka = arazi uzaklığı (yüzde DEĞİL; 0 = aynı), çubuklar = değişken uzaklıkları, en benzer 3 pencere, kısa sonuç.
// Halka/çubuk ölçeği SETTINGS.dScaleMax (harita renk ölçeğiyle aynı); dolu kısım uzaklıktır, "uyum" değildir.
const MAX = SETTINGS.dScaleMax || 1.2;
const frac = (d) => Math.max(0, Math.min(1, (d ?? MAX) / MAX));

function Ring({ d }) {
  const r = 52, L = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 130 130" width="150" height="150" role="img" aria-label={`${t("gauge.title")} ${fmt(d, 3)}`}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#e6ebf5" strokeWidth="12" />
      <circle cx="65" cy="65" r={r} fill="none" stroke="#1f5fe0" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${L * frac(d)} ${L}`} transform="rotate(-90 65 65)" />
      <text x="65" y="70" textAnchor="middle" fontSize="24" fontWeight="800" fill="#141b36">{fmt(d, 3)}</text>
    </svg>
  );
}

export default function ReportOverview({ p, profile, cand }) {
  const top = cand.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank).slice(0, 3);
  const bars = [["d_slope", p.d?.slope], ["d_relief", p.d?.relief], ["d_rough", p.d?.rough]];
  return (
    <div className="rep-ov glass">
      <nav className="rep-nav noprint" aria-label={t("ui.repNav")}>
        <a href="#rep-ov" onClick={(e) => { e.preventDefault(); document.getElementById("rep-ov")?.scrollIntoView({ behavior: "smooth" }); }}>📊 {t("ui.repGeneral")}</a>
        <a href="#rep-sci" onClick={(e) => { e.preventDefault(); document.getElementById("rep-sci")?.scrollIntoView({ behavior: "smooth" }); }}>🧪 {t("ui.repSci")}</a>
        <a href="#/map">📍 {t("ui.repMap")}</a>
        <a href="#rep-print" onClick={(e) => { e.preventDefault(); window.print(); }}>📄 {t("ui.repPrint")}</a>
      </nav>
      <div className="g-card rep-main" id="rep-ov">
        <h2 className="g-h">{t("ui.repGeneral")}</h2>
        <div className="rep-gauge">
          <div className="rep-ring"><Ring d={p.D} /><div className="g-sub"><Term k="D" /></div><div className="muted small">{t("list.dmeaning")}</div></div>
          <div>
            <p>{t("ui.repLead").replace("{ref}", `${t("side." + profile)} · ${REF_NAME[profile]}`).replace("{reg}", regionLabel(p.region))}</p>
            {bars.map(([k, v]) => (
              <div className="rep-bar" key={k}>
                <span><Term k={k} /></span><span className="bar"><i style={{ width: `${frac(v) * 100}%` }} /></span><b>{fmt(v, 3)}</b>
              </div>
            ))}
            <p className="muted small">{t("ui.repBarNote").replace("{max}", fmt(MAX, 1))}</p>
          </div>
        </div>
      </div>
      <div className="g-card rep-best">
        <h3>🌍 {t("ui.best")}</h3>
        {top.map((x, i) => (
          <a key={x.id} className={"rep-row" + (x.id === p.id ? " me" : "")} href={`#/report/${x.id}/${profile}`}>
            <span className="g-badge-s">{i + 1}</span><span>{regionLabel(x.region)}<br /><span className="muted small">{x.id}</span></span><b>{fmt(x.D, 3)}</b>
          </a>
        ))}
        <a className="g-btn" href="#/map">{t("ui.repMap")} →</a>
      </div>
      <div className="g-card rep-concl">
        <h3>💡 {t("ui.repConcl")} <Tag kind="int" /></h3>
        <p>{t("ui.repConclText").replace("{rank}", p.rank ?? "—").replace("{D}", fmt(p.D, 3))}</p>
      </div>
    </div>
  );
}
