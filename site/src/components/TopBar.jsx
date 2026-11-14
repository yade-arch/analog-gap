import React from "react";
import { ROUTES } from "../config.js";
import { PROFILES } from "../common.jsx";
import { t } from "../i18n/index.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function TopBar({ page, profile, setProfile, reportId }) {
  const active = page === "card" ? "list" : page;
  const link = (r) => <a key={r.id} href={"#/" + r.id} className={(active === r.id ? "on " : "") + (r.primary ? "" : "minor")} aria-current={active === r.id ? "page" : undefined}>{t(r.key)}</a>;
  return (
    <header className="top">
      <a className="brand" href="#/home" aria-label={t("nav.home")}><h1>{t("app.title")}</h1></a>
      <nav aria-label="Ana gezinme">
        {ROUTES.filter((r) => r.primary).map(link)}
        <span className="sep" aria-hidden="true" />
        {ROUTES.filter((r) => !r.primary).map(link)}
      </nav>
      <div className="spacer" />
      <label>{t("profile.label")}:{" "}
        <select value={profile} onChange={(e) => setProfile(e.target.value)} aria-label={t("profile.label")}>
          {Object.entries(PROFILES).map(([k, v]) => <option key={k} value={k}>{v.name} — {t(`profile.${k}.tr`)}</option>)}
        </select>
      </label>
      {reportId ? <a className={"btn-accent" + (page === "report" ? " on" : "")} href={`#/report/${reportId}/${profile}`}>{t("nav.report")}</a> : <button disabled>{t("nav.report")}</button>}
      <ThemeToggle />
    </header>
  );
}
