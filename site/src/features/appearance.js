// Appearance for the whole app: dark (default), light (white) or black-and-white. Kept in the browser so it
// survives page changes and reopening (a viewer convenience only; nothing else depends on it).
const KEY = "ag-theme", OLD = "ag-mono";
export const THEMES = ["dark", "light", "mono"];

export function getTheme() {
  try {
    const v = localStorage.getItem(KEY);
    if (THEMES.includes(v)) return v;
    return localStorage.getItem(OLD) === "1" ? "mono" : "dark";
  } catch { return "dark"; }
}

export function setTheme(v) {
  const th = THEMES.includes(v) ? v : "dark", el = document.documentElement;
  el.toggleAttribute("data-mono", th === "mono");
  el.toggleAttribute("data-light", th === "light");
  try { localStorage.setItem(KEY, th); } catch { /* storage blocked: choice lasts this visit */ }
}

setTheme(getTheme());
