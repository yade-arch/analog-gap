import React, { useState } from "react";
import { t } from "../../i18n/index.js";
import { GAME } from "./rules.js";
import { tf } from "./ui.jsx";

const SOURCES = ["tex.earth", "tex.moon", "tex.mars", "dem", "cand", "ref", "params", "terrain", "models", "nocraft", "nomp"];

/** Başlangıç ekranı (açık arayüz). */
export function StartMenu({ profile, setProfile, onStart, gl, reportHref }) {
  return (
    <div className="g-menu">
      <div className="g-menu-card">
        <p className="g-kicker">{t("game.menu.kicker")}</p>
        <h1>{t("game.title")}</h1>
        <p className="g-lead">{t("game.menu.lead")}</p>
        <div className="g-seg" role="group" aria-label={t("game.menu.target")}>
          {["moon", "mars"].map((k) => <button key={k} className={profile === k ? "on" : ""} aria-pressed={profile === k} onClick={() => setProfile(k)}>{t("game.target." + k)}</button>)}
        </div>
        {gl ? <button className="g-start" onClick={onStart}>{t("game.menu.start")}</button> : <p className="g-lead">{t("game.menu.nogl")}</p>}
        <p className="g-small">{t("game.menu.keys")}</p>
        <p className="g-small"><a href={reportHref}>{t("game.menu.report")}</a> · <a href="#/home">{t("game.menu.site")}</a></p>
        <p className="g-small">{t("game.foot.game")}</p>
      </div>
    </div>
  );
}

/** Duraklatma menüsü (Esc): devam, rapor, kaynaklar, ana menü. */
export function PauseMenu({ onResume, onRestart, reportHref }) {
  const [src, setSrc] = useState(false);
  return (
    <div className="g-menu g-pause" role="dialog" aria-label={t("game.pause.title")}>
      <div className="g-menu-card">
        <h2>{t("game.pause.title")}</h2>
        {!src ? (
          <div className="g-stack">
            <button className="g-start" onClick={onResume}>{t("game.pause.resume")}</button>
            <a className="g-btn" href={reportHref}>{t("game.pause.report")}</a>
            <button className="g-btn" onClick={() => setSrc(true)}>{t("game.pause.sources")}</button>
            <button className="g-btn" onClick={onRestart}>{t("game.pause.menu")}</button>
            <a className="g-btn" href="#/home">{t("game.menu.site")}</a>
          </div>
        ) : (
          <>
            <ul className="g-src">{SOURCES.map((k) => <li key={k}>{tf("game.src." + k, { m: GAME.startMin })}</li>)}</ul>
            <button className="g-btn" onClick={() => setSrc(false)}>{t("game.pause.back")}</button>
          </>
        )}
      </div>
    </div>
  );
}
