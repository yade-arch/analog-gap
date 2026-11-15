import React, { useEffect, useRef } from "react";
import { t } from "../i18n/index.js";
import { TAG_KEYS } from "../features/mission/report.js";
import { useNarrow } from "./Fold.jsx";

/** Tablo: istasyon satırları (referans | aday | etiket). Kart ve rapor ortak kullanır. */
export function StationTable({ res, refTitle, candTitle }) {
  if (!res.rows.length) return <p><strong>Data missing</strong>{res.note ? ` — ${res.note}` : ""}. No value was produced.</p>;
  return (
    <table>
      <thead><tr><th>Measure</th><th className="n">{refTitle}</th><th className="n">{candTitle}</th><th>Label</th></tr></thead>
      <tbody>
        {res.rows.map((r) => (
          <tr key={r.label}><td>{r.label}</td>{r.single != null ? <td className="n" colSpan={2}>{r.single}</td> : <><td className="n">{r.ref}</td><td className="n">{r.cand}</td></>}<td><span className={"tag " + r.tag}>{t(TAG_KEYS[r.tag])}</span></td></tr>
        ))}
      </tbody>
    </table>
  );
}

/** Karşılaştırma kartı (ekran). D her zaman Gap uyarısıyla yan yana. */
export default function StationCard({ res, refTitle, candTitle, D, onClose, onNext, last, nextLabel }) {
  const ref = useRef(null);
  const narrow = useNarrow();   // dar ekranda kart sahnenin (sticky) hemen altına kayar; geniş ekranda kart sahne üstünde, kaydırma yok
  useEffect(() => { if (narrow) ref.current?.scrollIntoView?.({ block: "start", behavior: "smooth" }); }, [res.v.id, narrow]);
  return (
    <div ref={ref} className="hud-panel station-card" role="dialog" aria-label={t(res.v.titleKey)}>
      <div className="sc-head">
        <b>{t(res.v.titleKey)}</b>
        <span className="muted">{t("station." + res.status)}</span>
        <span className="spacer" />
        {!last && <button className="hud-btn sm" onClick={onNext}>{nextLabel || t("station.next")}</button>}
        <button className="hud-btn sm" onClick={onClose} aria-label={t("station.close")}>✕</button>
      </div>
      {res.summary && <p className="sc-summary">{res.summary}</p>}
      {res.summary
        ? <details className="sc-more"><summary>{t("station.more")}</summary><StationTable res={res} refTitle={refTitle} candTitle={candTitle} /></details>
        : <StationTable res={res} refTitle={refTitle} candTitle={candTitle} />}
      {res.note && res.rows.length > 0 && <p className="hud-note">{res.note}</p>}
      <p className="hud-note warn-amber"><b>Gap:</b> {t("station.gap")}{D != null ? ` Terrain distance = ${D.toFixed(3)} (0 = identical, lower = more similar; not a physical distance but the difference in landforms).` : ""}</p>
    </div>
  );
}