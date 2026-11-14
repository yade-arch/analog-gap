import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { cssVar, fmt, D_STOPS } from "./common.jsx";
import { t } from "./i18n/index.js";
import { regionLabel } from "./i18n/terms.js";

const FILL = ["interpolate", ["linear"], ["coalesce", ["get", "D"], 1.2], ...D_STOPS.flat()];
// NASA GIBS WMTS (EPSG:3857, GoogleMapsCompatible_Level8), katman BlueMarble_ShadedRelief_Bathymetry; adres canlı doğrulandı (HTTP 200, CORS *).
const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg";
const toPoints = (data) => ({
  type: "FeatureCollection",
  features: data.features.map((f) => ({ type: "Feature", properties: f.properties, geometry: { type: "Point", coordinates: [f.properties.center_lon, f.properties.center_lat] } })),
});

// Etiketler ekran uzayında çakışırsa sonrakini gizle (soldan sağa, yukarıdan aşağı).
function declutter(labels, m) {
  const boxes = [];
  for (const { el, lngLat } of labels) {
    el.style.visibility = "visible";
    const p = m.project(lngLat), w = el.offsetWidth || 90, h = el.offsetHeight || 16, W = m.getContainer().clientWidth;
    const shift = Math.max(0, 6 - (p.x - w / 2)) + Math.min(0, W - 6 - (p.x + w / 2));      // kenarda kırpılmasın: etiketi içeri kaydır
    el.style.marginLeft = shift + "px";
    const b = [p.x - w / 2 + shift, p.y - h, p.x + w / 2 + shift, p.y];
    const hit = boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    if (hit) el.style.visibility = "hidden"; else boxes.push(b);
  }
}

export default function MapView({ data, regions, onSelect, selectedId }) {
  // Renkler theme.css değişkenlerinden (açık tema). MapLibre var() anlamaz: değer bir kez okunur.
  const C = useRef(null); C.current ||= { bg: cssVar("--map-bg", "#d3e3f2"), land: cssVar("--globe-land", "#ede9df"), coast: cssVar("--globe-coast", "#6f839b"), ink: cssVar("--ink", "#14243a"), sel: cssVar("--accent", "#1d5fae") };
  const el = useRef(null), map = useRef(null), loaded = useRef(false), pickRef = useRef(onSelect);
  pickRef.current = onSelect;                                   // harita bir kez kurulur; tıklama her zaman güncel işlevi çağırır (profil değişince)

  useEffect(() => {
    const c = C.current;
    const m = new maplibregl.Map({
      container: el.current, center: [-30, 28], zoom: 1.4, attributionControl: false,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": c.bg } }] },
    });
    let gibsFail = 0;
    m.on("error", (e) => {
      const msg = String(e.error?.message || e.message || e);
      if (e.sourceId === "gibs") {
        if (++gibsFail === 1 && el.current) el.current.dataset.offline = "1";
        return;   // altlık görüntü yüklenemezse kıyı çizgileri kalır
      }
      if (el.current) el.current.dataset.err = msg.slice(0, 200);
    });
    m.once("idle", () => { if (el.current) el.current.dataset.idle = "1"; });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new maplibregl.AttributionControl({ compact: false, customAttribution: t(import.meta.env.VITE_OFFLINE ? "map.attribution.offline" : "map.attribution") }));
    m.on("load", () => {
      const base = import.meta.env.BASE_URL || "./";
      m.addSource("land", { type: "geojson", data: `${base}data/ne_110m_land.geojson` });
      m.addLayer({ id: "land-fill", type: "fill", source: "land", paint: { "fill-color": c.land } });
      if (!import.meta.env.VITE_OFFLINE) {                     // çevrimdışı derlemede dış istek yok: yalnızca kıyı çizgileri
        m.addSource("gibs", { type: "raster", tiles: [GIBS], tileSize: 256, maxzoom: 8, attribution: "" });
        m.addLayer({ id: "gibs", type: "raster", source: "gibs", paint: { "raster-opacity": 0.8, "raster-saturation": -0.3 } });
      }
      m.addLayer({ id: "coast", type: "line", source: "land", paint: { "line-color": c.coast, "line-width": 0.7 } });
      m.addSource("regions", { type: "geojson", data: regions });
      m.addLayer({ id: "regions-line", type: "line", source: "regions", paint: { "line-color": c.ink, "line-width": 1.2, "line-dasharray": [3, 2] } });
      m.addSource("cand", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({ id: "cand-fill", type: "fill", source: "cand", minzoom: 7, paint: { "fill-color": FILL, "fill-opacity": 0.9 } });
      m.addLayer({ id: "cand-line", type: "line", source: "cand", minzoom: 7, paint: { "line-color": c.ink, "line-width": 0.6 } });
      m.addLayer({ id: "cand-pt", type: "circle", source: "pts", maxzoom: 7,
        paint: { "circle-color": FILL, "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3.5, 6, 7], "circle-stroke-color": c.ink, "circle-stroke-width": 0.8, "circle-opacity": 0.95 } });
      m.addLayer({ id: "sel", type: "line", source: "cand", filter: ["==", ["get", "id"], ""], paint: { "line-color": c.sel, "line-width": 3 } });
      const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      for (const layer of ["cand-fill", "cand-pt"]) {
        m.on("click", layer, (e) => pickRef.current?.(e.features[0].properties.id));
        m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mousemove", layer, (e) => {
          const p = e.features[0].properties;
          pop.setLngLat(e.lngLat).setHTML(`<b>${regionLabel(p.region)}</b> · ${t("map.rank")} ${p.rank}<br/>D = ${fmt(p.D, 3)}<br/><i>${t("map.clickHint")}</i>`).addTo(m);
        });
        m.on("mouseleave", layer, () => { m.getCanvas().style.cursor = ""; pop.remove(); });
      }
      const labels = regions.features.map((f) => {
        const [w, , e, n] = f.properties.bbox_wsen;
        const d = document.createElement("div");
        d.textContent = f.properties.name || regionLabel(f.properties.code);
        d.style.cssText = "font:600 11px system-ui;color:var(--ink);background:var(--panel);border:1px solid var(--line);padding:1px 5px;border-radius:3px;pointer-events:none;white-space:nowrap";
        const lngLat = [(w + e) / 2, n];
        new maplibregl.Marker({ element: d, anchor: "bottom", offset: [0, -4] }).setLngLat(lngLat).addTo(m);
        return { el: d, lngLat };
      });
      const run = () => declutter(labels, m);
      m.on("move", run); m.on("zoom", run); run();
      loaded.current = true;
      m.fire("data-ready");
    });
    map.current = m;
    return () => m.remove();
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !data) return;
    const apply = () => {
      m.getSource("cand").setData(data);
      m.getSource("pts").setData(toPoints(data));
      if (el.current) el.current.dataset.nfeat = String(data.features.length);
      const b = new maplibregl.LngLatBounds();
      data.features.forEach((f) => f.geometry.coordinates[0].forEach((c) => b.extend(c)));
      if (!b.isEmpty()) m.fitBounds(b, { padding: 60, duration: 0, maxZoom: 5 });
    };
    if (loaded.current) apply(); else m.once("data-ready", apply);
  }, [data]);

  useEffect(() => {
    const m = map.current;
    if (m && loaded.current) m.setFilter("sel", ["==", ["get", "id"], selectedId || ""]);
  }, [selectedId]);

  return <div id="map" ref={el} />;
}
