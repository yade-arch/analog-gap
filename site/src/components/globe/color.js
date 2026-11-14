// Küre renkleri: değer -> renk (tek yönlü sıralı ölçek) ve kara dolgusu dokusu (Natural Earth vektöründen çizilir; uydu dokusu değildir).

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** colorScale = { stops: [[değer, "#rrggbb"], ...] (artan), missing: "#rrggbb", label }. value null/NaN -> missing. */
export function scaleColor(scale, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return scale.missing;
  const s = scale.stops, x = Math.max(s[0][0], Math.min(s[s.length - 1][0], value));
  for (let i = 1; i < s.length; i++) {
    if (x <= s[i][0]) {
      const f = (x - s[i - 1][0]) / (s[i][0] - s[i - 1][0] || 1), a = rgb(s[i - 1][1]), b = rgb(s[i][1]);
      return "#" + a.map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, "0")).join("");
    }
  }
  return s[s.length - 1][1];
}

/** İşaretçi rengi: açık marker.color önceliklidir; yoksa colorScale verilmiş ve markerda value alanı varsa ölçekten. */
export const markerColor = (m, scale) => m.color || (scale && "value" in m ? scaleColor(scale, m.value) : undefined);

/** CSS doğrusal gradyan (lejant çubuğu). */
export const gradient = (scale) => {
  const s = scale.stops, lo = s[0][0], span = s[s.length - 1][0] - lo || 1;
  return `linear-gradient(90deg, ${s.map(([v, c]) => `${c} ${(((v - lo) / span) * 100).toFixed(0)}%`).join(", ")})`;
};

/** Eşdikdörtgen (2:1) tuval: okyanus zemini + GeoJSON kara poligonları. three SphereGeometry UV'si ile hizalı (u=0 -> boylam -180). */
export function landCanvas(geojson, ocean, land, w = 2048) {
  const h = w / 2, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const c = cv.getContext("2d"), X = (lon) => ((lon + 180) / 360) * w, Y = (lat) => ((90 - lat) / 180) * h;
  c.fillStyle = ocean; c.fillRect(0, 0, w, h); c.fillStyle = land;
  for (const f of geojson?.features || []) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) {
      c.beginPath();
      for (const ring of poly) ring.forEach(([lo, la], i) => (i ? c.lineTo(X(lo), Y(la)) : c.moveTo(X(lo), Y(la))));
      c.fill("evenodd");
    }
  }
  return cv;
}
