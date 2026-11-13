import React from "react";
import { t } from "../i18n/index.js";

const GL = { D: "gl.D", d_slope: "gl.d_slope", d_relief: "gl.d_relief", d_rough: "gl.d_rough", valid: "gl.valid", slope50: "gl.slope50" };

/** Odaklanılabilir ipucu: fare üzerine gelince veya klavye odağında açıklama görünür (CSS .term). */
export function Term({ k, children }) {
  const tip = t(GL[k]);
  return <span className="term" tabIndex={0} role="note" aria-label={tip} data-tip={tip}>{children}</span>;
}

/** Her sayfanın üstü: tek cümlelik amaç + 1 satırlık "Nasıl okunur" kutusu. */
export default function PageIntro({ purpose, how }) {
  return (
    <div className="intro">
      <p className="purpose">{purpose}</p>
      {how && <p className="how"><strong>{t("how.label")}</strong> {how}</p>}
    </div>
  );
}

export function Glossary() {
  return (
    <details className="gloss">
      <summary>{t("gl.title")}</summary>
      <dl>{Object.entries(GL).map(([k, key]) => <div key={k}><dt>{t(key).split(":")[0]}</dt><dd>{t(key).slice(t(key).indexOf(":") + 1).trim()}</dd></div>)}</dl>
    </details>
  );
}
