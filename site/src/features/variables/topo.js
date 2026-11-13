// Topografik değişkenlerin (eğim, röleyf, pürüzlülük) istasyon hesabı: yalnızca mevcut Python sonuçlarından okunur, yeni sayı üretilmez.
import { fmt } from "../../common.jsx";

const trip = (o, d) => (o ? [o.p10, o.p50, o.p90].map((v) => fmt(v, d)).join(" / ") : "Veri eksik");

/** key: 'slope'|'relief'|'rough'. -> compute(ctx) */
export function topoCompute(key, d, unit, extra) {
  return (ctx) => {
    const { p, reference } = ctx;
    const r = reference?.variables?.[key], c = p.derived_percentiles[key];
    const rows = [
      { label: `P10 / P50 / P90 (${unit})`, ref: trip(r, d), cand: trip(c, d), tag: "calc" },
      { label: "Örtüşme O_k (referans P10–P90 içinde kalan pay)", ref: "—", cand: fmt(p.O[key], 3), tag: "calc" },
      { label: "Uzaklık d_k = W1 / IQR(referans)", ref: "—", cand: fmt(p.d[key], 3), tag: "calc" },
    ];
    return { status: "ok", rows: extra ? rows.concat(extra(ctx)) : rows };
  };
}