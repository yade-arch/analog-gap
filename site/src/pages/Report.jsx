import React, { useEffect, useMemo, useState } from "react";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import { SETTINGS } from "../config.js";
import { PROFILES, SOURCES, Tag, fmt } from "../common.jsx";
import { GapPanel } from "../Card.jsx";
import { UNITS, slopeLimit } from "../features/units/index.js";
import { VARIABLES, stationResult } from "../features/variables/index.js";
import { loadDem } from "../features/compare/demLoader.js";
import { exceedFraction } from "../features/compare/stats.js";
import { buildReport } from "../features/mission/report.js";
import { StationTable } from "../hud/StationCard.jsx";
import ReportOverview from "../features/ui/ReportOverview.jsx";

/** Otomatik ANALOG GAP Report (yazdırılabilir). Ekrandaki istasyon kartlarıyla aynı hesap (stationResult). Rover limiti kullanılır. */
export default function Report({ D, profile, cand, id }) {
  const p = cand.features.find((f) => f.properties.id === id)?.properties;
  const refId = SETTINGS.references[profile][0];
  const [dem, setDem] = useState({ ref: null, cand: null, done: false });
  useEffect(() => {
    let live = true; setDem({ ref: null, cand: null, done: false });
    Promise.all([loadDem(refId).catch(() => null), loadDem(id).catch(() => null)]).then(([a, b]) => live && setDem({ ref: a, cand: b, done: true }));
    return () => { live = false; };
  }, [id, refId]);
  const reference = profile === "moon" ? D.rm : D.rs;
  const lim = slopeLimit(UNITS[0], profile, D.params);
  const ctx = useMemo(() => ({ p, profile, reference, tE: D.tE, tM: D.tM, lim, stats: { ref: exceedFraction(dem.ref, lim?.value), cand: exceedFraction(dem.cand, lim?.value) } }), [p, profile, dem, lim?.value]);
  const report = useMemo(() => (p ? buildReport({ p, profile, ctx }) : null), [p, profile, ctx]);
  // Printing: open every closed section so the PDF holds the whole report, close them again after.
  useEffect(() => {
    let opened = [];
    const before = () => { opened = [...document.querySelectorAll(".report details:not([open])")]; opened.forEach((d) => { d.open = true; }); };
    const after = () => { opened.forEach((d) => { d.open = false; }); opened = []; };
    addEventListener("beforeprint", before); addEventListener("afterprint", after);
    return () => { removeEventListener("beforeprint", before); removeEventListener("afterprint", after); };
  }, []);
  // "#/report/<id>/<target>?print=1" (from the result card) opens the print window once the terrain data is in.
  useEffect(() => {
    const q = new URLSearchParams(location.hash.split("?")[1] || "");
    if (!dem.done || q.get("print") !== "1") return;
    q.delete("print"); history.replaceState(null, "", location.hash.split("?")[0] + (q.toString() ? "?" + q : ""));
    const id = setTimeout(() => window.print(), 600);   // let pictures finish drawing
    return () => clearTimeout(id);
  }, [dem.done]);
  if (!p) return <div className="card">This window is not in the candidate file for the chosen target. <a href="#/list">Back to the list</a></div>;

  const body = profile === "moon" ? t("side.moon") : t("side.mars");
  const printPdf = () => window.print();
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    a.download = `analog_gap_report_${p.id}_${profile}.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="report">
      <header className="print-only rep-print-head">
        <h1>ANALOG GAP · {t("rep.title")}</h1>
        <dl>
          <dt>{t("rep.place")}</dt><dd>{regionLabel(p.region)} · {fmt(p.center_lat, 4)}°, {fmt(p.center_lon, 4)}° · {t("rep.window")} {p.id} (10 × 10 km)</dd>
          <dt>{t("rep.ref")}</dt><dd>{PROFILES[profile].name}</dd>
          <dt>{t("gauge.title")}</dt><dd>{p.D == null ? t("list.nodata") : fmt(p.D, 3)} ({t("rs.dHint")})</dd>
          <dt>{t("rep.date")}</dt><dd>{new Date().toISOString().slice(0, 10)}</dd>
          <dt>{t("rep.data")}</dt><dd>{SOURCES}</dd>
        </dl>
      </header>
      <div className="rep-actions noprint">
        <button type="button" className="g-btn primary" onClick={printPdf}>{t("rs.pdf")}</button>
        <span className="muted small">{t("rep.pdfHint")}</span>
        <details><summary>{t("rs.more")}</summary><button type="button" className="g-btn" onClick={download} disabled={!dem.done}>{t("rs.json")}</button>{!dem.done && <span className="muted small"> {t("rep.loading")}</span>}</details>
        <a href={`#/compare/${p.id}/${profile}`}>{t("rep.back")}</a>
      </div>
      <ReportOverview p={p} profile={profile} cand={cand} reference={reference} />
      <details className="g-card more-rep" id="rep-detail">
      <summary>📄 {t("ui.repDetail")}</summary>
      <div className="card">
        <h2>ANALOG GAP Report — {p.id}</h2>
        <div className="muted">{PROFILES[profile].name} · {regionLabel(p.region)} · centre {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}° · 10 × 10 km · {new Date().toISOString().slice(0, 10)}</div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "baseline", marginTop: 8 }}>
          <div><div className="muted">Terrain distance (technical name: D; 0 = identical, lower = more similar) <Tag kind="der" /></div><div className="big">{fmt(p.D, 3)}</div></div>
          <div><div className="muted">Rank (among candidates that passed the filter)</div><div className="big">{p.rank ?? "—"}</div></div>
        </div>
        <p className="muted">D = mean(d_slope, d_relief, d_roughness), equal weights, fixed; d_k = W1 / IQR(reference). No similarity percentage or confidence score is produced. The window is not "a copy of {body}". See the differences (Gap) section.</p>

      </div>
      <div className="grid2">
        <div>
          {VARIABLES.map((v) => {
            const res = stationResult(v, profile, ctx);
            return (
              <div className="card" key={v.id}>
                <h3>{t(v.titleKey)} <span className="muted">· {t("station." + res.status)}</span></h3>
                {res.summary && <p>{res.summary}</p>}
                <StationTable res={res} refTitle={`${body} (${t("side.ref")})`} candTitle={`${t("side.earth")} (${t("side.cand")}) · ${p.id}`} />
                {res.note && res.rows.length > 0 && <p className="muted">{res.note}</p>}
              </div>
            );
          })}
          <div className="card">
            <h3>Labels</h3>
            <p><Tag kind="obs" /> {p.labels?.observed}. <Tag kind="der" /> {p.labels?.derived}. <Tag kind="int" /> {p.labels?.interpretation}.</p>
            <p><span className="tag real">{t("tag.real")}</span><span className="tag calc">{t("tag.calc")}</span><span className="tag sim">{t("tag.sim")}</span> Mission simulation labels. Slope limit{lim ? `: ${lim.value}° (${lim.id}, ${lim.source})` : ": source pending"}. Not a prediction of real performance.</p>
            <p className="muted"><strong>Data products:</strong> {SOURCES}</p>
          </div>
        </div>
        <GapPanel p={p} profile={profile} reference={reference} lim={D.lim} tE={D.tE} tM={D.tM} />
      </div>
      </details>
    </div>
  );
}