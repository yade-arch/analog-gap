// Tema: "light" | "dark" | "system" tercihi localStorage'da; html[data-theme] index.html betiğiyle ilk boyamadan önce de ayarlanır (aynı anahtar).
import { useEffect, useState } from "react";

export const THEME_KEY = "ag-theme";
const MQ = "(prefers-color-scheme: dark)";
const sys = () => (typeof matchMedia === "function" && matchMedia(MQ).matches ? "dark" : "light");

export function readPref() {
  try { const v = localStorage.getItem(THEME_KEY); return v === "light" || v === "dark" ? v : "system"; } catch { return "system"; }
}
export const resolveTheme = (pref) => (pref === "system" ? sys() : pref);

/** html[data-theme]'i uygula ve "themechange" olayı yay (JS renk tüketicileri yeniden çizer). */
export function applyTheme() {
  const t = resolveTheme(readPref());
  if (document.documentElement.dataset.theme !== t) {
    document.documentElement.dataset.theme = t;
    window.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  }
  return t;
}

export function setThemePref(pref) {
  try { if (pref === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, pref); } catch { /* depolama kapalı: yalnızca bu oturum */ }
  window.dispatchEvent(new CustomEvent("themepref", { detail: pref }));
  return applyTheme();
}

/** Geçerli tema ve tercih; sistem teması değişirse "system" tercihinde izler. */
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || applyTheme());
  const [pref, setPref] = useState(readPref);
  useEffect(() => {
    const onT = (e) => setTheme(e.detail), onP = (e) => setPref(e.detail);
    const m = typeof matchMedia === "function" ? matchMedia(MQ) : null, onSys = () => { if (readPref() === "system") applyTheme(); };
    window.addEventListener("themechange", onT); window.addEventListener("themepref", onP); m?.addEventListener("change", onSys);
    return () => { window.removeEventListener("themechange", onT); window.removeEventListener("themepref", onP); m?.removeEventListener("change", onSys); };
  }, []);
  return { theme, pref, setPref: setThemePref };
}
