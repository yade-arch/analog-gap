import React from "react";
import { t } from "../../i18n/index.js";
import { TERMS, tipOf } from "../../i18n/terms.js";
import { fmt, Tag } from "../../common.jsx";
import { PrintPaperButton } from "../ui/ReportPaper.jsx";

// Short result card shown as soon as a comparison is ready. Uses only numbers that already
// exist (P50 values, d_k, D); nothing new is calculated. "Most / least alike" is the smallest /
// largest d_k (lower = more alike); no thresholds or percentages are added.
const KEYS = ["slope", "relief", "rough"];
const DEC = { slope: 1, relief: 0, rough: 2 };

export default function ResultSummary({ p, reference, names, report, download, profile }) {
  const rows = KEYS.map((k) => ({
    k, ref: reference?.variables?.[k]?.p50, earth: p?.derived_percentiles?.[k]?.p50, d: p?.d?.[k],
  }));
  const val = (v, k) => (v == null ? t("list.nodata") : `${fmt(v, DEC[k])} ${TERMS[k].unit}`);
  const known = rows.filter((r) => r.d != null);
  const best = known.length ? known.reduce((a, b) => (b.d < a.d ? b : a)) : null;
  const worst = known.length > 1 ? known.reduce((a, b) => (b.d > a.d ? b : a)) : null;
  const missing = rows.filter((r) => r.d == null).map((r) => TERMS[r.k].name);
  const name = (r) => TERMS[r.k].name.replace("?", "");
  return (
    <section className="g-card rsum" aria-labelledby="rsum-h">
      <h2 id="rsum-h">{t("rs.title")}{p?.onDemand && <span className="rsum-approx" title={t("rs.approxTip")}>{t("rs.approx")}</span>}</h2>
      <dl className="rsum-top">
        <div><dt>{t("rs.loc")}</dt><dd>{names[1]}{p?.center_lat != null && <span className="muted small"> {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}°</span>}</dd></div>
        <div><dt>{t("rs.ref")}</dt><dd>{names[0]}</dd></div>
        <div title={tipOf("D")}><dt>{t("gauge.title")}</dt><dd><b>{p?.D == null ? t("list.nodata") : fmt(p.D, 3)}</b> <span className="muted small">{t("rs.dHint")}</span></dd></div>
      </dl>
      <table className="rsum-t">
        <caption className="sr-only">{t("rs.title")}</caption>
        <thead><tr><th scope="col"></th><th scope="col">{names[1]}</th><th scope="col">{names[0]}</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.k} title={tipOf(r.k)}><th scope="row">{TERMS[r.k].name}</th><td>{val(r.earth, r.k)}</td><td>{val(r.ref, r.k)}</td></tr>
        ))}</tbody>
      </table>
      <h3>{t("rs.mean")} <Tag kind="int" /></h3>
      <ul className="rsum-m">
        {best && <li>{t("rs.best").replace("{x}", name(best))}</li>}
        {worst && worst !== best && <li>{t("rs.worst").replace("{x}", name(worst))}</li>}
        {missing.length > 0 && <li>{t("rs.missing").replace("{x}", missing.join(", "))}</li>}
        <li>{t("rs.careful")}</li>
      </ul>
      <div className="rsum-act">
        {report ? <a className="g-btn primary" href={report}>{t("rs.pdf")}</a> : <PrintPaperButton className="g-btn primary" label={t("rs.pdf")} p={p} reference={reference} profile={profile} />}
        <details><summary>{t("rs.more")}</summary><button type="button" className="g-btn" onClick={download}>{t("rs.json")}</button></details>
      </div>
    </section>
  );
}
