import React from "react";
import { TAGS } from "./i18n/terms.js";

export const PROFILES = {
  moon: { name: "Lunar Base Analogs", sub: "Shackleton çevresi, güney kutbu (referans: LOLA LDEM_80S_20M, Site04/Site01/Site07)", reference: "reference_moon.json", cand: "candidates_moon.geojson" },
  mars: { name: "Martian Landing & Exploration", sub: "Jezero çevresi (referans: USGS Mars 2020 TRN CTX DTM 20 m, R2)", reference: "reference_mars.json", cand: "candidates_mars.geojson" },
};
export const VARS = { slope: ["Eğim", "°"], relief: ["Yükseklik farkı (330 m çevre)", "m"], rough: ["Pürüzlülük (150 m yüksek geçiren, RMS)", "m"] };
export const SOURCES = "Dünya: NASADEM_HGT v001 (NASA LP DAAC, 30 m) · Ay: LOLA LDEM_80S_20M (NASA PDS) · Mars: Mars 2020 TRN CTX DTM (USGS) · Termal: MYD11A2 v061, Diviner PRP v2";

export const fmt = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? "Veri eksik" : Number(v).toFixed(d));

export function Tag({ kind }) {
  const m = TAGS[kind];
  return <span className={"tag " + kind} title={m.tech}>{m.name}</span>;
}

export function Warn({ children }) {
  return <div className="warn">{children}</div>;
}

const BODY_TR = { moon: "Ay", mars: "Mars", earth: "Dünya" };

/** profile verilirse yalnızca o profilin referansına (moon/mars) veya Dünya adaylarına (earth) ait sınırlamalar gösterilir.
 *  profile verilmezse (Yöntem sayfası) hepsi, geçerli gövde etiketiyle listelenir. */
export function Limitations({ lim, profile }) {
  if (!lim) return null;
  const items = lim.items.filter((i) => !profile || !i.applies_bodies || i.applies_bodies.includes(profile) || i.applies_bodies.includes("earth") && !i.applies_bodies.some((b) => b === "moon" || b === "mars"));
  return (
    <div>
      {items.map((i) => (
        <Warn key={i.id}>
          <strong>{i.title}.</strong> {(profile && i.text_by_profile?.[profile]) || i.text}
          {!profile && i.applies_bodies && <em className="muted"> [Geçerli: {i.applies_bodies.map((b) => BODY_TR[b]).join(", ")}]</em>}
        </Warn>
      ))}
    </div>
  );
}

// D paleti (koyu tema): yakın = açık, uzak = koyu mavi; tek yönlü sıralı. theme.css --seq1..4 ile aynı.
export const D_STOPS = [[0, "#d6e9f8"], [0.4, "#7fb2e0"], [0.8, "#3b7fc0"], [1.2, "#2a5a96"]];

export function dColor(D) {
  if (D === null || D === undefined) return "#9aa3ad";
  const stops = D_STOPS.map(([v, hex]) => [v, [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))]);
  const x = Math.max(0, Math.min(1.2, D));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (x - a) / (b - a);
      return "rgb(" + ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(",") + ")";
    }
  }
  return D_STOPS[3][1];
}

/** Aday P10-P50-P90 ile referans P10-P90 aralığı, ortak eksen. */
export function RangeBars({ cand, reference, unit }) {
  const lo = Math.min(cand.p10, reference.p10), hi = Math.max(cand.p90, reference.p90), pad = (hi - lo) * 0.08 || 1;
  const a = lo - pad, b = hi + pad, W = 420, x = (v) => 8 + ((v - a) / (b - a)) * (W - 16);
  const bar = (p10, p50, p90, y, color, label) => (
    <g>
      <rect x={x(p10)} y={y} width={Math.max(2, x(p90) - x(p10))} height="12" fill={color} opacity="0.85" rx="2" />
      <line x1={x(p50)} x2={x(p50)} y1={y - 2} y2={y + 14} stroke="#f0b445" strokeWidth="2" />
      <text x="8" y={y - 4} fontSize="10.5" fill="currentColor">{label}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} 70`} width="100%" role="img" aria-label={`P10-P50-P90 aday ve referans (${unit})`}>
      {bar(cand.p10, cand.p50, cand.p90, 18, "#7fb2e0", `Aday${fmt(cand.p10, 1)} / ${fmt(cand.p50, 1)} / ${fmt(cand.p90, 1)} ${unit}`)}
      {bar(reference.p10, reference.p50, reference.p90, 50, "#5d7390", `Referans${fmt(reference.p10, 1)} / ${fmt(reference.p50, 1)} / ${fmt(reference.p90, 1)} ${unit}`)}
    </svg>
  );
}
