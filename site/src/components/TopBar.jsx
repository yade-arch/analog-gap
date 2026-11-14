import React, { useEffect, useState } from "react";
import { ROUTES } from "../config.js";
import { TargetSwitch } from "../features/world/WorldBar.jsx";
import { t } from "../i18n/index.js";

// Sade üst çubuk (referans tasarım): logo, 3 adım (Bölge seç → Karşılaştır → Rapor), bağlantı durumu, üç çizgili menü (☰).
// Diğer sayfalar ve Ay/Mars seçimi ☰ menüsünde. "Bağlantı aktif" tarayıcının gerçek çevrimiçi durumudur (navigator.onLine).
const STEP = { list: 1, map: 1, card: 1, compare: 2, report: 3 };
const Logo = () => (
  <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden="true"><ellipse cx="20" cy="15" rx="18" ry="6" fill="none" stroke="#1f3a8a" strokeWidth="2.4" transform="rotate(-18 20 15)" /><circle cx="20" cy="14" r="9" fill="#1f3a8a" /></svg>
);

export default function TopBar({ page, profile, setProfile, reportId }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const f = () => setOnline(navigator.onLine); addEventListener("online", f); addEventListener("offline", f); return () => { removeEventListener("online", f); removeEventListener("offline", f); }; }, []);
  const cur = STEP[page] || 0, id = reportId;
  const steps = [["ui.step1", "#/list"], ["ui.step2", id ? `#/compare/${id}/${profile}` : "#/list"], ["ui.step3", id ? `#/report/${id}/${profile}` : "#/list"]];
  return (
    <header className="top topx">
      <a className="brand" href="#/home" aria-label={t("nav.home")}><Logo /><h1>Analog Gap</h1></a>
      <ol className="stepx" aria-label={t("world.progress")}>
        {steps.map(([k, h], i) => (
          <li key={k} className={i + 1 === cur ? "on" : i + 1 < cur ? "done" : ""}>
            <a href={h} aria-current={i + 1 === cur ? "step" : undefined}><span className="dot">{i + 1 < cur ? "✓" : i + 1}</span>{t(k)}</a>
          </li>
        ))}
      </ol>
      <span className={"conn" + (online ? "" : " off")}><i />{t(online ? "ui.online" : "ui.offline")}</span>
      <details className="gear">
        <summary aria-label={t("ui.menu")} title={t("ui.menu")}><span className="burger" aria-hidden="true"><i /><i /><i /></span></summary>
        <div className="gear-menu">
          <div className="g-sub">{t("world.target")}</div>
          <TargetSwitch target={profile} setTarget={setProfile} />
          <div className="g-sub">{t("ui.pages")}</div>
          <a href="#/home">{t("nav.home")}</a>
          {ROUTES.map((r) => <a key={r.id} href={"#/" + r.id} aria-current={page === r.id ? "page" : undefined}>{t(r.key)}</a>)}
        </div>
      </details>
    </header>
  );
}
