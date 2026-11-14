import React from "react";
import { t } from "../../i18n/index.js";
import { fmt } from "../../common.jsx";
import { GAME } from "./rules.js";

/** t() + {ad} yer tutucuları. */
export const tf = (k, v = {}) => t(k).replace(/\{(\w+)\}/g, (_, n) => (v[n] === undefined ? "" : v[n]));

/** Görev simülasyonu etiketleri (kural 4): Gerçek ölçüm / Hesaplanmış / Simülasyon varsayımı. */
export function Lbl({ k }) {
  return <span className={"g-lbl g-lbl-" + k}>{t("game.lbl." + k)}</span>;
}

export const Missing = () => <span className="g-missing">{t("game.missing")}</span>;

/** Sayı veya "Veri eksik" (sıfır sayılmaz). */
export const N = ({ v, d = 1, u = "" }) => (v === null || v === undefined || Number.isNaN(v) ? <Missing /> : <>{fmt(v, d)}{u && " " + u}</>);

export function OxygenBar({ clock }) {
  const pct = Math.round(clock.frac * 100);
  return (
    <div className={"g-o2 g-o2-" + clock.level} role="timer" aria-live="off">
      <div className="g-o2-head">
        <span className="g-o2-title">{t("game.o2.title")}</span>
        <span className="g-o2-val">{clock.left} / {GAME.startMin} {t("game.min")}</span>
        <Lbl k="sim" />
      </div>
      <div className="g-o2-track"><div className="g-o2-fill" style={{ width: pct + "%" }} /></div>
      <div className="g-o2-note muted">{t("game.o2.level." + clock.level)}</div>
    </div>
  );
}

/** Yatay ölçek üzerinde P10–P50–P90 şeritleri ve isteğe bağlı limit çizgisi. */
export function Strips({ rows, limit, unit, max }) {
  const hi = max || Math.max(...rows.flatMap((r) => (r.pc ? [r.pc.p90] : [])), limit || 0) * 1.1 || 1;
  const x = (v) => 4 + (Math.min(v, hi) / hi) * 92;
  return (
    <svg className="g-strips" viewBox={`0 0 100 ${rows.length * 16 + 10}`} preserveAspectRatio="none" role="img" aria-label={unit}>
      {rows.map((r, i) => (r.pc ? (
        <g key={r.label}>
          <rect x={x(r.pc.p10)} y={i * 16 + 4} width={Math.max(0.8, x(r.pc.p90) - x(r.pc.p10))} height="8" className={"g-strip g-strip-" + i} />
          <rect x={x(r.pc.p50) - 0.4} y={i * 16 + 2} width="0.8" height="12" className="g-strip-mid" />
        </g>
      ) : null))}
      {limit ? <rect x={x(limit) - 0.3} y="0" width="0.6" height={rows.length * 16 + 10} className="g-limit" /> : null}
    </svg>
  );
}

export function StripLegend({ rows, unit }) {
  return (
    <ul className="g-legend">
      {rows.map((r, i) => (
        <li key={r.label}><i className={"g-sw g-strip-" + i} />{r.label}: {r.pc ? <>{fmt(r.pc.p10, 1)} / {fmt(r.pc.p50, 1)} / {fmt(r.pc.p90, 1)} {unit}</> : <Missing />}</li>
      ))}
    </ul>
  );
}
