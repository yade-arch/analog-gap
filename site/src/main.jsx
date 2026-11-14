import React from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./theme.css";
import "./features/ui/topx.css";
import "./hud.css";
import App from "./App.jsx";

// After a new deploy, an already open (cached) page may ask for old file names that no longer exist and go blank.
// Vite reports this as "vite:preloadError"; reload once to get the new files (guard against reload loops).
window.addEventListener("vite:preloadError", (e) => {
  let last = 0; try { last = +sessionStorage.getItem("ag-reload") || 0; } catch { /* storage blocked */ }
  if (Date.now() - last < 10000) return;
  try { sessionStorage.setItem("ag-reload", String(Date.now())); } catch { /* storage blocked */ }
  e.preventDefault(); location.reload();
});

createRoot(document.getElementById("root")).render(<App />);
