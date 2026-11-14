import React, { useState } from "react";
import { t } from "../i18n/index.js";
import { TERMS, tipOf } from "../i18n/terms.js";

/** İpucu: fare, klavye odağı VEYA dokunma/tıklama ile açılır (dokunmatikte çalışır). Çocuk verilmezse sözlük adı yazılır. */
export function Term({ k, children }) {
  const [open, setOpen] = useState(false), tip = tipOf(k);
  return (
    <span className={"term" + (open ? " open" : "")} tabIndex={0} role="note" aria-label={tip} data-tip={tip}
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {children ?? TERMS[k]?.name}
    </span>
  );
}

/** Her sayfanın üstü: tek cümlelik amaç + "Burada ne görüyorum?" satırı. */
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
      <dl>{Object.entries(TERMS).map(([k, x]) => <div key={k}><dt>{x.name}{x.unit ? ` (${x.unit})` : ""}</dt><dd>{x.meaning} <span className="muted">Teknik ad: {x.tech}</span></dd></div>)}</dl>
    </details>
  );
}
