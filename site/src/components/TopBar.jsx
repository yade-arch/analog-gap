import React from "react";
import { ROUTES } from "../config.js";
import { PROFILES } from "../common.jsx";
import { t } from "../i18n/index.js";

export default function TopBar({ page, profile, setProfile, reportId }) {
  const active = page === "card" ? "list" : page;
  return (
    <header className="top">
      <h1>{t("app.title")}</h1>
      <span className="sub">{t("app.sub")}</span>
      <nav aria-label="Ana gezinme">
        {ROUTES.map((r) => <a key={r.id} href={"#/" + r.id} className={active === r.id ? "on" : ""}>{t(r.key)}</a>)}
      </nav>
      <div className="spacer" />
      <label>{t("profile.label")}:{" "}
        <select value={profile} onChange={(e) => setProfile(e.target.value)} aria-label={t("profile.label")}>
          {Object.entries(PROFILES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
        </select>
      </label>
      {reportId ? <a className={"btn-accent" + (page === "report" ? " on" : "")} href={`#/report/${reportId}/${profile}`}>{t("nav.report")}</a> : <button disabled>{t("nav.report")}</button>}
    </header>
  );
}
