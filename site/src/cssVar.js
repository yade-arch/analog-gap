// theme.css değişkenini oku (JS tüketiciler: MapLibre, three, tuval). Tema değişince yeniden çağrılmalı (bkz. theme.js). Yoksa d.
export const cssVar = (name, d) => (typeof document !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || d;
