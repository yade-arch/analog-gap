// Küçük HUD panelleri: birim seçici, kamera, abartı, gözlem günlüğü, mini harita, lejant.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import GlobeView from "../components/GlobeView.jsx";
import { SETTINGS } from "../config.js";
import { UNITS } from "../features/units/index.js";
import Fold from "./Fold.jsx";

export function UnitPicker({ unit, onPick, limits }) {
  return (
    <div className="hud-panel units">
      <Fold title={t("units.title")} open0>
      {UNITS.map((u) => (
        <button key={u.id} className={"hud-btn lg" + (unit === u.id ? " on" : "")} aria-pressed={unit === u.id} onClick={() => onPick(u.id)}>{t(u.labelKey)}</button>
      ))}
      <p className="hud-note">{limits.cur ? `${t("units.limit.src")}: ${limits.cur.value}${limits.cur.unit === "degree" ? "°" : ""} (${limits.cur.id})` : t("units.limit.pending")}</p>
      <p className="hud-note">{t("units.schematic")}</p>
      </Fold>
    </div>
  );
}

export function CameraPicker({ mode, onPick, exag, onExag }) {
  return (
    <div className="hud-panel cam">
      <Fold title={t("cam.title")} open0>
      {SETTINGS.cameraModes.map((m) => (
        <button key={m} className={"hud-btn" + (mode === m ? " on" : "")} aria-pressed={mode === m} onClick={() => onPick(m)}>{t("cam." + m)}</button>
      ))}
      {onExag && <><h4 className="sub">{t("exag.title")}</h4>
      <div className="row">
        {SETTINGS.exaggerations.map((x) => (
          <button key={x} className={"hud-btn sm" + (exag === x ? " on" : "")} aria-pressed={exag === x} onClick={() => onExag(x)}>×{x}</button>
        ))}
      </div></>}
      </Fold>
    </div>
  );
}

export function ObsLog({ entries = [] }) {
  return (
    <div className="hud-panel log">
      <Fold title={t("log.title")}>
        {entries.length ? <ol className="log-list">{entries.map((e) => <li key={e.id}><b>{e.title}</b> {e.text}</li>)}</ol> : <p className="hud-note">{t("log.empty")}</p>}
      </Fold>
    </div>
  );
}

/** Küçük Dünya küresi: arama bölgesi çerçeveleri (regions.geojson) + seçili aday merkezi. Kapalı <details> içindeyken çizilmez (WebGL boşa çalışmasın). */
export function MiniMap({ regions, point }) {
  const ref = useRef(null), [open, setOpen] = useState(false);
  useEffect(() => {
    const d = ref.current?.closest("details"); if (!d) { setOpen(true); return undefined; }
    const f = () => setOpen(d.open); f(); d.addEventListener("toggle", f);
    return () => d.removeEventListener("toggle", f);
  }, []);
  const markers = useMemo(() => (point ? [{ id: "cur", lat: point.lat, lon: point.lon, label: t("cmp.cand") }] : []), [point?.lat, point?.lon]);
  return (
    <div ref={ref} className="hud-panel mini">
      <Fold title={t("map.title")}>
        {open && <GlobeView body="earth" markers={markers} selectedId="cur" outlines={regions} compact />}
        {!point && <small>{t("map.mini.none")}</small>}
      </Fold>
    </div>
  );
}

export function SlopeLegend({ limit }) {
  const e = SETTINGS.slopeEdges, labs = [`<${e[0]}`, ...e.slice(0, -1).map((v, i) => `${v}–${e[i + 1]}`), `≥${e[e.length - 1]}`];
  return (
    <div className="hud-legend">
      <b>{t("legend.slope")} (°)</b>
      {SETTINGS.slopeColors.map((c, i) => <span key={c} className="sw" style={{ background: c }} title={labs[i]}><i>{labs[i]}</i></span>)}
      <span className="sw hatch" title={t("legend.over")}><i>{limit ? `>${limit.value}° ${t("legend.over")}` : t("legend.over") + ": —"}</i></span>
      <span className="sw" style={{ background: SETTINGS.noDataColor }}><i>{t("legend.nodata")}</i></span>
      <small>{t("legend.grid")}{limit ? ` Limit: ${limit.id} · ${limit.source} · ${limit.kind || ""}` : ""}</small>
    </div>
  );
}
