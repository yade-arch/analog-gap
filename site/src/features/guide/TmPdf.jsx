// Time Machine scientific PDF (browser print): only data already in the app — NASA GISTEMP v4 (Earth), dated mission events
// (Moon/Mars), reference products, and the chosen place's GIBS image record (children). Nothing is estimated.
import React, { useEffect, useState } from "react";
import { t } from "../../i18n/index.js";
import { EV } from "./LongTimeline.jsx";

const dec = (g) => {
  const out = [];
  for (let d = 1880; d <= 2020; d += 10) { const v = Object.entries(g).filter(([y]) => +y >= d && +y < d + 10).map(([, x]) => x); if (v.length) out.push([d, v.reduce((a, b) => a + b, 0) / v.length, v.length]); }
  return out;
};

export default function TmPdf({ planet, D, children }) {
  const [j, setJ] = useState(null);
  useEffect(() => { fetch(import.meta.env.BASE_URL + "data/gistemp_global.json").then((r) => r.json()).then(setJ).catch(() => setJ(null)); }, []);
  const g = j?.annual || {}, ys = Object.keys(g).map(Number), last = ys.length ? Math.max(...ys) : null;
  const ref = planet === "moon" ? D.rm : planet === "mars" ? D.rs : null;
  return (
    <>
      <div className="tm-pdfbar noprint"><button className="g-go" onClick={() => window.print()}>{t("pdf.sci.btn")}</button><span className="small muted">{t("game.rs.pdfHint")}</span></div>
      <section className="print-only tm-pdf">
        <h1>ANALOG GAP — {t("pdf.sci.title")}: {t("tm.planet." + planet)}</h1>
        <p>{t("pdf.sci.date")}: {new Date().toISOString().slice(0, 10)}</p>
        <h2>1. {t("pdf.sci.s1")}</h2>
        {planet === "earth" && j ? (
          <>
            <p>{j.product}. {t("pdf.sci.units")}: {j.units}. {t("pdf.sci.src")}: {j.source} ({t("pdf.sci.got")} {j.retrieved}).</p>
            <table><thead><tr><th>{t("pdf.sci.decade")}</th><th>{t("pdf.sci.mean")} (°C)</th><th>n</th></tr></thead>
              <tbody>{dec(g).map(([d, m, n]) => <tr key={d}><td>{d}–{d + 9}</td><td>{m.toFixed(2)}</td><td>{n}</td></tr>)}</tbody></table>
            <p>{t("pdf.sci.keyYears")}: 1900 = {g[1900]?.toFixed(2)} °C · 1950 = {g[1950]?.toFixed(2)} °C · 2000 = {g[2000]?.toFixed(2)} °C · {last} = {g[last]?.toFixed(2)} °C. {t("pdf.sci.change")}: {(g[last] - g[1900]).toFixed(2)} °C ({t("pdf.sci.single")}).</p>
          </>
        ) : <p>{t("lt.noTemp." + planet)} {t("lt.src.ev")}</p>}
        <h2>2. {t("pdf.sci.s2")}</h2>
        <ul>{EV[planet].map(([y, k]) => <li key={k}>{y}: {t("lt." + k)}</li>)}</ul>
        {ref && <><h2>3. {t("pdf.sci.s3")}</h2>
          <p>{ref.label}. {t("pdf.sci.dem")}: {String(ref.dem || "").replace("ortalama", "average")}.</p>
          <table><thead><tr><th></th><th>P10</th><th>P50</th><th>P90</th></tr></thead><tbody>
            {[["slope", "°", 1], ["relief", "m", 0], ["rough", "m", 2]].map(([k, u, d]) => { const v = ref.variables?.[k]; return <tr key={k}><td>{t("pt.v." + k)} ({u})</td>{["p10", "p50", "p90"].map((p) => <td key={p}>{v ? v[p].toFixed(d) : t("ui.noData")}</td>)}</tr>; })}
          </tbody></table>
          {planet === "moon" && D.tM && <p>{t("game.rs.temp")}: {D.tM.product} — {D.tM.provider}. {Object.values(D.tM.windows || {}).map((w) => `${w.name}: ${w.temp_avg_K_p10_p50_p90?.join(" / ") ?? t("ui.noData")} K (avg P10/P50/P90)`).join("; ")}.</p>}
          {planet === "mars" && <p>{t("game.rs.temp.noMars")}.</p>}
        </>}
        <h2>{ref ? 4 : 3}. {t("pdf.sci.s4")}</h2>
        {children || <p>{t("pdf.sci.noPlace")}</p>}
        <h2>{ref ? 5 : 4}. {t("pdf.sci.s5")}</h2>
        <ul><li>{t("pdf.sci.l1")}</li><li>{t("pdf.sci.l2")}</li><li>{t("tm.r.limits")}</li><li>{t("tm.r.terrain")}</li></ul>
      </section>
    </>
  );
}
