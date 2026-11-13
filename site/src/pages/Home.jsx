import React from "react";
import { PROFILES, Warn, fmt } from "../common.jsx";
import { t } from "../i18n/index.js";

export default function Home({ cand, profile }) {
  const best = cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0];
  const to = best ? `#/compare/${best.id}/${profile}` : "#/compare";
  const steps = [1, 2, 3];
  return (
    <div className="home">
      <h2>{t("app.title")}</h2>
      <p className="purpose big-p">{t("home.purpose")}</p>
      <a className="btn-accent cta" href={to}>{t("home.start")} →</a>
      <ol className="steps">
        {steps.map((n) => <li key={n} className="card"><h3>{t(`home.step${n}.t`)}</h3><p>{t(`home.step${n}.d`)}</p></li>)}
      </ol>
      {best && (
        <div className="card">
          <h3>{t("home.example")} <span className="muted">· {PROFILES[profile].name}</span></h3>
          <p>{t("home.example.d").replace("{id}", best.id).replace("{region}", best.region).replace("{D}", fmt(best.D, 3))}</p>
        </div>
      )}
      <Warn>{t("home.limit")}</Warn>
    </div>
  );
}
