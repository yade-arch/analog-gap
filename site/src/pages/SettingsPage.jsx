import React from "react";
import { t } from "../i18n/index.js";
import { useTheme } from "../theme.js";

/** Ayarlar: yalnızca gerçekten çalışan ayar (tema). Diğer ayarlar eklenmedi (sahte seçenek yok). */
export default function SettingsPage() {
  const { pref, theme, setPref } = useTheme();
  return (
    <div className="page-narrow">
      <h2>{t("side.settings")}</h2>
      <section className="card">
        <fieldset className="radio-set">
          <legend>{t("theme.group")}</legend>
          {["light", "dark", "system"].map((k) => (
            <label key={k}><input type="radio" name="theme" value={k} checked={pref === k} onChange={() => setPref(k)} /> {t("theme." + k)}</label>
          ))}
        </fieldset>
        <p className="muted">{t("settings.theme.note").replace("{theme}", t("theme." + theme))}</p>
      </section>
    </div>
  );
}
