// Oyun içi kısa mesajlar ve konuşmalar. Her metin i18n anahtarıdır; içerik yalnızca mevcut veri/kurallardan seçilir.
// Oyun ekranında sayı gösterilmez; değerler rapordadır (#/report).
import { compareRows, earthThermal, nearestKnown, roverLimit, siteChecks, slopeBand } from "./data.js";
import { GAME } from "./rules.js";
import { tf } from "./ui.jsx";
import { t } from "../../i18n/index.js";

export const introLines = (profile) => ["game.say.intro1", "game.say.intro2." + profile, "game.say.intro3"].map((k) => t(k));

/** Adaya basınca: katalog durumu (sayı yok). */
export function pickLine(p, D) {
  const near = nearestKnown(D.known, p);
  if (!near) return t("game.msg.catalog.unknown");
  return t(near.km > GAME.novelKm ? "game.msg.catalog.new" : "game.msg.catalog.near");
}

/** Test i (0 sıcaklık, 1 eğim, 2 yüzey) sonucu: tek nitel cümle. */
export function testLine(i, p, D, profile, target) {
  if (i === 0) {
    if (!earthThermal(D.tE, p.id).ok) return t("game.test.res.thermal.missing");
    return t(profile === "moon" ? "game.test.res.thermal.moon" : "game.test.res.thermal.mars");
  }
  if (i === 1) {
    const lim = roverLimit(D.params, profile), band = lim && slopeBand(p.derived_percentiles?.slope, lim.num);
    return band ? t("game.test.res.slope." + band) : t("game.test.res.slope.nolimit");
  }
  const r = compareRows(p, target).find((x) => x.k === "rough");
  if (!r?.cand || !r?.ref) return t("game.test.res.surface.missing");
  return t(r.cand.p50 > r.ref.p50 ? "game.test.res.surface.more" : "game.test.res.surface.less");
}

/** Sonuç konuşması: görev sonucu, bölge ölçütleri (sayım), belirsizlikler ve "tam karşılığı değil" uyarısı. */
export function resultLines(result, p, D, profile, cand, done) {
  const lines = ["game.out.say." + result];
  if (p) {
    const met = siteChecks(p, cand, D.known, D.tE).filter((c) => c.ok).length;
    lines.push(tf("game.say.site", { n: met, of: 3 }));
  }
  lines.push(profile === "moon" ? t("game.say.unc.moon") : t("game.say.unc.mars"));
  if (done.length < 3) lines.push(t("game.say.unc.untested"));
  lines.push(t("game.say.notexact." + profile));
  return lines.map((k) => (k.startsWith("game.") ? t(k) : k));
}
