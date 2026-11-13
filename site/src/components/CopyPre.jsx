import React, { useState } from "react";

/** Satır kaydıran formül/kod bloğu + Kopyala düğmesi (taşma yok). */
export default function CopyPre({ text }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch { setOk(false); }
  };
  return (
    <div className="copypre">
      <button type="button" onClick={copy} aria-label="Formülü kopyala">{ok ? "Kopyalandı" : "Kopyala"}</button>
      <pre className="formula">{text}</pre>
    </div>
  );
}
