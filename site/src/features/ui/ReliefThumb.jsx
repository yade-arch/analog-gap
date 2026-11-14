import React, { useEffect, useRef, useState } from "react";
import { loadDem } from "../compare/demLoader.js";

// Kart görseli: fotoğraf DEĞİL; pencerenin gerçek yükseklik verisinden (NASADEM / LOLA / CTX DTM) gölgeli kabartma.
// Renk yalnızca cismi belirtir (Mars toprak, Ay gri, Dünya kum-yeşil); yükseklik/iyi-kötü anlamı yok. DEM yoksa düz zemin + not.
const TINT = { mars: [196, 112, 70], moon: [168, 172, 178], earth: [170, 150, 112] };

export default function ReliefThumb({ id, body, label, h = 140 }) {
  const cv = useRef(null), [st, setSt] = useState("load");
  useEffect(() => {
    let live = true;
    if (!id) { setSt("none"); return undefined; }
    setSt("load");
    loadDem(id).then((dem) => {
      if (!live || !cv.current) return;
      const G = dem.G, c = cv.current, W = (c.width = G), H = (c.height = G), g = c.getContext("2d"), img = g.createImageData(W, H);
      const nd = dem.idx.z_nodata, z = dem.z, tint = TINT[body] || TINT.earth, cell = dem.idx.cell_m || 30;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const k = y * W + x, i = k * 4, a = z[k];
        const zx = x > 0 && x < W - 1 ? (z[k + 1] - z[k - 1]) / (2 * cell) : 0, zy = y > 0 && y < H - 1 ? (z[k + W] - z[k - W]) / (2 * cell) : 0;
        const bad = a === nd || z[k + 1] === nd || z[k - 1] === nd || z[k + W] === nd || z[k - W] === nd;
        const s = bad ? 0.35 : Math.max(0, Math.min(1, (1 - 5 * zx + 5 * zy) / Math.sqrt(1 + zx * zx + zy * zy) * 0.75 + 0.15));   // ışık kuzeybatıdan
        img.data[i] = tint[0] * (0.35 + s); img.data[i + 1] = tint[1] * (0.35 + s); img.data[i + 2] = tint[2] * (0.35 + s); img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0); setSt("ok");
    }).catch(() => live && setSt("none"));
    return () => { live = false; };
  }, [id, body]);
  return (
    <div className={"relief " + body} style={{ height: h }}>
      <canvas ref={cv} style={{ display: st === "ok" ? "block" : "none" }} aria-label={label} role="img" />
      {st !== "ok" && <span className="relief-empty">{st === "load" ? "…" : "No relief image (no 3D elevation data for this window on the site)"}</span>}
      {label && <span className="relief-tag">{label}</span>}
    </div>
  );
}
