import React, { useEffect, useState } from "react";

const Q = "(max-width: 1279px)";                    // hud.css'teki dar ekran kesimiyle aynı
export function useNarrow() {
  const [n, setN] = useState(() => typeof matchMedia === "function" && matchMedia(Q).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(Q), f = () => setN(m.matches); f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return n;
}

/** Geniş ekranda başlık + içerik; dar ekranda başlık düğmesi ile açılır/kapanır (open0: dar ekranda varsayılan açık). */
export default function Fold({ title, Tag = "h4", open0 = false, children }) {
  const narrow = useNarrow(), [open, setOpen] = useState(open0);
  if (!narrow) return <><Tag>{title}</Tag>{children}</>;
  return (
    <>
      <Tag className={"fold-h" + (open ? " open" : "")}>
        <button className="fold-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{title}</button>
      </Tag>
      {open && children}
    </>
  );
}
