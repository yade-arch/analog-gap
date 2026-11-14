import React from "react";
import { ROUTES } from "../config.js";
import { PROFILES } from "../common.jsx";
import { t } from "../i18n/index.js";
import ThemeToggle, { Icon } from "./ThemeToggle.jsx";

const MENU = "M4 6h16M4 12h16M4 18h16";
// Logo: küre ve yörünge yayı (düz çizgi, tek renk).
const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="6.5" /><path d="M2.5 15.5c3-4.5 13-9.5 19-7" /></svg>
);

export default function TopBar({ page, profile, setProfile, reportId, menuOpen, onMenu }) {
  const active = page === "card" ? "list" : page;
  const link = (r) => <a key={r.id} href={"#/" + r.id} className={active === r.id ? "on" : ""} aria-current={active === r.id ? "page" : undefined}>{t(r.key)}</a>;
  return (
    <header className="top">
      <button type="button" className="menu-btn" aria-expanded={!!menuOpen} aria-controls="sidebar" aria-label={t("side.menu")} onClick={onMenu}><Icon d={MENU} size={18} /></button>
      <a className="brand" href="#/home" aria-label={t("nav.home")}><Logo /><h1>{t("app.title")}</h1></a>
      <nav aria-label="Ana gezinme">{ROUTES.map(link)}</nav>
      <div className="spacer" />
      <label className="profile">{t("profile.label")}
        <select value={profile} onChange={(e) => setProfile(e.target.value)} aria-label={t("profile.label")}>
          {Object.entries(PROFILES).map(([k, v]) => <option key={k} value={k}>{v.name} — {t(`profile.${k}.tr`)}</option>)}
        </select>
      </label>
      {reportId ? <a className={"btn-accent" + (page === "report" ? " on" : "")} href={`#/report/${reportId}/${profile}`}>{t("nav.report")}</a> : <button disabled>{t("nav.report")}</button>}
      <ThemeToggle />
    </header>
  );
}
