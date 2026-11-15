import React, { useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { listDiscovered, clearDiscovered, closer, toggleFavorite } from "../planet/discovered.js";
import { pointId } from "../planet/pointAnalysis.js";
import { gibsImg } from "../planet/power.js";

// "Places you explored": every point this viewer checked on the map (kept in this browser). Under each card:
// which reference (Moon or Mars) it is closer to, the terrain distance to both (not a percentage) and the three typical values.
// Viewers can star places, filter the list and pick two places to see their saved numbers side by side (no new calculation).
const ll = (x) => `${fmt(Math.abs(x.lat), 2)}° ${x.lat >= 0 ? "N" : "S"}, ${fmt(Math.abs(x.lon), 2)}° ${x.lon >= 0 ? "E" : "W"}`;
const dTxt = (s) => (s?.D != null ? fmt(s.D, 3) : t("disc.noD"));
const label = (x) => (x.name ? x.name.split(",").slice(0, 2).join(",") : ll(x));
const when = (ms) => (ms ? new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);
const VALS = [["slope", "pt.v.slope", "°", 1], ["relief", "pt.v.relief", "m", 0], ["rough", "pt.v.rough", "m", 2]];
const WEEK = 7 * 24 * 3600 * 1000;
const FILTERS = {
  all: () => true,
  moon: (x) => closer(x) === "moon",
  mars: (x) => closer(x) === "mars",
  fav: (x) => !!x.fav,
  recent: (x) => x.t && Date.now() - x.t < WEEK,
};

function DiscCard({ x, onFav, picked, onPick, pickFull }) {
  const b = closer(x), body = b ? t("ui.body." + b) : null;
  return (
    <div className="g-card disc">
      <figure className="disc-img"><img src={gibsImg(x.lat, x.lon, "BlueMarble_ShadedRelief_Bathymetry", 0.25, 320)} alt={t("disc.imgAlt")} width="320" height="320" loading="lazy" /><figcaption>{t("disc.imgSrc")}</figcaption></figure>
      <div className="disc-top">
        <span className={"disc-body " + (b || "none")}>{b ? t("disc.closer").replace("{b}", body) : t("disc.none")}</span>
        <div className="cand2-d" title={t("list.dnote")}><b>{b ? fmt(x[b].D, 3) : "—"}</b><span>{t("gauge.title")}</span></div>
      </div>
      <div className="disc-name">
        <div className="cand2-loc">{label(x)}</div>
        <button type="button" className={"disc-fav" + (x.fav ? " on" : "")} aria-pressed={!!x.fav} onClick={() => onFav(x.key)}
          aria-label={t(x.fav ? "disc.unfav" : "disc.fav")} title={t(x.fav ? "disc.unfav" : "disc.fav")}>{x.fav ? "★" : "☆"}</button>
      </div>
      {x.name && <div className="muted small">{ll(x)}</div>}
      {when(x.t) && <div className="muted small">{t("disc.when").replace("{d}", when(x.t))}</div>}
      <p className="small disc-ds">{t("ui.body.moon")}: <b>{dTxt(x.moon)}</b> · {t("ui.body.mars")}: <b>{dTxt(x.mars)}</b> <span className="muted">({t("disc.lower")})</span></p>
      <div className="stat3 cardstats">{VALS.map(([k, n, u, d]) => <div key={k}><span className="muted small">{t(n)}</span><b>{x.p50[k] == null ? t("list.nodata") : `${fmt(x.p50[k], d)} ${u}`}</b></div>)}</div>
      <p className="muted small">{t("disc.approx")}{x.outsideSRTM ? " " + t("disc.outSrtm") : ""}</p>
      <label className="disc-pick"><input type="checkbox" checked={picked} disabled={!picked && pickFull} onChange={() => onPick(x.key)} /> {t("disc.pick")}</label>
      <a className="g-btn" href={`#/compare/${pointId(x.lat, x.lon)}/${b || "moon"}`}>{t("pt.compare")} ›</a>
    </div>
  );
}

// Two saved places side by side: only the numbers that were saved for each, with units.
function PairTable({ a, b, onClear }) {
  const row = (name, f) => <tr><th scope="row">{name}</th><td>{f(a)}</td><td>{f(b)}</td></tr>;
  const v = (k, u, d) => (x) => (x.p50[k] == null ? t("list.nodata") : `${fmt(x.p50[k], d)} ${u}`);
  return (
    <section className="g-card disc-pair" aria-labelledby="pair-h">
      <h3 id="pair-h">{t("disc.pairTitle")}</h3>
      <table className="rsum-t">
        <thead><tr><th scope="col"></th><th scope="col">{label(a)}</th><th scope="col">{label(b)}</th></tr></thead>
        <tbody>
          {row(t("disc.pairMoon"), (x) => dTxt(x.moon))}
          {row(t("disc.pairMars"), (x) => dTxt(x.mars))}
          {VALS.map(([k, n, u, d]) => <React.Fragment key={k}>{row(t(n), v(k, u, d))}</React.Fragment>)}
        </tbody>
      </table>
      <p className="muted small">{t("disc.pairNote")}</p>
      <button type="button" className="g-btn" onClick={onClear}>{t("disc.pairClear")}</button>
    </section>
  );
}

export default function Discovered() {
  const [list, setList] = useState(listDiscovered);
  const [filter, setFilter] = useState("all");
  const [picks, setPicks] = useState([]);
  const shown = list.filter(FILTERS[filter]);
  const pick = (key) => setPicks((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length < 2 ? [...p, key] : p));
  const pair = picks.map((k) => list.find((x) => x.key === k)).filter(Boolean);
  return (
    <section className="disc-wrap">
      <div className="disc-head">
        <h2 className="g-h">{t("disc.title")}</h2>
        {list.length > 0 && <button className="g-btn disc-clear" onClick={() => { clearDiscovered(); setList([]); setPicks([]); }}>{t("disc.clear")}</button>}
      </div>
      {list.length === 0
        ? <div className="g-card"><p>{t("disc.empty")}</p><a className="g-btn primary" href="#/map">{t("disc.toMap")}</a></div>
        : <>
          <div className="disc-filters" role="group" aria-label={t("disc.filter")}>
            {Object.keys(FILTERS).map((k) => <button key={k} type="button" aria-pressed={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{t("disc.f." + k)}</button>)}
          </div>
          {pair.length === 2 ? <PairTable a={pair[0]} b={pair[1]} onClear={() => setPicks([])} /> : <p className="muted small">{t("disc.pickHint")}</p>}
          {shown.length === 0
            ? <div className="g-card"><p>{t("disc.noneHere")}</p></div>
            : <div className="top3">{shown.map((x) => <DiscCard key={x.key} x={x} onFav={(k) => setList(toggleFavorite(k))} picked={picks.includes(x.key)} onPick={pick} pickFull={picks.length >= 2} />)}</div>}
        </>}
      <p className="muted small">{t("disc.note")}</p>
    </section>
  );
}
