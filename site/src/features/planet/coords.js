// Coordinate System + Geospatial Picking (saf matematik, three.js gerektirmez; düğüm testlerinde çalışır).
// Çerçeve: birim küre, y = kuzey kutbu, boylam doğu pozitif; three.js SphereGeometry doku eşlemesiyle uyumlu (components/globe/geo.js ile aynı).
// pick: küre yerel çerçevesindeki ışın (o, d) -> en yakın kesişim -> {lat, lon}; ıskalarsa null.
export { toXYZ, toLatLon } from "../../components/globe/geo.js";
import { toLatLon } from "../../components/globe/geo.js";

const D2R = Math.PI / 180;
/** Boylamı [-180, 180) aralığına getirir. */
export const normLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** Işın-küre kesişimi (yarıçap r, merkez orijin). Dönen: ışın parametresi t >= 0 veya null. */
export function raySphere(o, d, r = 1) {
  const a = d[0] ** 2 + d[1] ** 2 + d[2] ** 2, b = 2 * (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]), c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc), t1 = (-b - s) / (2 * a), t2 = (-b + s) / (2 * a);
  return t1 >= 0 ? t1 : t2 >= 0 ? t2 : null;
}

/** Ekran ışını (küre yerel çerçevesinde) -> {lat, lon} veya null. */
export function pick(o, d, r = 1) {
  const t = raySphere(o, d, r);
  if (t == null) return null;
  const ll = toLatLon(o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]);
  return { lat: ll.lat, lon: normLon(ll.lon) };
}

/** İki nokta arası yüzey uzaklığı (km), haversine; R = cisim yarıçapı (km). */
export function surfaceKm(a, b, R) {
  const p1 = a.lat * D2R, p2 = b.lat * D2R, dl = (b.lon - a.lon) * D2R, dp = p2 - p1;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
