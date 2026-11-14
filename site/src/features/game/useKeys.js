import { useEffect, useRef } from "react";

/** Basılı tuşlar (küçük harf) bir Set'te; onPress(key) tek basışlar için (E, T, Esc, Enter, 1, 2). Dokunmatik ped aynı Set'i kullanır. */
export default function useKeys(onPress) {
  const keys = useRef(new Set()), cb = useRef(onPress);
  cb.current = onPress;
  useEffect(() => {
    const map = (e) => ({ arrowup: "w", arrowdown: "s", arrowleft: "a", arrowright: "d" })[e.key.toLowerCase()] || e.key.toLowerCase();
    const down = (e) => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "SELECT") return;
      const k = map(e);
      if (!keys.current.has(k)) cb.current?.(k);
      keys.current.add(k);
      if (["w", "a", "s", "d", " "].includes(k)) e.preventDefault();
    };
    const up = (e) => keys.current.delete(map(e));
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, []);
  return keys;
}
