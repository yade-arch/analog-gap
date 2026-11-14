import React from "react";
import { useTheme } from "../theme.js";
import { t } from "../i18n/index.js";

// Tek ikon seti: kısa satır içi SVG (yeni paket yok), currentColor ile temaya uyar.
export const ICONS = {
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
};
export const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

/** Üst çubuk sağında güneş (açık) / ay (koyu) düğmeleri. Seçim localStorage'da; "Sistem" Ayarlar sayfasında. */
export default function ThemeToggle() {
  const { theme, setPref } = useTheme();
  return (
    <div className="theme-toggle" role="group" aria-label={t("theme.group")}>
      {["light", "dark"].map((k) => (
        <button key={k} type="button" aria-pressed={theme === k} title={t("theme." + k)} aria-label={t("theme." + k)} onClick={() => setPref(k)}>
          <Icon d={ICONS[k === "light" ? "sun" : "moon"]} />
        </button>
      ))}
    </div>
  );
}
