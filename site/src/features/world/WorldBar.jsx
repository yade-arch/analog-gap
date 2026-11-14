import React from "react";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { REGION_CODES } from "./state.js";
import "./world.css";

const STEP_OF = { home: 1, map: 2, list: 2, card: 3, compare: 3, report: 4 };

/** Üst çubukta sabit: Ay | Mars hedef anahtarı (renkli). */
export function TargetSwitch({ target, setTarget }) {
  return (
    <div className="tgt-switch" role="group" aria-label={t("world.target")}>
      {["moon", "mars"].map((k) => (
        <button key={k} className={"tgt " + k + (target === k ? " on" : "")} aria-pressed={target === k} onClick={() => setTarget(k)}>{t("side." + k)}</button>
      ))}
    </div>
  );
}

/** 4 adımlı ilerleme + "Burada ne görüyorum?" + (harita/listede) Dünya bölge düğmeleri. */
export default function WorldBar({ page, target, region, setRegion, candId }) {
  const cur = STEP_OF[page];
  if (!cur && page !== "method") return null;
  const href = ["#/home", "#/list", candId ? `#/compare/${candId}/${target}` : "#/list", candId ? `#/report/${candId}/${target}` : "#/list"];
  return (
    <div className="worldbar">
      {cur && (
        <ol className="steps4" aria-label={t("world.progress")}>
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className={n === cur ? "on" : n < cur ? "done" : ""}>
              <a href={href[n - 1]} aria-current={n === cur ? "step" : undefined}>{n} · {t("world.step" + n)}</a>
            </li>
          ))}
        </ol>
      )}
      <p className="here"><span className={"tag-body " + target}>{t("side." + target)} ({t("side.ref")})</span> <strong>{t("how.label")}</strong> {t("here." + page)}</p>
      {(page === "map" || page === "list") && (
        <div className="regions" role="group" aria-label={t("world.region")}>
          <span className="tag-body earth">{t("side.earth")} ({t("side.cand")})</span>
          {REGION_CODES.map((r) => (
            <button key={r} className={region === r ? "on" : ""} aria-pressed={region === r} onClick={() => setRegion(r)}>{r === "ALL" ? t("world.allRegions") : regionLabel(r)}</button>
          ))}
        </div>
      )}
    </div>
  );
}
