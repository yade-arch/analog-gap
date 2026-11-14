// Oyunun tüm sayıları burada mevcut veri ürünlerinden türetilir; yeni sayı üretilmez.
import { GAME } from "./rules.js";

export const VAR_KEYS = ["slope", "relief", "rough"];

/** Rover eğim limiti: yalnızca parameters_sources.json içinde selectable_in_ui "yes" olan satır (kural 8). */
export function roverLimit(params, profile) {
  const body = profile === "moon" ? "Ay" : "Mars";
  const row = (params || []).find((p) => String(p.selectable_in_ui).startsWith("yes") && /rover/.test(p.applies_to) && p.applies_to.includes(body) && /slope|tilt/.test(p.parameter));
  return row && !Number.isNaN(+row.value) ? { ...row, num: +row.value } : null;
}

export const refOf = (D, profile) => (profile === "moon" ? D.rm : D.rs);
export const candOf = (D, profile) => (profile === "moon" ? D.cm : D.cs);

export function compareRows(p, ref) {
  return VAR_KEYS.map((k) => {
    const d = p.d?.[k];
    return { k, cand: p.derived_percentiles?.[k], ref: ref?.variables?.[k], d, O: p.O?.[k], similar: d === null || d === undefined ? null : d <= GAME.similarD };
  });
}

/** Dünya termal penceresi; dT_dn yoksa ok=false ("Veri eksik", sıfır sayılmaz). */
export function earthThermal(tE, id) {
  const w = tE?.windows?.[id];
  return { w, ok: !!w && w.dT_dn_K_median !== null && w.dT_dn_K_median !== undefined };
}

/** Hedef termal: Ay yalnızca thermal_moon.json pencereleri (dT_dn yok); Mars termal ürünü yok. */
export function targetThermal(tM, profile) {
  if (profile !== "moon" || !tM?.windows) return null;
  return Object.entries(tM.windows).map(([id, w]) => ({ id, name: w.name, avg: w.temp_avg_K_p10_p50_p90, max: w.temp_max_K_p10_p50_p90 }));
}

function hav(a, b, c, d) {
  const r = Math.PI / 180, x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

export function nearestKnown(known, p) {
  return (known || []).filter((k) => k.lat && k.lon).map((k) => ({ name: k.name, km: hav(p.center_lat, p.center_lon, +k.lat, +k.lon) })).sort((a, b) => a.km - b.km)[0] || null;
}

/** Profilin gösterilen adaylarında D'nin GAME.dQuantile yüzdeliği (eşik veriden hesaplanır). */
export function dCut(cand) {
  const a = (cand?.features || []).map((f) => f.properties.D).filter((v) => v !== null && v !== undefined).sort((x, y) => x - y);
  return a.length ? a[Math.floor(GAME.dQuantile * (a.length - 1))] : null;
}

/** Eğim yüzdeliklerine göre limiti aşan piksel payı bandı (yalnızca P50/P90'dan kesin çıkarılabilen aralık). */
export function slopeBand(pc, limit) {
  if (!pc || !limit) return null;
  if (pc.p90 < limit) return "lt10";
  if (pc.p50 < limit) return "mid";
  return "gt50";
}

/** Bilimsel anlamlılık ölçütleri (oyun kuralı; puan/yüzde değil, karşılanan ölçüt listesi). */
export function siteChecks(p, cand, known, tE) {
  const cut = dCut(cand), near = nearestKnown(known, p), th = earthThermal(tE, p.id);
  const cov = p.evidence_coverage?.valid_pixel_fraction;
  return [
    { k: "lowD", ok: p.D !== null && p.D !== undefined && cut !== null ? p.D <= cut : null, val: p.D, cut },
    { k: "coverage", ok: cov === undefined ? null : cov >= GAME.coverageMin && th.ok, val: cov, thermal: th.ok },
    { k: "novel", ok: near ? near.km > GAME.novelKm : null, near },
  ];
}

/** Kıyafet risk bayrakları: test edilmeyen koşul "bilinmiyor" sayılır (ihtiyat; oyun kuralı). */
export function riskFlags(profile, done, ref, limit) {
  const f = [{ k: "thermal", why: profile === "moon" ? "noequiv" : "missing" }];
  if (!done.terrain) f.push({ k: "terrain", why: "untested" });
  else if (!limit) f.push({ k: "terrain", why: "nolimit" });
  else if (ref?.variables?.slope?.p90 >= limit.num) f.push({ k: "terrain", why: "over" });
  if (!done.surface) f.push({ k: "surface", why: "untested" });
  return f;
}

/** Görev sonucu (oyun kuralı): süre yeterli mi + kıyafet risk bayraklarına dayanıklı mı. */
export function outcome(suit, left, flags) {
  if (!suit || left <= 0) return "timeout";
  if (left < suit.returnMin) return "nooxygen";
  if (!suit.tolerant && flags.length) return "risky";
  return "success";
}
