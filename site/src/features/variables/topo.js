// Topografik değişkenlerin (eğim, yükseklik farkı, yüzey engebesi) istasyon hesabı: yalnızca mevcut Python sonuçlarından okunur, yeni sayı üretilmez.
// summary: tek cümlelik okunur karşılaştırma; ayrıntı satırları (aralık, örtüşme, uzaklık) açılır kutuda. Teknik adlar parantezde.
import { fmt } from "../../common.jsx";
import { TERMS } from "../../i18n/terms.js";

const range = (o, d, u) => (o ? `tipik ${fmt(o.p50, d)} ${u}, çoğu yer ${fmt(o.p10, d)}–${fmt(o.p90, d)} ${u}` : "Veri eksik");

/** key: 'slope'|'relief'|'rough'. -> compute(ctx) */
export function topoCompute(key, d, unit, extra) {
  return (ctx) => {
    const { p, reference } = ctx;
    const r = reference?.variables?.[key], c = p.derived_percentiles[key], dn = TERMS["d_" + key].name.toLowerCase();
    const diff = r && c ? Math.abs(c.p50 - r.p50) : null;
    const summary = r && c
      ? `Referans: tipik ${fmt(r.p50, d)} ${unit}. Dünya adayı: tipik ${fmt(c.p50, d)} ${unit}. Tipik değerler arasındaki fark ${fmt(diff, d)} ${unit} (${dn} ${fmt(p.d[key], 3)}; 0 = aynı dağılım).`
      : "Veri eksik: karşılaştırma yapılmadı.";
    const rows = [
      { label: `Tipik değer ve aralık (teknik ad: P50, P10–P90; ${unit})`, ref: range(r, d, unit), cand: range(c, d, unit), tag: "calc" },
      { label: "Örtüşme (teknik ad: O_k): referansın tipik aralığının adayın aralığıyla örtüşen payı, 0 = hiç, 1 = tamamen", single: fmt(p.O[key], 3), tag: "calc" },
      { label: `${TERMS["d_" + key].name} (teknik ad: d_k = W1 / IQR(referans)); 0 = aynı, düşük = daha benzer`, single: fmt(p.d[key], 3), tag: "calc" },
    ];
    return { status: "ok", summary, rows: extra ? rows.concat(extra(ctx)) : rows };
  };
}
