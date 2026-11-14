import React from "react";
import { Tag, fmt } from "../common.jsx";
import { Term, Glossary } from "../components/PageIntro.jsx";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import { regionRanks } from "../features/world/state.js";
import { knownIn } from "../features/world/known.js";
import RefCard from "../features/ui/RefCard.jsx";
import ReliefThumb from "../features/ui/ReliefThumb.jsx";
import "../features/ui/glass.css";

const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replace(`{${k}}`, v), s);
const C = (k) => (k == null ? null : k - 273.15);

/** Aday kartı: gerçek DEM kabartması, sıra, yer, arazi uzaklığı (yüzde değil), tipik eğim / yükseklik farkı / sıcaklık. */
function CandCard({ p, i, rr, profile, known, tE, hasDem, go }) {
  const k = knownIn(p, known), T = C(tE?.windows?.[p.id]?.T_mean2_K_median);
  return (
    <div className={"g-card cand2" + (i === 0 ? " first" : "")}>
      <div className="cand2-img">
        <ReliefThumb id={hasDem && hasDem(p.id) ? p.id : null} body="earth" h={150} />
        <span className="g-badge">{i + 1}. {t("ui.rank")}</span>
        <div className="cand2-d" title={t("list.dnote")}><b>{fmt(p.D, 3)}</b><span>{t("gauge.title")}</span></div>
      </div>
      <div className="cand2-loc">📍 {regionLabel(p.region)}</div>
      <div className="muted small">{fill(t("world.regRank"), { r: rr[p.id], g: p.rank })} · {t("list.code")} {p.id}</div>
      <dl className="stats three">
        <div><dt><Term k="slope" /></dt><dd>{fmt(p.derived_percentiles.slope.p50, 1)}°</dd></div>
        <div><dt><Term k="relief" /></dt><dd>{fmt(p.derived_percentiles.relief.p50, 1)} m</dd></div>
        <div><dt>{t("ui.temp")}</dt><dd>{T == null ? <span className="muted small">{t("list.nodata")}</span> : `${fmt(T, 0)} °C`}</dd></div>
      </dl>
      <div className="muted small">{k ? `${t("list.known")}: ${k.name}` : t("list.notInCatalog")} <Tag kind="der" /></div>
      <button className={i === 0 ? "g-btn primary" : "g-btn"} onClick={() => go(p.id)}>{t("ui.select")} →</button>
    </div>
  );
}

export default function ListPage({ cand, region, profile, reference, known, hasDem, tE, tM }) {
  const all = cand.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank);
  const rr = regionRanks(all);
  const rows = all.filter((p) => region === "ALL" || p.region === region).slice(0, 200);
  const go = (id) => { location.hash = `#/compare/${id}/${profile}`; };
  return (
    <div className="glass">
      <RefCard target={profile} reference={reference} tM={tM} wide />
      <div className="g-row"><h2 className="g-h">🌍 {t("ui.best")}</h2><span className="muted small">{t("ui.tempNote")}</span></div>
      <div className="top3">{rows.slice(0, 3).map((p, i) => <CandCard key={p.id} {...{ p, i, rr, profile, known, tE, hasDem, go }} />)}</div>
      <p className="muted small">{fill(t("list.count"), { total: cand.meta.n_windows_total, pass: cand.meta.n_pass_filter, shown: rows.length })} {t("list.shipped")} {t("list.dnote")}</p>
      <details className="g-card">
        <summary><strong>{t("list.showAll")}</strong> <span className="muted">({rows.length})</span></summary>
        <p className="muted">{t("list.rowHint")}</p>
        <div className="tablewrap">
          <table>
            <thead><tr>
              <th className="n">{t("list.col.rank")}</th><th>{t("list.col.region")}</th><th className="n"><Term k="D" /></th>
              <th className="n"><Term k="d_slope" /></th><th className="n"><Term k="d_relief" /></th><th className="n"><Term k="d_rough" /></th>
              <th className="n"><Term k="valid" /> (%)</th><th className="n"><Term k="slope" />, <Term k="typical">tipik</Term> (°)</th><th>{t("list.code")}</th><th />
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr className="click" key={p.id} onClick={() => go(p.id)}>
                  <td className="n">{rr[p.id]} / {p.rank}</td><td>{regionLabel(p.region)}</td><td className="n">{fmt(p.D, 3)}</td>
                  <td className="n">{fmt(p.d.slope, 2)}</td><td className="n">{fmt(p.d.relief, 2)}</td><td className="n">{fmt(p.d.rough, 2)}</td>
                  <td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)}</td><td className="n">{fmt(p.derived_percentiles.slope.p50, 1)}</td>
                  <td className="muted small">{p.id}</td>
                  <td><button onClick={(e) => { e.stopPropagation(); go(p.id); }}>{t("list.compare")}</button>{hasDem && !hasDem(p.id) && <span className="muted"> · {t("list.noDem")}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <Glossary />
    </div>
  );
}
