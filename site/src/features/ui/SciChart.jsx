import React, { useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";

// Bilimsel analiz grafiği: seçili özelliğin düşük uç / tipik / yüksek uç (P10/P50/P90) değerleri, referans ve Dünya adayı iki çizgi.
// İklim ve mineral sekmeleri veri olmadığı için kapalı (değer üretilmez).
const TABS = [["slope", "°"], ["relief", "m"], ["rough", "m"]];

export default function SciChart({ p, reference, target }) {
  const [k, setK] = useState("slope");
  const u = TABS.find((x) => x[0] === k)[1];
  const r = reference?.variables?.[k], c = p.derived_percentiles?.[k];
  const pts = (o) => (o ? [o.p10, o.p50, o.p90] : null);
  const R = pts(r), C = pts(c), all = [...(R || []), ...(C || [])], max = Math.max(...all, 1e-9);
  const W = 520, H = 170, X = (i) => 40 + i * ((W - 60) / 2), Y = (v) => H - 24 - (v / max) * (H - 44);
  const path = (a) => a.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" ");
  return (
    <div>
      <div className="sci-tabs" role="tablist">
        {TABS.map(([id]) => <button key={id} role="tab" aria-selected={k === id} className={k === id ? "on" : ""} onClick={() => setK(id)}>{t("ui.tab." + id)}</button>)}
        <button disabled title={t("ui.noData")}>{t("ui.tab.climate")}</button><button disabled title={t("ui.noData")}>{t("ui.tab.mineral")}</button>
        <span className="sci-leg"><i className={"lg " + target} />{t("ui.body." + target)} <i className="lg earth" />{t("hero.name.earth")}</span>
      </div>
      {R && C ? (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={t("ui.tab." + k)}>
          {[0, 1, 2].map((i) => <g key={i}><line x1={X(i)} x2={X(i)} y1="10" y2={H - 24} stroke="#e3e8f3" /><text x={X(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#5a6482">{t("ui.q" + i)}</text></g>)}
          <path d={path(R)} fill="none" stroke={target === "mars" ? "#c4532f" : "#6f7882"} strokeWidth="3" />
          <path d={path(C)} fill="none" stroke="#7b5cf0" strokeWidth="3" />
          {R.map((v, i) => <text key={"r" + i} x={X(i) + 6} y={Y(v) - 6} fontSize="11" fill="#141b36">{fmt(v, 1)} {u}</text>)}
          {C.map((v, i) => <text key={"c" + i} x={X(i) + 6} y={Y(v) + 14} fontSize="11" fill="#5b3fd0">{fmt(v, 1)} {u}</text>)}
        </svg>
      ) : <p>{t("ui.noData")}</p>}
    </div>
  );
}
