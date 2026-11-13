import React from "react";
import { t } from "../i18n/index.js";

/** Otomatik görev kutusu: başlat/durdur, atla, durum. Süre ve hız "Simülasyon varsayımı" etiketiyle her zaman görünür. */
export default function AutoPanel({ auto, total, label, limitPending, hasScene, onReport }) {
  const { phase, idx } = auto, done = phase === "done";
  const status = done ? t("auto.done") : phase === "idle" ? "" : `${idx + 1}/${total} · ${label} · ${t("auto." + phase)}`;
  return (
    <div className="hud-panel auto" aria-live="polite">
      {auto.active
        ? <div className="row"><button className="hud-btn on" onClick={auto.stop}>{t("auto.stop")}</button><button className="hud-btn" onClick={auto.skip}>{t("auto.skip")}</button></div>
        : <button className="hud-btn lg" disabled={!hasScene} onClick={auto.start}>▶ {t("auto.start")}</button>}
      {status && <p className={"hud-note auto-status" + (done ? " done" : "")}>{status}</p>}
      {done && <button className="hud-btn" onClick={onReport}>{t("auto.report")}</button>}
      <p className="hud-note">{t("auto.hint")}</p>
      {limitPending && <p className="hud-note warn-amber">{t("auto.astro")}</p>}
    </div>
  );
}
