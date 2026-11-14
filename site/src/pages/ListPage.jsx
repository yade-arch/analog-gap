import React from "react";
import { Tag, fmt } from "../common.jsx";
import { Term, Glossary } from "../components/PageIntro.jsx";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import { regionRanks } from "../features/world/state.js";
import { knownIn, REF_NAME } from "../features/world/known.js";

const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replace(`{${k}}`, v), s);

/** Dünya adayı ile referansın tipik (ortanca) değeri yan yana. */
function Pair({ k, unit, p, reference, target }) {
  const r = reference?.variables?.[k]?.p50;
  return (
    <div className="pair">
      <div className="muted"><Term k={k} /> · <Term k="typical">tipik</Term> ({unit})</div>
      <div><span className="tag-body earth">{t("side.earth")}</span> {fmt(p.derived_percentiles[k].p50, 1)} {unit} &nbsp; <span className={"tag-body " + target}>{t("side." + target)}</span> {r == null ? t("list.nodata") : `${fmt(r, 1)} ${unit}`}</div>
    </div>
  );
}

export default function ListPage({ cand, region, profile, reference, known, hasDem }) {
  const all = cand.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank);
  const rr = regionRanks(all);
  const rows = all.filter((p) => region === "ALL" || p.region === region).slice(0, 200);
  const go = (id) => { location.hash = `#/compare/${id}/${profile}`; };
  const rank = (p) => fill(t("world.regRank"), { r: rr[p.id], g: p.rank });
  return (
    <div>
      <h2><span className={"tag-body " + profile}>{t("side." + profile)} ({t("side.ref")})</span> {REF_NAME[profile]}</h2>
      <p className="muted">{fill(t("list.count"), { total: cand.meta.n_windows_total, pass: cand.meta.n_pass_filter, shown: rows.length })} {t("list.shipped")}</p>
      <p className="muted">{t("list.dnote")}</p>
      <div className="top3" aria-label={t("list.top3")}>
        {rows.slice(0, 3).map((p) => {
          const k = knownIn(p, known);
          return (
            <div className="card cand side-earth" key={p.id}>
              <div><span className="tag-body earth">{t("side.earth")} ({t("side.cand")})</span> <strong>{regionLabel(p.region)}</strong></div>
              <div className="muted">{rank(p)}</div>
              <div className="muted">{t("list.vs")} {t("side." + profile)} · {REF_NAME[profile]}</div>
              <div className="dline"><Term k="D" />: <span className="big">{fmt(p.D, 3)}</span> <Tag kind="der" /></div>
              <div className="muted small">{t("list.dmeaning")}</div>
              <Pair k="slope" unit="°" p={p} reference={reference} target={profile} />
              <Pair k="relief" unit="m" p={p} reference={reference} target={profile} />
              <div>{k ? <span className="badge">{t("list.known")}: {k.name}</span> : <span className="badge">{t("list.notInCatalog")}</span>}</div>
              <div className="muted small">{t("list.code")}: {p.id}{hasDem && !hasDem(p.id) ? ` · ${t("list.noDem")}` : ""}</div>
              <button className="btn-accent" onClick={() => go(p.id)}>{t("list.compare")}</button>
            </div>
          );
        })}
      </div>
      <details className="card">
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
