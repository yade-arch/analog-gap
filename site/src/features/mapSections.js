// Tab menus: show one part of a page at a time (keeps the page light).
import { useEffect, useState } from "react";

export const SECTIONS = {
  map: ["all", "globe", "ref", "search", "info"],
  compare: ["all", "summary", "places", "view", "stations", "info"],
  list: ["all", "ref", "found", "table", "top"],
};
const cur = { map: "all", compare: "all", list: "all" };

export function setSection(tab, s) {
  cur[tab] = SECTIONS[tab]?.includes(s) ? s : "all";
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

// show(k): true when the whole page or section k is chosen
export const useShow = (tab) => { const s = useSection(tab); return [(k) => s === "all" || s === k, s]; };
