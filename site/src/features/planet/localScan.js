// localScan adapter: tıklanan nokta mevcut tarama pencerelerinden birine düşüyorsa o pencerenin dosyadaki değerlerini döndürür.
// Dünya: aday pencereler (candidates_<hedef>.geojson, 10×10 km; örtüşenlerden en iyi sıralı). Ay: referans pencere merkezine ≤ 5 km.
// Mars: R2 referans alanının koordinatı veri dosyasında yok -> her nokta "Veri yok". data = { cand, tE, rm, tM, regions, target }.
import { surfaceKm } from "./coords.js";
import { BODIES } from "./registry.js";

const NASADEM = "NASADEM_HGT v001 (NASA LP DAAC)", MODIS = "MODIS Aqua MYD11A2 v061 (2023)";
const v = (id, value, unit, source, resolution_m, kind, missingReason) => ({ id, value: value ?? null, unit, source, resolution_m, kind, ...(value == null ? { missingReason } : {}) });
const inBox = (lat, lon, [w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n;

function earth(lat, lon, { cand, tE, regions }) {
  const reg = regions?.features.find((f) => inBox(lat, lon, f.properties.bbox_wsen))?.properties;
  const hit = (cand?.features || []).filter((f) => { const c = f.geometry.coordinates[0]; const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]); return inBox(lat, lon, [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]); })
    .map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0];
  if (!hit) return { found: false, place: reg ? { region: reg.code } : null, variables: [], missingReason: reg ? "Taranan bölgede ama bu nokta dosyadaki en iyi adaylar arasında değil" : "Bu nokta taranan Dünya bölgelerinin dışında" };
  const P = hit.derived_percentiles, t = tE?.windows?.[hit.id];
  const noT = "Bu pencerede yeterli geçerli sıcaklık ölçümü yok";
  return { found: true, place: { region: hit.region, windowId: hit.id, rank: hit.rank }, variables: [
    v("slope", P.slope.p50, "°", NASADEM, 30, "der"), v("relief", P.relief.p50, "m", NASADEM, 30, "der"), v("rough", P.rough.p50, "m", NASADEM, 30, "der"),
    v("D", hit.D, "", "Hesaplanmış: üç uzaklığın ortalaması", 30, "der", "Örtüşme yetersiz; arazi uzaklığı üretilmedi"),
    v("dT", t?.dT_dn_K_median, "K", MODIS, 1000, "der", noT), v("Tmean", t?.T_mean2_K_median, "K", MODIS, 1000, "der", noT),
  ] };
}

function moon(lat, lon, { rm, tM }) {
  const R = BODIES.moon.radius_km;
  const w = (rm?.windows || []).map((x) => ({ ...x, km: surfaceKm({ lat, lon }, { lat: x.lat, lon: x.lon_E }, R) })).sort((a, b) => a.km - b.km)[0];
  if (!w || w.km > 5) return { found: false, variables: [], missingReason: "Bu nokta Ay referans pencerelerinin dışında (yalnızca Shackleton çevresi tarandı)" };
  const th = tM?.windows?.[w.id], pool = rm.variables, LOLA = "LOLA LDEM_80S_20M (NASA PDS), 30 m'ye örneklendi";
  return { found: true, place: { windowId: w.id, name: w.name, km: w.km }, note: "Eğim/yükseklik farkı/engebe: 3 referans penceresinin birleşik dağılımı (tek pencereye ait değil).", variables: [
    v("slope", pool?.slope?.p50, "°", LOLA, 30, "der", "Veri yok"), v("relief", pool?.relief?.p50, "m", LOLA, 30, "der", "Veri yok"), v("rough", pool?.rough?.p50, "m", LOLA, 30, "der", "Veri yok"),
    v("TavgMoon", th?.temp_avg_K_p10_p50_p90?.[1], "K", "Diviner PRP v2 (model, 2 cm derinlik)", null, "der", "Bu pencere için Diviner değeri yok"),
  ] };
}

export const localScan = {
  id: "localScan", bodies: ["earth", "moon", "mars"],
  async query(body, lat, lon, data = {}) {
    if (body === "earth") return earth(lat, lon, data);
    if (body === "moon") return moon(lat, lon, data);
    return { found: false, variables: [], missingReason: "Mars R2 referans alanının koordinatı veri dosyasında kayıtlı değil; noktaya bağlanamıyor" };
  },
};
