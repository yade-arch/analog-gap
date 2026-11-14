import React, { useEffect, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { webglOK } from "../features/compare/sceneRig.js";
import { createGlobe } from "./globe/scene.js";
import "./globe/globe.css";
import { centroid, coastlines } from "./globe/geo.js";

// Ortak küre. Props: body ("earth"|"moon"|"mars"), markers [{id, lat, lon, kind, label}], onPick(marker | {lat, lon}), selectedId, className.
// Doku yok (doğrulanmış NASA dokusu eklenmedi): düz küre + ızgara; Dünya'da Natural Earth 110m kıyı çizgisi.
let landCache = null;
const loadLand = () => (landCache ||= fetch(import.meta.env.BASE_URL + "data/ne_110m_land.geojson").then((r) => (r.ok ? r.json() : null)).catch(() => null));

function Flat({ markers, onPick, selectedId }) {
  const x = (lon) => ((((lon + 180) % 360) + 360) % 360) * 2, y = (lat) => (90 - lat) * 2;
  return (
    <svg className="globe-flat" viewBox="0 0 720 360" role="img" aria-label={t("globe.flat")}>
      {[-60, -30, 0, 30, 60].map((l) => <line key={"a" + l} x1="0" x2="720" y1={y(l)} y2={y(l)} className="globe-grid" />)}
      {[-120, -60, 0, 60, 120].map((l) => <line key={"o" + l} y1="0" y2="360" x1={x(l)} x2={x(l)} className="globe-grid" />)}
      {markers.map((m) => <circle key={m.id} cx={x(m.lon)} cy={y(m.lat)} r={m.id === selectedId ? 6 : 3.5} className={m.id === selectedId ? "globe-sel" : "globe-mark"} onClick={() => onPick?.(m)} />)}
    </svg>
  );
}

export default function GlobeView({ body = "earth", markers = [], onPick, selectedId = null, className = "" }) {
  const box = useRef(null), api = useRef(null), pickRef = useRef(onPick);
  const [gl] = useState(() => webglOK());
  pickRef.current = onPick;

  useEffect(() => {
    if (!gl || !box.current) return undefined;
    const g = createGlobe(box.current); api.current = g;
    g.onPick((p) => pickRef.current?.(p));
    let live = true;
    if (body === "earth") loadLand().then((j) => { if (live && j) g.setLand(coastlines(j)); });
    return () => { live = false; g.dispose(); api.current = null; };
  }, [gl, body]);
  useEffect(() => {
    const g = api.current; if (!g) return;
    g.setMarkers(markers); g.setSelected(selectedId);
    const c = centroid(markers); if (c) g.lookAt(c.lat, c.lon);
  }, [markers, body, gl]);
  useEffect(() => { api.current?.setSelected(selectedId); }, [selectedId]);

  return (
    <div className={"globe " + className}>
      {gl ? <div ref={box} className="globe-canvas" role="application" aria-label={t("globe.aria")} /> : <Flat markers={markers} onPick={onPick} selectedId={selectedId} />}
      <div className="globe-bar">
        {gl && <><button type="button" onClick={() => api.current?.zoom(0.8)} aria-label={t("globe.zoomin")}>+</button><button type="button" onClick={() => api.current?.zoom(1.25)} aria-label={t("globe.zoomout")}>−</button></>}
        {markers.length > 0 && (
          <select aria-label={t("globe.select")} value={selectedId || ""} onChange={(e) => { const m = markers.find((k) => k.id === e.target.value); if (m) onPick?.(m); }}>
            <option value="">{t("globe.select")} ({markers.length})</option>
            {markers.map((m) => <option key={m.id} value={m.id}>{m.label || m.id}</option>)}
          </select>
        )}
      </div>
      <p className="globe-note">{gl ? t("globe.hint") : t("globe.nowebgl")} {body !== "earth" && t("globe.notexture")} {body === "earth" && t("globe.land")}</p>
    </div>
  );
}
