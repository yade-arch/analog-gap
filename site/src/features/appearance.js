// Colour / black-and-white mode for the whole app. Kept in the browser so it survives page
// changes and reopening (a viewer convenience only; nothing else depends on it).
const KEY = "ag-mono";

export function isMono() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function setMono(on) {
  if (on) document.documentElement.setAttribute("data-mono", "");
  else document.documentElement.removeAttribute("data-mono");
  try { localStorage.setItem(KEY, on ? "1" : "0"); } catch { /* storage blocked: mode lasts this visit */ }
}

setMono(isMono());
