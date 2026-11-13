import React from "react";
import { t } from "../i18n/index.js";

/** Sahne üstü şerit: hareket durumu + "Atla" + klavye ipucu. Simülasyon varsayımı uyarısı her zaman görünür. */
export default function MovePanel({ moving, label, onSkip }) {
  return (
    <div className="hud-panel move" aria-live="polite">
      <div className="mv-row">
        <span className="mv-now">{moving ? label : t("move.title")}</span>
        <div className="bar">{moving && <i key={moving.idx} style={{ animationDuration: moving.dur + "ms" }} />}</div>
        <button className="hud-btn sm" onClick={onSkip} disabled={!moving}>{t("move.skip")} (S)</button>
      </div>
      <p className="hud-note warn-amber">{t("move.assume")}</p>
      {moving && moving.gaps > 0 ? <p className="hud-note">{t("move.gaps").replace("{n}", moving.gaps)}</p> : <p className="hud-note mv-keys">{t("move.keys")}</p>}
    </div>
  );
}
