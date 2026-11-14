import React, { useEffect, useState } from "react";
import { fmt, Tag } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { analysePoint, pointId } from "../planet/pointAnalysis.js";
import { TILE_URL } from "../planet/terrainTiles.js";

// "Selected place" panel section: on-demand landform check of a 10×10 km square at ANY point on Earth
// (Terrain Tiles -> 30 m grid -> slope / height difference / roughness -> terrain distance D to the chosen reference).
const V = [["slope", "°", 1], ["relief", "m", 0], ["rough", "m", 2]];
const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replaceAll("{" + k + "}", v), s);

export default function PointAnalysis({ sel, target, refs }) {
  const [st, setSt] = useState({ s: "load" }), [n, setN] = useState(0);
  useEffect(() => {
    let live = true; setSt({ s: "load" });
    analysePoint(sel.lat, sel.lon, refs).then((r) => live && setSt({ s: "ok", r })).catch((e) => live && setSt({ s: "err", e: String(e.message || e) }));
    return () => { live = false; };
  }, [sel.lat, sel.lon, n, refs.moon, refs.mars]);
  const body = t("ui.body." + target), ref = refs[target]?.variables;
  return (
    <section className="pt-box" aria-live="polite">
      <div className="g-sub">▦ {t("pt.title")}</div>
      {st.s === "load" && <p className="muted">{t("pt.loading")}</p>}
      {st.s === "err" && <p>{t("pt.err")} <span className="muted small">({st.e})</span> <button className="g-btn" style={{ width: "auto" }} onClick={() => setN((x) => x + 1)}>{t("ui.retry")}</button></p>}
      {st.s === "ok" && (st.r.missing ? <p>{t("ui.noData")}: {t("pt.polar")}</p> : <Result r={st.r} target={target} body={body} ref_={ref} />)}
    </section>
  );
}

function Result({ r, target, body, ref_ }) {
  const s = r.scores?.[target] || {}, hasD = s.D != null;
  const low = V.filter(([k]) => s.O?.[k] != null && s.O[k] < 0.25).map(([k]) => t("pt.v." + k).toLowerCase()).join(", ");
  return (
    <>
      <div className="pt-d">
        <span>{fill(t("pt.dTo"), { b: body })} <Tag kind="der" /></span>
        <strong>{hasD ? fmt(s.D, 3) : "—"}</strong>
        <p className="small">{hasD ? t("pt.dMeans") : s.reason === "overlap" ? fill(t("pt.noD.overlap"), { v: low }) : t("pt.noD.land")}</p>
        {s.reason !== "land" && s.O && Object.keys(s.O).length > 0 && <p className="small muted">{t(s.passes ? "pt.pass" : "pt.fail")}</p>}
      </div>
      <div className="pt-vars">
        {V.map(([k, u, d]) => { const c = r.P?.[k], rf = ref_?.[k]; return (
          <div key={k}>
            <b title={t("pt.v." + k + ".m")}>{t("pt.v." + k)}</b>
            <span className="small muted">{t("pt.v." + k + ".m")}</span>
            <span className="small">{t("pt.here")}: {c ? fill(t("pt.typ"), { v: `${fmt(c.p50, d)} ${u}`, a: fmt(c.p10, d), c: `${fmt(c.p90, d)} ${u}` }) : t("ui.noData")}</span>
            <span className="small">{fill(t("pt.ref"), { b: body })}: {rf ? fill(t("pt.typ"), { v: `${fmt(rf.p50, d)} ${u}`, a: fmt(rf.p10, d), c: `${fmt(rf.p90, d)} ${u}` }) : t("ui.noData")}</span>
            <span className="small"><span title={t("pt.ov.m")}>{t("pt.ov")}: {s.O?.[k] != null ? fmt(s.O[k], 2) : t("ui.noData")}</span> · <span title={t("pt.dk.m")}>{t("pt.dk")}: {s.d?.[k] != null ? fmt(s.d[k], 3) : t("ui.noData")}</span></span>
          </div>
        ); })}
      </div>
      <div className="rp-grid pt-grid">
        <div><span className="muted">{t("pt.land")}</span><b>{fmt(r.valid * 100, 1)} %</b></div>
        <div><span className="muted">{t("pt.elev")}</span><b>{r.z ? `${fmt(r.z.min, 0)} – ${fmt(r.z.max, 0)} m` : t("ui.noData")}</b></div>
      </div>
      <p className="small pt-note">⚠ {t("pt.approx")}</p>
      {r.outsideSRTM && <p className="small pt-note">⚠ {t("pt.outSrtm")}</p>}
      {r.dem && <a className="g-btn pt-cmp" href={`#/compare/${pointId(r.lat, r.lon)}/${target}`}>{t("pt.compare")} →</a>}
      <details className="rp-src">
        <summary>{t("pt.how")}</summary>
        <p className="small">{fill(t("pt.how.text"), { z: r.zoom, px: fmt(r.srcPix, 1), k: r.k })}</p>
        <p className="small muted">{fill(t("pt.time"), { f: r.ms.fetch, n: r.tiles ?? "—", m: r.ms.math, c: r.cached ? t("pt.cached") : "" })}</p>
        <p className="small muted"><code>{TILE_URL}</code></p>
      </details>
    </>
  );
}
