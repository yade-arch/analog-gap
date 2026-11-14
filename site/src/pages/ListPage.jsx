import React from "react";
import { Tag, fmt } from "../common.jsx";
import { Term, Glossary } from "../components/PageIntro.jsx";
import { t } from "../i18n/index.js";
import { regionLabel, tipOf } from "../i18n/terms.js";
import { regionRanks, REGION_CODES } from "../features/world/state.js";
import { knownIn } from "../features/world/known.js";
import RefCard, { ICON } from "../features/ui/RefCard.jsx";
import ReliefThumb from "../features/ui/ReliefThumb.jsx";
import Discovered from "../features/ui/Discovered.jsx";
import "../features/ui/glass.css";

const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replace(`{${k}}`, v), s);

/** Aday kartı (referans tasarım): kabartma görseli (gerçek DEM), sıra, yer, arazi uzaklığı kutusu (yüzde değil), 3 değer, Seç. */
function CandCard({ p, i, tE, hasDem, go, profile }) {
  const T = tE?.windows?.[p.id]?.T_mean2_K_median;
  const st = [["slope", t("ui.slope"), `${fmt(p.derived_percentiles.slope.p50, 1)}°`, tipOf("slope")], ["relief", t("ui.relief"), `${fmt(p.derived_percentiles.relief.p50, 1)} m`, tipOf("relief")],
    ["temp", t("ui.temp"), T == null ? t("list.nodata") : `${fmt(T - 273.15, 0)} °C`, t("ui.tempNote")]];
  return (
    <div className={"g-card cand2" + (i === 0 ? " first" : "")}>
      <div className="cand2-img">
        <ReliefThumb id={hasDem && hasDem(p.id) ? p.id : null} body="earth" h={150} />
        <span className="g-badge">{i === 0 ? "🏆 " : ""}{i + 1}. {t("ui.rank")}</span>
        <div className="cand2-d" title={t("list.dnote")}><b>{fmt(p.D, 3)}</b><span>{t("gauge.title")}</span></div>
      </div>
      <div className="cand2-loc">📍 {regionLabel(p.region)}</div>
      <div className="muted small">{t("disc.vs").replace("{b}", t("ui.body." + profile))}</div>
      <div className="stat3 cardstats">{st.map(([k, n, x, tip]) => <div key={k} title={tip}><span className="muted"><span className="ic">{ICON[k]}</span>{n}</span><b>{x}</b></div>)}</div>
      <button className={i === 0 ? "g-btn primary" : "g-btn"} onClick={() => go(p.id)}>{i === 0 ? "→ " : ""}{t("ui.select")}{i === 0 ? "" : " ›"}</button>
    </div>
  );
}

export default function ListPage({ cand, region, setRegion, profile, reference, known, hasDem, tE, tM }) {
  const all = cand.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank);
  const rr = regionRanks(all);
  const rows = all.filter((p) => region === "ALL" || p.region === region).slice(0, 200);
  const go = (id) => { location.hash = `#/compare/${id}/${profile}`; };
  return (
    <div className="glass">
      <RefCard target={profile} reference={reference} tM={tM} wide />
      <Discovered />
      <details className="more">
        <summary><h2 className="g-h">🌐 {t("disc.scan")}</h2><span className="more-btn">{t("ui.details")} ⌄</span></summary>
        <div className="g-card">
          <div className="regions">{REGION_CODES.map((r) => <button key={r} className={region === r ? "on" : ""} aria-pressed={region === r} onClick={() => setRegion(r)}>{r === "ALL" ? t("world.allRegions") : regionLabel(r)}</button>)}</div>
          <p className="muted small">{fill(t("list.count"), { total: cand.meta.n_windows_total, pass: cand.meta.n_pass_filter, shown: rows.length })} {t("list.shipped")} {t("list.dnote")} {t("ui.tempNote")} {t("ui.refSrc." + profile)}</p>
          <div className="tablewrap">
            <table>
              <thead><tr>
                <th className="n">{t("list.col.rank")}</th><th>{t("list.col.region")}</th><th className="n"><Term k="D" /></th>
                <th className="n"><Term k="d_slope" /></th><th className="n"><Term k="d_relief" /></th><th className="n"><Term k="d_rough" /></th>
                <th className="n"><Term k="valid" /> (%)</th><th>{t("ui.catalog")}</th><th>{t("list.code")}</th><th />
              </tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr className="click" key={p.id} onClick={() => go(p.id)}>
                    <td className="n">{rr[p.id]} / {p.rank}</td><td>{regionLabel(p.region)}</td><td className="n">{fmt(p.D, 3)}</td>
                    <td className="n">{fmt(p.d.slope, 2)}</td><td className="n">{fmt(p.d.relief, 2)}</td><td className="n">{fmt(p.d.rough, 2)}</td>
                    <td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)}</td><td className="small">{knownIn(p, known)?.name || t("ui.notInCat")}</td>
                    <td className="muted small">{p.id}</td>
                    <td><button onClick={(e) => { e.stopPropagation(); go(p.id); }}>{t("list.compare")}</button>{hasDem && !hasDem(p.id) && <span className="muted"> · {t("list.noDem")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small"><Tag kind="obs" /><Tag kind="der" /><Tag kind="int" /></p>
          <Glossary />
        </div>
      </details>
      <div className="top3">{rows.slice(0, 3).map((p, i) => <CandCard key={p.id} {...{ p, i, tE, hasDem, go, profile }} />)}</div>
    </div>
  );
}
