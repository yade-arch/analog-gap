import React, { useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { listDiscovered, clearDiscovered, closer } from "../planet/discovered.js";
import { pointId } from "../planet/pointAnalysis.js";
import { gibsImg } from "../planet/power.js";

// "Places you have discovered": every point this viewer checked on the map (kept in this browser). Under each card:
// which reference (Moon or Mars) it is closer to, the terrain distance to both (not a percentage) and the three typical values.
const ll = (x) => `${fmt(Math.abs(x.lat), 2)}° ${x.lat >= 0 ? "N" : "S"}, ${fmt(Math.abs(x.lon), 2)}° ${x.lon >= 0 ? "E" : "W"}`;
const dTxt = (s) => (s?.D != null ? fmt(s.D, 3) : t("disc.noD"));

function DiscCard({ x }) {
  const b = closer(x), body = b ? t("ui.body." + b) : null;
  const vals = [["slope", t("pt.v.slope"), x.p50.slope, "°", 1], ["relief", t("pt.v.relief"), x.p50.relief, "m", 0], ["rough", t("pt.v.rough"), x.p50.rough, "m", 2]];
  return (
    <div className="g-card disc">
      <figure className="disc-img"><img src={gibsImg(x.lat, x.lon, "BlueMarble_ShadedRelief_Bathymetry", 0.25, 320)} alt={t("disc.imgAlt")} width="320" height="320" loading="lazy" /><figcaption>{t("disc.imgSrc")}</figcaption></figure>
      <div className="disc-top">
        <span className={"disc-body " + (b || "none")}>{b ? t("disc.closer").replace("{b}", body) : t("disc.none")}</span>
        <div className="cand2-d" title={t("list.dnote")}><b>{b ? fmt(x[b].D, 3) : "—"}</b><span>{t("gauge.title")}</span></div>
      </div>
      <div className="cand2-loc">{x.name ? x.name.split(",").slice(0, 2).join(",") : ll(x)}</div>
      {x.name && <div className="muted small">{ll(x)}</div>}
      <p className="small disc-ds">{t("ui.body.moon")}: <b>{dTxt(x.moon)}</b> · {t("ui.body.mars")}: <b>{dTxt(x.mars)}</b> <span className="muted">({t("disc.lower")})</span></p>
      <div className="stat3 cardstats">{vals.map(([k, n, v, u, d]) => <div key={k}><span className="muted small">{n}</span><b>{v == null ? t("list.nodata") : `${fmt(v, d)} ${u}`}</b></div>)}</div>
      <p className="muted small">{t("disc.approx")}{x.outsideSRTM ? " " + t("disc.outSrtm") : ""}</p>
      <a className="g-btn" href={`#/compare/${pointId(x.lat, x.lon)}/${b || "moon"}`}>{t("pt.compare")} ›</a>
    </div>
  );
}

export default function Discovered() {
  const [list, setList] = useState(listDiscovered);
  return (
    <section className="disc-wrap">
      <div className="disc-head">
        <h2 className="g-h">{t("disc.title")}</h2>
        {list.length > 0 && <button className="g-btn disc-clear" onClick={() => { clearDiscovered(); setList([]); }}>{t("disc.clear")}</button>}
      </div>
      {list.length === 0
        ? <div className="g-card"><p>{t("disc.empty")}</p><a className="g-btn primary" href="#/map">{t("disc.toMap")} →</a></div>
        : <div className="top3">{list.map((x) => <DiscCard key={x.key} x={x} />)}</div>}
      <p className="muted small">{t("disc.note")}</p>
    </section>
  );
}
