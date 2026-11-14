import React from "react";
import { t } from "../../i18n/index.js";

/** West→east elevation profile through the centre of both windows. Heights are measured from each window's lowest
 *  point on the line, because the Moon/Mars and Earth height zeros (datums) are different. Gaps stay gaps. */
export default function ProfileChart({ a, b, labels, cellM = 90, big = false }) {
  const W = 520, H = big ? 220 : 130, P = 30;
  const rel = (arr) => { const v = arr.filter((x) => !Number.isNaN(x)); const lo = v.length ? Math.min(...v) : 0; return arr.map((x) => (Number.isNaN(x) ? NaN : x - lo)); };
  const ra = rel(a || []), rb = rel(b || []);
  const top = Math.max(1, ...ra.filter(Number.isFinite), ...rb.filter(Number.isFinite));
  const n = Math.max(ra.length, rb.length, 2), km = ((n - 1) * cellM) / 1000;
  const X = (i) => P + (i / (n - 1)) * (W - P - 8), Y = (v) => H - 18 - (v / top) * (H - 30);
  const path = (arr) => arr.map((v, i) => (Number.isNaN(v) ? null : `${X(i)},${Y(v)}`)).reduce((s, p, i, all) => s + (p ? (i && all[i - 1] ? " L" : " M") + p : ""), "");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <figure className="ov-prof">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("ov.prof.aria")}>
        {ticks.map((f) => <g key={f}><line x1={P} x2={W - 8} y1={Y(top * f)} y2={Y(top * f)} className="ov-grid" /><text x={2} y={Y(top * f) + 4} className="ov-ax">{Math.round(top * f)} m</text></g>)}
        {ticks.map((f) => <text key={"x" + f} x={X(f * (n - 1)) - 8} y={H - 3} className="ov-ax">{(km * f).toFixed(1)} km</text>)}
        <path d={path(ra)} className="ov-line ov-line-a" /><path d={path(rb)} className="ov-line ov-line-b" />
      </svg>
      <figcaption><i className="ov-dot a" />{labels[0]} <i className="ov-dot b" />{labels[1]} · {t("ov.prof.note")}</figcaption>
    </figure>
  );
}
