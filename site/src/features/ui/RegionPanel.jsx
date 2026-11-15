import React, { useEffect, useMemo, useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { fetchPower, gibsImg, worldviewUrl, POWER_URL } from "../planet/power.js";
import { surfaceKm } from "../planet/coords.js";
import { queryTerrain } from "../planet/globalTerrain.js";
import PointAnalysis from "./PointAnalysis.jsx";

// Dünya'da herhangi bir yere basınca açılan "Seçilen bölge" paneli: NASA GIBS görüntüsü + NASA POWER iklim normali (hücre ortalaması)
// + bu hedefe göre taranmış en yakın 3 pencere (arazi uzaklığı yalnız taranmış pencerelerde vardır; yeni değer üretilmez).
const ROWS = [["elev", "⛰", 0], ["t2m", "🌡", 1], ["tRange", "↕", 1], ["t2mMax", "☀", 1], ["t2mMin", "❄", 1], ["rain", "🌧", 0], ["sun", "🔆", 1], ["wind", "🌬", 1], ["rh", "💧", 0]];
const LAYERS = [["BlueMarble_ShadedRelief_Bathymetry", "ui.imgColor"], ["ASTER_GDEM_Greyscale_Shaded_Relief", "ui.imgRelief"]];

export default function RegionPanel({ sel, cand, target, refs, onSelect, onClose }) {
  const [st, setSt] = useState({ s: "load" }), [lay, setLay] = useState(0), [n, setN] = useState(0);
  useEffect(() => { let live = true; setSt({ s: "load" }); fetchPower(sel.lat, sel.lon).then((r) => live && setSt({ s: "ok", r })).catch((e) => live && setSt({ s: "err", e: String(e.message || e) })); return () => { live = false; }; }, [sel.lat, sel.lon, n]);
  const near = useMemo(() => (cand?.features || []).map((f) => f.properties).map((p) => ({ ...p, km: surfaceKm(sel, { lat: p.center_lat, lon: p.center_lon }, 6371) })).sort((a, b) => a.km - b.km).slice(0, 3), [cand, sel]);
  const [tr, setTr] = useState({ s: "load" });
  useEffect(() => { let live = true; setTr({ s: "load" }); queryTerrain(sel.lat, sel.lon).then((r) => live && setTr({ s: "ok", r })).catch(() => live && setTr({ s: "err" })); return () => { live = false; }; }, [sel.lat, sel.lon]);
  const [nm, setNm] = useState(sel.name || null);            // place name: search result, else OpenStreetMap Nominatim reverse lookup (not NASA data)
  useEffect(() => {
    if (sel.name) { setNm(sel.name); return undefined; }
    let live = true; setNm(null);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=8&lat=${sel.lat}&lon=${sel.lon}`).then((r) => r.json())
      .then((j) => live && setNm(j?.display_name || null)).catch(() => {});
    return () => { live = false; };
  }, [sel.lat, sel.lon, sel.name]);
  const c = st.r?.cell, T = tr.r;
  return (
    <div className="g-card regpanel">
      <div className="rp-head">
        <div><div className="g-kicker">{t("ui.selRegion")}</div>{nm && <h2 className="g-h rp-name" title="Place name: OpenStreetMap Nominatim">{nm.split(",").slice(0, 3).join(",")}</h2>}<h2 className="g-h">{fmt(Math.abs(sel.lat), 2)}° {sel.lat >= 0 ? "N" : "S"}, {fmt(Math.abs(sel.lon), 2)}° {sel.lon >= 0 ? "E" : "W"}</h2></div>
        <button className="rp-x" onClick={onClose} aria-label={t("station.close")}>✕</button>
      </div>
      <div className="rp-img">
        <img src={gibsImg(sel.lat, sel.lon, LAYERS[lay][0])} alt={t(LAYERS[lay][1])} width="360" height="360" loading="lazy" />
        <div className="rp-tabs">{LAYERS.map(([, k], i) => <button key={k} className={lay === i ? "on" : ""} onClick={() => setLay(i)}>{t(k)}</button>)}</div>
      </div>
      {refs && <PointAnalysis sel={sel} target={target} refs={refs} />}
      <div className="g-sub">⛰ {t("ui.terrain")}</div>
      {tr.s === "load" && <p className="muted">{t("ui.loading")}</p>}
      {tr.s === "err" && <p>{t("ui.terrErr")}</p>}
      {tr.s === "ok" && (T.missing ? <p>{t("list.nodata")}: {T.missing}</p> : (
        <div className="rp-grid">
          {[["elev", "⛰", T.elev, "m", 0], ["relief", "▲", T.relief, "m", 0], ["s50", "◢", T.s50, "°", 1], ["s90", "◣", T.s90, "°", 1], ["valid", "🗺", T.valid, "%", 0]].map(([id, ic, v, u, d]) => (
            <div key={id} title={t("ui.gt." + id + ".m")}><span className="muted"><span className="ic">{ic}</span>{t("ui.gt." + id)}</span><b>{v == null ? t("list.nodata") : `${fmt(v, d)} ${u}`}</b></div>
          ))}
        </div>
      ))}
      <div className="g-sub">🌍 {t("ui.climate")}</div>
      {st.s === "load" && <p className="muted">{t("ui.loading")}</p>}
      {st.s === "err" && <p>{t("ui.powerErr")} <button className="g-btn" style={{ width: "auto" }} onClick={() => setN((x) => x + 1)}>{t("ui.retry")}</button></p>}
      {st.s === "ok" && (
        <div className="rp-grid">
          {ROWS.map(([id, ic, d]) => { const v = st.r.variables.find((x) => x.id === id); return (
            <div key={id} title={`${t("ui.pw." + id + ".m")} ${v.source}`}><span className="muted"><span className="ic">{ic}</span>{t("ui.pw." + id)}</span><b>{v.value == null ? t("list.nodata") : `${fmt(v.value, d)} ${v.unit}`}</b></div>
          ); })}
        </div>
      )}
      <div className="g-sub">🔎 {t("ui.nearScan")}</div>
      {near.map((p) => (
        <button key={p.id} className="rep-row rp-near" onClick={() => onSelect(p.id)}>
          <span className="tag-body earth">{t("side.earth")}</span><span>{regionLabel(p.region)} · {fmt(p.km, 0)} km<br /><span className="muted small">{t("ui.nearD").replace("{b}", t("ui.body." + target))} {fmt(p.D, 3)}</span></span><b>›</b>
        </button>
      ))}
      <details className="rp-src">
        <summary>{t("ui.srcInfo")}</summary>
        <p className="small">{t("ui.pwNote").replace("{range}", st.r?.range || "2001–2025")}{c ? ` ${t("ui.cell")}: ${fmt(c.s, 2)}…${fmt(c.n, 2)}°, ${fmt(c.w, 3)}…${fmt(c.e, 3)}°.` : ""}</p>
        <p className="small">{t("ui.gtNote")}{T && !T.missing ? ` ${t("ui.cell")}: ${fmt(T.cell.s, 2)}…${fmt(T.cell.n, 2)}°, ${fmt(T.cell.w, 2)}…${fmt(T.cell.e, 2)}°.` : ""}</p>
        <p className="small">{t("ui.terrainNote")}</p>
        <p className="small"><a href={POWER_URL} target="_blank" rel="noreferrer">NASA POWER</a> · <a href={worldviewUrl(sel.lat, sel.lon)} target="_blank" rel="noreferrer">NASA Worldview</a> · NASA GIBS</p>
      </details>
    </div>
  );
}
