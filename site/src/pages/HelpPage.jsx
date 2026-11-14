import React from "react";
import { t } from "../i18n/index.js";
import { Glossary } from "../components/PageIntro.jsx";

/** Yardım: mevcut terim sözlüğü (terms.js) ve Yöntem sayfasına bağlantı. Yeni içerik uydurulmadı. */
export default function HelpPage() {
  return (
    <div className="page-narrow">
      <h2>{t("side.help")}</h2>
      <section className="card">
        <p>{t("help.intro")}</p>
        <ul className="link-list">
          <li><a href="#/method">{t("nav.method")}</a> — {t("help.method")}</li>
          <li><a href="#/list">{t("nav.list")}</a> — {t("help.list")}</li>
        </ul>
      </section>
      <Glossary />
    </div>
  );
}
