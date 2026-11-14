import React from "react";
import { t } from "../../i18n/index.js";
import { gradient } from "./color.js";

/** WebGL yoksa düz enlem/boylam görünümü: okyanus zemini, kara (Natural Earth), ızgara, çerçeveler, işaretçiler. */
export function Flat({ markers, onPick, selectedId, outlines, land, tex }) {
  const x = (lon) => ((((lon + 180) % 360) + 360) % 360) * 2, y = (lat) => (90 - lat) * 2;
  const rings = (outlines?.features || []).flatMap((f) => (f.geometry?.type === "Polygon" ? f.geometry.coordinates : []));
  const polys = (land?.features || []).flatMap((f) => (f.geometry?.type === "Polygon" ? [f.geometry.coordinates] : f.geometry?.type === "MultiPolygon" ? f.geometry.coordinates : []));
  const path = (poly) => poly.map((r) => "M" + r.map(([lo, la]) => `${((lo + 180) * 2).toFixed(1)},${y(la).toFixed(1)}`).join("L") + "Z").join("");
  return (
    <svg className={"globe-flat" + (land ? " globe-flat-earth" : "")} viewBox="0 0 720 360" role="img" aria-label={t("globe.flat")}>
      {polys.map((p, i) => <path key={"l" + i} d={path(p)} className="globe-landfill" fillRule="evenodd" />)}
      {tex && <image href={tex} x="0" y="0" width="720" height="360" preserveAspectRatio="none" />}
      {[-60, -30, 0, 30, 60].map((l) => <line key={"a" + l} x1="0" x2="720" y1={y(l)} y2={y(l)} className="globe-grid" />)}
      {[-120, -60, 0, 60, 120].map((l) => <line key={"o" + l} y1="0" y2="360" x1={x(l)} x2={x(l)} className="globe-grid" />)}
      {rings.map((r, i) => <polygon key={"r" + i} points={r.map(([lo, la]) => `${x(lo)},${y(la)}`).join(" ")} className="globe-outline" />)}
      {markers.map((m) => <circle key={m.id} cx={x(m.lon)} cy={y(m.lat)} r={m.id === selectedId ? 6 : 3.5} className={m.id === selectedId ? "globe-sel" : "globe-mark"} style={m.color && m.id !== selectedId ? { fill: m.color } : undefined} onClick={() => onPick?.(m)} />)}
    </svg>
  );
}

/** Lejant: renk ölçeği (verildiyse) + "Veri eksik" rengi; Dünya'da okyanus/kara. Seçili işaretçi her zaman amber halka. */
export function Legend({ scale, earth, hasSel }) {
  if (!scale && !earth) return null;
  const s = scale?.stops;
  return (
    <div className="globe-legend">
      {scale && (
        <span className="globe-lg-item">
          <b>{scale.label}</b>
          <small>{scale.loLabel ?? s[0][0]}</small><span className="globe-lg-bar" style={{ background: gradient(scale) }} /><small>{scale.hiLabel ?? s[s.length - 1][0]}</small>
        </span>
      )}
      {scale && <span className="globe-lg-item"><span className="globe-sw" style={{ background: scale.missing }} />{t("globe.legend.missing")}</span>}
      {hasSel && <span className="globe-lg-item"><span className="globe-sw globe-sw-sel" />{t("globe.legend.sel")}</span>}
      {earth && <span className="globe-lg-item"><span className="globe-sw globe-sw-ocean" />{t("globe.legend.ocean")} <span className="globe-sw globe-sw-land" />{t("globe.legend.land")}</span>}
    </div>
  );
}
