// Which part of the "Find a place" page is shown (one at a time keeps the page light).
import { useEffect, useState } from "react";

export const MAP_SECTIONS = ["all", "globe", "ref", "search", "info"];
let current = "all";

export function setMapSection(s) {
  current = MAP_SECTIONS.includes(s) ? s : "all";
  window.dispatchEvent(new CustomEvent("mapsection", { detail: current }));
}

export function useMapSection() {
  const [s, setS] = useState(current);
  useEffect(() => {
    const f = (e) => setS(e.detail);
    window.addEventListener("mapsection", f);
    return () => window.removeEventListener("mapsection", f);
  }, []);
  return s;
}
