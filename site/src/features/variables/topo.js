// Topografik değişkenlerin (eğim, yükseklik farkı, yüzey engebesi) istasyon hesabı: yalnızca mevcut Python sonuçlarından okunur, yeni sayı üretilmez.
// summary: tek cümlelik okunur karşılaştırma; ayrıntı satırları (aralık, örtüşme, uzaklık) açılır kutuda. Teknik adlar parantezde.
import { fmt } from "../../common.jsx";
import { TERMS } from "../../i18n/terms.js";

const range = (o, d, u) => (o ? `typical ${fmt(o.p50, d)} ${u}, most of the area ${fmt(o.p10, d)}–${fmt(o.p90, d)} ${u}` : "Data missing");

/** key: 'slope'|'relief'|'rough'. -> compute(ctx) */
export function topoCompute(key, d, unit, extra) {
  return (ctx) => {
    const { p, reference } = ctx;
    const r = reference?.variables?.[key], c = p.derived_percentiles[key], dn = TERMS["d_" + key].name.toLowerCase();
    const diff = r && c ? Math.abs(c.p50 - r.p50) : null;
    const summary = r && c
      ? `Reference: typical ${fmt(r.p50, d)} ${unit}. Earth candidate: typical ${fmt(c.p50, d)} ${unit}. Difference between typical values ${fmt(diff, d)} ${unit} (${dn} ${fmt(p.d[key], 3)}; 0 = same spread).${p.O?.[key] != null ? ` Range overlap: ${fmt(p.O[key] * 100, 0)}% (how much the usual ranges, P10–P90, of Earth and the reference cover each other; existing value O_k, not an overall similarity score).` : ""}`
      : "Data missing: no comparison made.";
    const rows = [
      { label: `Typical value and range (technical name: P50, P10–P90; ${unit})`, ref: range(r, d, unit), cand: range(c, d, unit), tag: "calc" },
      { label: "Overlap (technical name: O_k): share of the reference's typical range covered by the candidate's range, 0 = none, 1 = all", single: fmt(p.O[key], 3), tag: "calc" },
      { label: `${TERMS["d_" + key].name} (technical name: d_k = W1 / IQR(reference)); 0 = identical, lower = more similar`, single: fmt(p.d[key], 3), tag: "calc" },
    ];
    return { status: "ok", summary, rows: extra ? rows.concat(extra(ctx)) : rows };
  };
}
