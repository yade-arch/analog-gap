import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { webglOK } from "../features/compare/sceneRig.js";
import { createGlobe } from "./globe/scene.js";
import "./globe/globe.css";
import { centroid, coastlines } from "./globe/geo.js";
import { markerColor } from "./globe/color.js";
import { Flat, Legend } from "./globe/GlobeParts.jsx";

// Ortak küre. Props: body ("earth"|"moon"|"mars"), markers [{id, lat, lon, kind, label}], onPick(marker | {lat, lon}), selectedId, className.
// Dünya: varsayılan doku NASA Blue Marble NG (Topografya + Batimetri) 2004-12, 2048x1024 (data_inventory.csv T1; yalnızca görsel). texture={null} -> dokusuz.
// Doku yüklenemezse okyanus + kara dolgusu (Natural Earth 110m, theme.css --globe-*). Ay/Mars dokusuz (bu küre için doğrulama yapılmadı).
// İsteğe bağlı (geriye uyumlu): marker.color (CSS renk, öncelikli), marker.value + colorScale ({stops, missing, label, loLabel?, hiLabel?}:
// value null -> missing rengi), outlines (GeoJSON Polygon çerçeveler), compact (küçük boy). colorScale verilince lejant çıkar.
let landCache = null;
export const EARTH_TEXTURE = import.meta.env.BASE_URL + "data/tex/earth_bmng_200412_2048.jpg";
const loadLand = () => (landCache ||= fetch(import.meta.env.BASE_URL + "data/ne_110m_land.geojson").then((r) => (r.ok ? r.json() : null)).catch(() => null));

export default function GlobeView({ body = "earth", markers = [], onPick, selectedId = null, className = "", outlines = null, compact = false, colorScale = null, texture }) {
  const box = useRef(null), api = useRef(null), pickRef = useRef(onPick);
  const [gl] = useState(() => webglOK());
  const [landJ, setLandJ] = useState(null), [texOk, setTexOk] = useState(false);
  const tex = texture === undefined ? (body === "earth" ? EARTH_TEXTURE : null) : texture;
  pickRef.current = onPick;
  const land = body === "earth" ? landJ : null;
  const shown = useMemo(() => (colorScale ? markers.map((m) => { const c = markerColor(m, colorScale); return c === m.color ? m : { ...m, color: c }; }) : markers), [markers, colorScale]);

  useEffect(() => {
    if (body !== "earth") return undefined;
    let live = true; loadLand().then((j) => { if (live) setLandJ(j); });
    return () => { live = false; };
  }, [body]);
  useEffect(() => {
    if (!gl || !box.current) return undefined;
    const g = createGlobe(box.current, { body }); api.current = g;
    g.onPick((p) => pickRef.current?.(p));
    let live = true; setTexOk(false); g.setTexture(tex).then((ok) => { if (live) setTexOk(ok); });
    return () => { live = false; g.dispose(); api.current = null; };
  }, [gl, body, tex]);
  useEffect(() => { const g = api.current; if (g) { g.setLand(land ? coastlines(land) : null); g.setLandFill(land); } }, [land, gl, body, tex]);
  useEffect(() => {
    const g = api.current; if (!g) return;
    g.setMarkers(shown); g.setSelected(selectedId);
    const c = centroid(shown); if (c) g.lookAt(c.lat, c.lon);
  }, [shown, body, gl]);
  useEffect(() => { api.current?.setSelected(selectedId); }, [selectedId]);
  useEffect(() => { api.current?.setOutlines(outlines ? coastlines(outlines, 1.003) : null); }, [outlines, body, gl]);

  return (
    <div className={"globe " + (compact ? "globe-compact " : "") + className}>
      {gl ? <div ref={box} className="globe-canvas" role="application" aria-label={t("globe.aria")} /> : <Flat markers={shown} onPick={onPick} selectedId={selectedId} outlines={outlines} land={land} tex={tex} />}
      <div className="globe-bar">
        {gl && <><button type="button" onClick={() => api.current?.zoom(0.8)} aria-label={t("globe.zoomin")}>+</button><button type="button" onClick={() => api.current?.zoom(1.25)} aria-label={t("globe.zoomout")}>−</button></>}
        {markers.length > 0 && (
          <select aria-label={t("globe.select")} value={selectedId || ""} onChange={(e) => { const m = markers.find((k) => k.id === e.target.value); if (m) onPick?.(m); }}>
            <option value="">{t("globe.select")} ({markers.length})</option>
            {markers.map((m) => <option key={m.id} value={m.id}>{m.label || m.id}</option>)}
          </select>
        )}
      </div>
      {!compact && <Legend scale={colorScale} earth={body === "earth" && !(texOk || (!gl && tex))} hasSel={markers.length > 0} />}
      <p className="globe-note">{gl ? t("globe.hint") : t("globe.nowebgl")} {body !== "earth" && t("globe.notexture")} {body === "earth" && t(texOk || (!gl && tex) ? "globe.tex.earth" : "globe.land")}</p>
    </div>
  );
}
