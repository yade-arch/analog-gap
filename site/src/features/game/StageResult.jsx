import React from "react";
import { t } from "../../i18n/index.js";
import { fmt, Tag } from "../../common.jsx";
import { GAME, TESTS } from "./rules.js";
import { compareRows, earthThermal, roverLimit, siteChecks, slopeBand } from "./data.js";
import { FlagList } from "./StageSuit.jsx";
import { Lbl, Missing, N, tf } from "./ui.jsx";

/** Aşama 6: görev sonucu, bölge seçiminin bilimsel anlamlılığı (ölçüt listesi; puan/yüzde değil). */
export default function StageResult({ p, D, profile, cand, target, done, suit, flags, result, left, onRestart }) {
  const checks = p ? siteChecks(p, cand, D.known, D.tE) : [];
  const rows = p ? compareRows(p, target) : [];
  const lim = roverLimit(D.params, profile);
  const met = checks.filter((c) => c.ok).length;
  return (
    <section className="g-result-page">
      <div className={"g-alert g-out-" + result} role="status">
        <strong>{t("game.out." + result)}</strong>
        <p>{t("game.out." + result + ".d")} <Lbl k="sim" /></p>
        <p>{t("game.left")}: <strong>{left} {t("game.min")}</strong></p>
      </div>
      <div className="g-grid2">
        <div className="card">
          <h3>{t("game.res.site")}</h3>
          {p ? (
            <>
              <p><strong>{p.id}</strong> · {p.region} · D <N v={p.D} d={3} /> <Tag kind="der" /></p>
              <h4>{t("game.res.why")} <Lbl k="sim" /></h4>
              <ul className="g-list">
                {checks.map((c) => (
                  <li key={c.k}>
                    <span className={c.ok ? "g-sim" : "g-diff"}>{c.ok === null ? <Missing /> : t(c.ok ? "game.met" : "game.notmet")}</span>{" "}
                    {tf("game.chk." + c.k, { v: fmt(c.val, c.k === "lowD" ? 3 : 2), cut: fmt(c.cut, 3), q: GAME.dQuantile * 100, cov: GAME.coverageMin, km: c.near ? fmt(c.near.km, 0) : "—", lim: GAME.novelKm })}
                    {c.k === "coverage" && !c.thermal && <> ({t("game.thermal")}: <Missing />)</>}
                  </li>
                ))}
              </ul>
              <p>{tf("game.res.met", { n: met, of: checks.length })}</p>
              <h4>{t("game.res.simdiff")}</h4>
              <ul className="g-list">
                {rows.map((r) => <li key={r.k}>{t("game.var." + r.k)}: {r.similar === null ? <Missing /> : t(r.similar ? "game.similar" : "game.different")} (d_k <N v={r.d} d={3} />)</li>)}
                <li>{t("game.thermal")}: {profile === "moon" && earthThermal(D.tE, p.id).ok ? t("game.notequiv") : <Missing />}</li>
                <li>{t("game.res.always")}</li>
              </ul>
            </>
          ) : <p>{t("game.res.nosite")}</p>}
        </div>
        <div className="card">
          <h3>{t("game.res.tests")}</h3>
          <ul className="g-list">
            {TESTS.map((k) => (
              <li key={k}>{t("game.test." + k)}: {!done[k] ? t("game.res.notrun")
                : k === "terrain" && p && lim ? t("game.earth") + ": " + t("game.band." + slopeBand(p.derived_percentiles?.slope, lim.num))
                : k === "thermal" && profile === "mars" ? <Missing /> : t("game.res.run")}</li>
            ))}
          </ul>
          <h3>{t("game.res.suit")}</h3>
          <p>{suit ? t("game." + suit.id) : t("game.res.nosuit")}</p>
          <h4>{t("game.suit.flags")}</h4>
          <FlagList flags={flags} />
          <button className="btn-accent g-big" onClick={onRestart}>{t("game.restart")}</button>
        </div>
      </div>
    </section>
  );
}
