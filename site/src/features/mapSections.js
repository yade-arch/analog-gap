// Tab menus: each page shows one part at a time (keeps the page light). The first part is the default.
import { useEffect, useState } from "react";

export const SECTIONS = {
  map: ["globe", "search", "ref", "info"],
  compare: ["summary", "view", "places", "info"],
  list: ["found", "top", "table", "ref"],
};
const cur = Object.fromEntries(Object.entries(SECTIONS).map(([k, v]) => [k, v[0]]));

export function setSection(tab, s) {
  cur[tab] = SECTIONS[tab]?.includes(s) ? s : SECTIONS[tab]?.[0];
  window.dispatchEvent(new CustomEvent("pagesection", { detail: { tab, s: cur[tab] } }));
}

export function useSection(tab) {
  const [s, setS] = useState(cur[tab]);
  useEffect(() => {
    const f = (e) => e.detail.tab === tab && setS(e.detail.s);
    window.addEventListener("pagesection", f);
    return () => window.removeEventListener("pagesection", f);
  }, [tab]);
  return s;
}

// show(k): true when part k is the chosen one
export const useShow = (tab) => { const s = useSection(tab); return [(k) => s === k, s]; };
