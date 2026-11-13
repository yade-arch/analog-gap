import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { fmt, D_STOPS } from "./common.jsx";

const FILL = ["interpolate", ["linear"], ["coalesce", ["get", "D"], 1.2], ...D_STOPS.flat()];
const toPoints = (data) => ({
  type: "FeatureCollection",
  features: data.features.map((f) => ({ type: "Feature", properties: f.properties, geometry: { type: "Point", coordinates: [f.properties.center_lon, f.properties.center_lat] } })),
});

export default function MapView({ data, regions, onSelect, selectedId }) {
  const el = useRef(null), map = useRef(null), loaded = useRef(false);

  useEffect(() => {
    const m = new maplibregl.Map({
      container: el.current, center: [-30, 28], zoom: 1.4, attributionControl: false,
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#0f1722" } }] },
    });
    m.on("error", (e) => { if (el.current) el.current.dataset.err = String(e.error?.message || e.message || e).slice(0, 200); });
    m.once("idle", () => { if (el.current) el.current.dataset.idle = "1"; });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "Pencereler: NASADEM_HGT v001 türevi · altlık harita yok · düşük yakınlaştırmada her pencere nokta olarak çizilir" }));
    m.on("load", () => {
      m.addSource("regions", { type: "geojson", data: regions });
      m.addLayer({ id: "regions-line", type: "line", source: "regions", paint: { "line-color": "#8aa0b8", "line-width": 1.2, "line-dasharray": [3, 2] } });
      m.addSource("cand", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({ id: "cand-fill", type: "fill", source: "cand", minzoom: 7, paint: { "fill-color": FILL, "fill-opacity": 0.85 } });
      m.addLayer({ id: "cand-line", type: "line", source: "cand", minzoom: 7, paint: { "line-color": "#0a1020", "line-width": 0.6 } });
      m.addLayer({ id: "cand-pt", type: "circle", source: "pts", maxzoom: 7,
        paint: { "circle-color": FILL, "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 3, 6, 6], "circle-stroke-color": "#0b1d33", "circle-stroke-width": 0.6, "circle-opacity": 0.9 } });
      m.addLayer({ id: "sel", type: "line", source: "cand", filter: ["==", ["get", "id"], ""], paint: { "line-color": "#f0b445", "line-width": 3 } });
      const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      for (const layer of ["cand-fill", "cand-pt"]) {
        m.on("click", layer, (e) => onSelect(e.features[0].properties.id));
        m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"));
        m.on("mousemove", layer, (e) => {
          const p = e.features[0].properties;
          pop.setLngLat(e.lngLat).setHTML(`<b>${p.region}</b> · sıra ${p.rank}<br/>D = ${fmt(p.D, 3)}`).addTo(m);
        });
        m.on("mouseleave", layer, () => { m.getCanvas().style.cursor = ""; pop.remove(); });
      }
      regions.features.forEach((f) => {
        const [w, s, e, n] = f.properties.bbox_wsen;
        const d = document.createElement("div");
        d.textContent = `${f.properties.code} · ${f.properties.name || ""}`;
        d.style.cssText = "font:600 11px system-ui;color:#1c2530;background:rgba(255,255,255,.8);padding:1px 5px;border-radius:3px;pointer-events:none;white-space:nowrap";
        new maplibregl.Marker({ element: d, anchor: "bottom" }).setLngLat([(w + e) / 2, n]).addTo(m);
      });
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
      if (!b.isEmpty()) m.fitBounds(b, { padding: 40, duration: 0 });
    };
    if (loaded.current) apply(); else m.once("data-ready", apply);
  }, [data]);

  useEffect(() => {
    const m = map.current;
    if (m && loaded.current) m.setFilter("sel", ["==", ["get", "id"], selectedId || ""]);
  }, [selectedId]);

  return <div id="map" ref={el} />;
}
