import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fmt, Tag, SOURCES } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { TERMS, regionLabel } from "../../i18n/terms.js";
import { REF_NAME } from "../world/known.js";

// The report as a short paper. Every sentence is a template filled with values that already exist
// (P50, d_k, D); most / least alike = smallest / largest d_k. Nothing is estimated or scored here.
const KEYS = ["slope", "relief", "rough"], DEC = { slope: 1, relief: 0, rough: 2 };
const NAMES = { slope: "slope", relief: "local height difference (relief)", rough: "surface roughness" };
const REF_PROD = { moon: "LOLA LDEM_80S_20M (NASA PDS, 20 m)", mars: "Mars 2020 TRN CTX DTM (USGS for NASA, 20 m)" };
const ll = (p) => `${fmt(Math.abs(p.center_lat), 3)}° ${p.center_lat >= 0 ? "N" : "S"}, ${fmt(Math.abs(p.center_lon), 3)}° ${p.center_lon >= 0 ? "E" : "W"}`;
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.split("{" + k + "}").join(v), s);

export default function ReportPaper({ p, reference, profile }) {
  const body = t("ui.body." + profile);
  const rows = KEYS.map((k) => ({ k, ref: reference?.variables?.[k]?.p50, earth: p?.derived_percentiles?.[k]?.p50, d: p?.d?.[k] }));
  const known = rows.filter((r) => r.d != null);
  const best = known.length ? known.reduce((a, b) => (b.d < a.d ? b : a)) : null;
  const worst = known.length > 1 ? known.reduce((a, b) => (b.d > a.d ? b : a)) : null;
  const name = (r) => NAMES[r.k];
  const missing = rows.filter((r) => r.d == null).map(name);
  const D = p?.D == null ? null : fmt(p.D, 3);
  const place = p.region ? `${regionLabel(p.region)} (${ll(p)})` : ll(p);
  const v = (x, k) => (x == null ? t("list.nodata") : `${fmt(x, DEC[k])} ${TERMS[k].unit}`);
  const bestS = best ? fill(t("pp.bestS"), { x: name(best) }) : "";
  const worstS = worst && worst !== best ? fill(t("pp.worstS"), { x: name(worst) }) : "";
  return (
    <article className="paper">
      <h1>{fill(t("pp.title"), { place, body })}</h1>
      <p className="paper-by">{t("pp.authors")} · {new Date().toISOString().slice(0, 10)}</p>
      <section><h2>{t("pp.abstract")}</h2>
        <p>{fill(t("pp.abstractT"), { ll: ll(p), body, ref: REF_NAME[profile], D: D ?? t("list.nodata"), best: bestS, worst: worstS })}</p>
        <p className="small">{fill(t("pp.kw"), { body })}</p></section>
      <section><h2>{t("pp.intro")}</h2><p>{t("pp.introT")}</p></section>
      <section><h2>{t("pp.aim")}</h2><p>{fill(t("pp.aimT"), { body })}</p></section>
      <section><h2>{t("pp.problem")}</h2><p>{t("pp.problemT")}</p></section>
      <section><h2>{t("pp.method")} <Tag kind="obs" /> <Tag kind="der" /></h2>
        <p>{t(p.onDemand ? "pp.methodPoint" : "pp.methodScan")} {fill(t("pp.methodRef"), { prod: REF_PROD[profile] })}</p>
        <p>{t("pp.methodCalc")}</p></section>
      <section><h2>{t("pp.results")} <Tag kind="der" /></h2>
        <p>{t("pp.resultsT")}</p>
        <table>
          <thead><tr><th scope="col">{t("pp.col.prop")}</th><th scope="col">{t("pp.col.earth")}</th><th scope="col">{body}</th><th scope="col">{t("pp.col.gap")}</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.k}><th scope="row">{NAMES[r.k][0].toUpperCase() + NAMES[r.k].slice(1)}</th><td>{v(r.earth, r.k)}</td><td>{v(r.ref, r.k)}</td><td>{r.d == null ? t("list.nodata") : fmt(r.d, 3)}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row">{t("gauge.title")}</th><td colSpan="3"><b>{D ?? t("list.nodata")}</b></td></tr></tfoot>
        </table></section>
      <section><h2>{t("pp.disc")} <Tag kind="int" /></h2>
        <p>{fill(t("pp.discT"), { body })}</p>
        {missing.length > 0 && <p>{fill(t("pp.discMiss"), { x: missing.join(", ") })}</p>}
        {p.onDemand && <p>{t("pp.discApprox")}</p>}
        <p>{t("pp.discVal")}</p></section>
      <section><h2>{t("pp.concl")} <Tag kind="int" /></h2>
        <p>{D == null ? t("pp.conclNone") : fill(t("pp.conclT"), { D, body, best: bestS })}</p></section>
      <section><h2>{t("pp.refs")}</h2><p className="small">{SOURCES}{p.onDemand ? " · AWS Terrain Tiles (Mapzen/Tilezen; not NASA data)" : ""}</p></section>
    </article>
  );
}

// Print only the paper (used where there is no report page, e.g. a quick check of any point).
export function PrintPaperButton({ className, label, ...props }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const done = () => { document.documentElement.classList.remove("print-paper"); setOn(false); };
    addEventListener("afterprint", done);
    document.documentElement.classList.add("print-paper");
    const id = setTimeout(() => window.print(), 50);
    return () => { clearTimeout(id); removeEventListener("afterprint", done); document.documentElement.classList.remove("print-paper"); };
  }, [on]);
  return (
    <>
      <button type="button" className={className} onClick={() => setOn(true)}>{label}</button>
      {on && createPortal(<div className="paper-portal"><ReportPaper {...props} /></div>, document.body)}
    </>
  );
}
