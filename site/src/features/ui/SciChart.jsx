import React, { useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";

// Bilimsel analiz grafiği: seçili özelliğin düşük uç / tipik / yüksek uç (P10/P50/P90) değerleri, referans ve Dünya adayı iki çizgi.
// İklim ve mineral sekmeleri veri olmadığı için kapalı (değer üretilmez).
// Reference = solid line, Earth = dashed line, so the two stay apart without colour (black-and-white mode, print).
// On screen one property is shown (tabs); in print all three are drawn so the PDF holds every chart.
const TABS = [["slope", "°"], ["relief", "m"], ["rough", "m"]];
const W = 520, H = 170, X = (i) => 40 + i * ((W - 110) / 2);

function Chart({ k, p, reference, target }) {
  const u = TABS.find((x) => x[0] === k)[1];
  const r = reference?.variables?.[k], c = p.derived_percentiles?.[k];
  const pts = (o) => (o ? [o.p10, o.p50, o.p90] : null);
  const R = pts(r), C = pts(c);
  if (!R || !C) return <p>{t("ui.noData")}</p>;
  const max = Math.max(...R, ...C, 1e-9), Y = (v) => H - 24 - (v / max) * (H - 44);
  const path = (a) => a.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" ");
  const lbl = (i) => (i === 2 ? { x: X(i) - 6, textAnchor: "end" } : { x: X(i) + 6 });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t("ui.tab." + k)}>
      {[0, 1, 2].map((i) => <g key={i}><line x1={X(i)} x2={X(i)} y1="10" y2={H - 24} stroke="#e3e8f3" /><text x={X(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#5a6482">{t("ui.q" + i)}</text></g>)}
      <path d={path(R)} fill="none" stroke={target === "mars" ? "#c4532f" : "#6f7882"} strokeWidth="3" />
      <path d={path(C)} fill="none" stroke="#7b5cf0" strokeWidth="3" strokeDasharray="7 5" />
      {R.map((v, i) => <text key={"r" + i} {...lbl(i)} y={Y(v) - 6} fontSize="11" fill="#141b36">{fmt(v, 1)} {u}</text>)}
      {C.map((v, i) => <text key={"c" + i} {...lbl(i)} y={Y(v) + 14} fontSize="11" fill="#5b3fd0">{fmt(v, 1)} {u}</text>)}
    </svg>
  );
}

export default function SciChart({ p, reference, target }) {
  const [k, setK] = useState("slope");
  const legend = <span className="sci-leg"><i className={"lg " + target} />{t("ui.body." + target)} ({t("sci.solid")}) <i className="lg earth" />{t("hero.name.earth")} ({t("sci.dashed")})</span>;
  return (
    <div>
      <div className="sci-tabs noprint" role="tablist">
        {TABS.map(([id]) => <button key={id} role="tab" aria-selected={k === id} className={k === id ? "on" : ""} onClick={() => setK(id)}>{t("ui.tab." + id)}</button>)}
        <button disabled title={t("ui.noData")}>{t("ui.tab.climate")}</button><button disabled title={t("ui.noData")}>{t("ui.tab.mineral")}</button>
        {legend}
      </div>
      <div className="noprint"><Chart k={k} p={p} reference={reference} target={target} /></div>
      <div className="print-only">
        <p className="small">{legend}</p>
        {TABS.map(([id]) => <figure key={id} className="sci-print"><figcaption><b>{t("ui.tab." + id)}</b></figcaption><Chart k={id} p={p} reference={reference} target={target} /></figure>)}
        <p className="small">{t("ui.tab.climate")}, {t("ui.tab.mineral")}: {t("ui.noData")}</p>
      </div>
    </div>
  );
}
