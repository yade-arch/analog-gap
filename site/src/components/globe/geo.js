// Küre geometrisi: enlem/boylam <-> birim küre vektörü, ızgara ve GeoJSON kıyı çizgileri (LineSegments konumları).
const R = Math.PI / 180;

/** Enlem/boylam (derece, boylam doğu pozitif) -> [x, y, z]; y = kuzey kutbu. */
export function toXYZ(lat, lon, r = 1) {
  const a = lat * R, b = lon * R;
  return [r * Math.cos(a) * Math.cos(b), r * Math.sin(a), -r * Math.cos(a) * Math.sin(b)];
}

export function toLatLon(x, y, z) {
  const r = Math.hypot(x, y, z) || 1;
  return { lat: Math.asin(y / r) / R, lon: Math.atan2(-z, x) / R };
}

/** İki nokta arasındaki merkez açı (radyan). */
export function angle(a, b) {
  const p = toXYZ(a.lat, a.lon), q = toXYZ(b.lat, b.lon);
  return Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])));
}

function seg(out, pts, r) {
  for (let i = 1; i < pts.length; i++) out.push(...toXYZ(pts[i - 1][1], pts[i - 1][0], r), ...toXYZ(pts[i][1], pts[i][0], r));
}

/** step derecede enlem/boylam ızgarası. */
export function graticule(step = 30, r = 1.001) {
  const out = [];
  for (let lat = -90 + step; lat < 90; lat += step) seg(out, Array.from({ length: 73 }, (_, i) => [i * 5 - 180, lat]), r);
  for (let lon = -180; lon < 180; lon += step) seg(out, Array.from({ length: 37 }, (_, i) => [lon, i * 5 - 90]), r);
  return out;
}

/** GeoJSON (Polygon/MultiPolygon) halka kenarları. */
export function coastlines(geojson, r = 1.002) {
  const out = [];
  for (const f of geojson?.features || []) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) for (const ring of poly) seg(out, ring, r);
  }
  return out;
}

/** İşaretçilerin ortalama yönü (kamera başlangıcı için); yoksa null. */
export function centroid(markers) {
  if (!markers?.length) return null;
  const s = [0, 0, 0];
  for (const m of markers) { const p = toXYZ(m.lat, m.lon); s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
  return toLatLon(...s);
}
