import React, { Suspense, lazy } from "react";
import { PROFILES, Warn, fmt } from "../common.jsx";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import "../features/home/home.css";

// Küreler three.js ister; ayrı parça olarak indirilir (ilk yazı hemen görünür).
const HomeGlobes = lazy(() => import("../features/home/HomeGlobes.jsx"));

export default function Home({ cand, profile, D = {} }) {
  const best = cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0];
  const to = best ? `#/compare/${best.id}/${profile}` : "#/compare";
  const steps = [1, 2, 3];
  return (
    <div className="home home-3d">
      <h2>{t("app.title")}</h2>
      <div className="home-top">
        <p className="purpose big-p">{t("home.purpose")}</p>
        <a className="btn-accent cta" href={to}>{t("home.start")} →</a>
      </div>
      <Suspense fallback={<p className="muted">{t("home.globe.loading")}</p>}>
        <HomeGlobes cand={cand} regions={D.regions} reference={profile === "moon" ? D.rm : D.rs} profile={profile} />
      </Suspense>
      <ol className="steps">
        {steps.map((n) => <li key={n} className="card"><h3>{t(`home.step${n}.t`)}</h3><p>{t(`home.step${n}.d`)}</p></li>)}
      </ol>
      {best && (
        <div className="card">
          <h3>{t("home.example")} <span className="muted">· {PROFILES[profile].name}</span></h3>
          <p>{t("home.example.d").replace("{id}", best.id).replace("{region}", regionLabel(best.region)).replace("{D}", fmt(best.D, 3))}</p>
        </div>
      )}
      <Warn>{t("home.limit")}</Warn>
    </div>
  );
}
