import React from "react";
import { t } from "../i18n/index.js";
import { SETTINGS } from "../config.js";
import { dColor, fmt } from "../common.jsx";

/** D göstergesi: yalnızca Python (sim.py) sonucu p.D; yoksa "—". Yüzde veya güven puanı yok. */
export default function DGauge({ cand, profile }) {
  const D = cand?.D, has = D !== null && D !== undefined && Number.isFinite(D);
  const frac = has ? Math.min(1, D / SETTINGS.dScaleMax) : 0;
  return (
    <div className="dgauge" title={has ? "Terrain distance (technical name: D) = mean of the slope, height-difference and roughness distances. 0 = identical, lower = more similar; not a percentage or a physical distance." : t("gauge.nodata")}>
      <div className="lbl">{t("gauge.title")}</div>
      <div className="val" style={{ color: has ? dColor(D) : "var(--muted)" }}>{has ? fmt(D, 3) : t("gauge.none")}</div>
      <div className="bar"><i style={{ width: frac * 100 + "%", background: has ? dColor(D) : "transparent" }} /></div>
      <div className="hint">{t("gauge.hint")}</div>
      <div className="src">{t("gauge.ref." + profile)}{cand ? ` · rank ${cand.rank} · ${cand.passes_filter ? "passed the filter" : "did not pass the filter"}` : ""}</div>
      {!has && cand && <div className="src">{t("gauge.nodata")}</div>}
    </div>
  );
}
