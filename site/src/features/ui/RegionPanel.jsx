import React, { useEffect, useMemo, useState } from "react";
import { fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { fetchPower, gibsImg, worldviewUrl, POWER_URL } from "../planet/power.js";
import { surfaceKm } from "../planet/coords.js";

// Dünya'da herhangi bir yere basınca açılan "Seçilen bölge" paneli: NASA GIBS görüntüsü + NASA POWER iklim normali (hücre ortalaması)
// + bu hedefe göre taranmış en yakın 3 pencere (arazi uzaklığı yalnız taranmış pencerelerde vardır; yeni değer üretilmez).
const ROWS = [["elev", "⛰", 0], ["t2m", "🌡", 1], ["tRange", "↕", 1], ["t2mMax", "☀", 1], ["t2mMin", "❄", 1], ["rain", "🌧", 0], ["sun", "🔆", 1], ["wind", "🌬", 1], ["rh", "💧", 0]];
const LAYERS = [["BlueMarble_ShadedRelief_Bathymetry", "ui.imgColor"], ["ASTER_GDEM_Greyscale_Shaded_Relief", "ui.imgRelief"]];

export default function RegionPanel({ sel, cand, target, onSelect, onClose }) {
  const [st, setSt] = useState({ s: "load" }), [lay, setLay] = useState(0), [n, setN] = useState(0);
  useEffect(() => { let live = true; setSt({ s: "load" }); fetchPower(sel.lat, sel.lon).then((r) => live && setSt({ s: "ok", r })).catch((e) => live && setSt({ s: "err", e: String(e.message || e) })); return () => { live = false; }; }, [sel.lat, sel.lon, n]);
  const near = useMemo(() => (cand?.features || []).map((f) => f.properties).map((p) => ({ ...p, km: surfaceKm(sel, { lat: p.center_lat, lon: p.center_lon }, 6371) })).sort((a, b) => a.km - b.km).slice(0, 3), [cand, sel]);
  const c = st.r?.cell;
  return (
    <div className="g-card regpanel">
      <div className="rp-head">
        <div><div className="g-kicker">{t("ui.selRegion")}</div><h2 className="g-h">{fmt(Math.abs(sel.lat), 2)}° {sel.lat >= 0 ? "K" : "G"}, {fmt(Math.abs(sel.lon), 2)}° {sel.lon >= 0 ? "D" : "B"}</h2></div>
        <button className="rp-x" onClick={onClose} aria-label={t("station.close")}>✕</button>
      </div>
      <div className="rp-img">
        <img src={gibsImg(sel.lat, sel.lon, LAYERS[lay][0])} alt={t(LAYERS[lay][1])} width="360" height="360" loading="lazy" />
        <div className="rp-tabs">{LAYERS.map(([, k], i) => <button key={k} className={lay === i ? "on" : ""} onClick={() => setLay(i)}>{t(k)}</button>)}</div>
      </div>
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
        <p className="small">{t("ui.terrainNote")}</p>
        <p className="small"><a href={POWER_URL} target="_blank" rel="noreferrer">NASA POWER</a> · <a href={worldviewUrl(sel.lat, sel.lon)} target="_blank" rel="noreferrer">NASA Worldview</a> · NASA GIBS</p>
      </details>
    </div>
  );
}
