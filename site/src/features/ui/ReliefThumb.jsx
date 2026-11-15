import React, { useEffect, useRef, useState } from "react";
import { loadDem } from "../compare/demLoader.js";
import { layerCanvas } from "../overview/layers.js";

// Card image: NOT a photo. Drawn from the window's real elevation data (NASADEM / LOLA / CTX DTM): colour = height
// (light = higher) with sun shading, plus a caption and a 2 km scale bar so it is clear what the picture shows.
export default function ReliefThumb({ id, body, label, h = 140 }) {
  const cv = useRef(null), [st, setSt] = useState("load"), [km, setKm] = useState(10);
  useEffect(() => {
    let live = true;
    if (!id) { setSt("none"); return undefined; }
    setSt("load");
    loadDem(id).then((dem) => {
      if (!live || !cv.current) return;
      const src = layerCanvas(dem, "dem", body), c = cv.current;
      c.width = src.width; c.height = src.height; c.getContext("2d").drawImage(src, 0, 0);
      setKm(((dem.G - 1) * (dem.idx.cell_m || 90)) / 1000); setSt("ok");
    }).catch(() => live && setSt("none"));
    return () => { live = false; };
  }, [id, body]);
  return (
    <div className={"relief " + body} style={{ height: h }}>
      <canvas ref={cv} style={{ display: st === "ok" ? "block" : "none" }} aria-label={label} role="img" />
      {st !== "ok" && <span className="relief-empty">{st === "load" ? "…" : "No relief image (no 3D elevation data for this window on the site)"}</span>}
      {label && <span className="relief-tag">{label}</span>}
      {st === "ok" && (
        <>
          <span className="relief-scale" style={{ width: `${(2 / km) * 100}%` }}>2 km</span>
          <span className="relief-cap">Relief from real elevation data · light = higher · {Math.round(km)} × {Math.round(km)} km</span>
        </>
      )}
    </div>
  );
}
