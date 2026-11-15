import React from "react";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { betterThan, compareRows, siteChecks } from "./data.js";
import { tf } from "./ui.jsx";
import { tierOf } from "./logbook.js";
import { GAME } from "./rules.js";

/** Her yaşa uygun görev raporu. Yüzde = sıralama (adayların kaçından daha benzer), benzerlik yüzdesi değildir.
 *  Bilimsel ayrıntılar #/report sayfasında. */
export default function MissionReport({ result, p, D, profile, cand, suit, left, reportHref, onAgain, tests }) {
  const pct = p ? betterThan(p, cand) : null;
  const met = p ? siteChecks(p, cand, D.known, D.tE).filter((c) => c.ok).length : 0;
  const rows = p ? compareRows(p, refTarget(D, profile)) : [];
  const same = rows.filter((r) => r.similar).map((r) => t("game.rep.var." + r.k));
  const diff = rows.filter((r) => r.similar === false).map((r) => t("game.rep.var." + r.k));
  return (
    <div className="g-menu g-report">
      <div className="g-menu-card g-rep">
        <p className="g-kicker">{t("game.rep.kicker")}</p>
        <h2 className={"g-rep-h g-rep-" + result}>{t("game.rep.out." + result)}</h2>
        {p && (
          <>
            <p className="g-rep-place">📍 {regionLabel(p.region)}</p>
            {pct !== null && <div className="g-rep-big"><strong>%{pct}</strong><span>{tf("game.rep.better", { n: cand.features.length })}</span></div>}
            <p className="g-stars" aria-label={tf("game.rep.stars", { n: met })}>{"★".repeat(met)}{"☆".repeat(3 - met)}<small>{tf("game.rep.stars", { n: met })}</small></p>
            <ul className="g-rep-list">
              {same.length > 0 && <li>✓ {tf("game.rep.same", { v: same.join(", ") })}</li>}
              {diff.length > 0 && <li>≠ {tf("game.rep.diff", { v: diff.join(", ") })}</li>}
              <li>? {t("game.rep.unknown." + profile)}</li>
            </ul>
          </>
        )}
        <p className="g-small">{suit ? t("game." + suit) : t("game.rep.nosuit")} · {tf("game.o2.text", { l: Math.max(0, left) })}</p>
        <div className="g-debrief">
          <p><b className={"g-tier g-tier-" + tierOf(result)}>{t("game.tier." + tierOf(result))}</b> · {t("game.deb.title")}</p>
          <ul className="g-rep-list">
            <li>{tf("game.deb.done", { n: tests ?? 0 })}</li>
            <li>{tf("game.deb.tip." + result, { i: GAME.cost.inspect, s: GAME.cost.test })}</li>
          </ul>
          <p className="g-small">{t("game.deb.note")}</p>
        </div>
        <div className="g-stack">
          <button className="g-start" onClick={onAgain}>{t("game.end.again")}</button>
          <a className="g-btn" href={reportHref}>{t("game.end.report")}</a>
        </div>
        <p className="g-small">{t("game.rep.note")}</p>
      </div>
    </div>
  );
}

const refTarget = (D, profile) => (profile === "moon" ? D.rm : D.rs);
