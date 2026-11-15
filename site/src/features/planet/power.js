// nasaPower adapter: Dünya'nın HER noktası için NASA POWER iklim normali (2001–2025, API v2.10). Tarayıcıdan doğrudan (CORS *, anahtar yok).
// Kaynak ızgarası: MERRA-2 0,5° × 0,625° (sıcaklık, nem, rüzgâr, yağış, hücre yüksekliği), CERES SYN1deg 1° (güneş ışınımı). Değer = ızgara hücresi ortalaması, nokta ölçümü DEĞİL.
// Sözleşme providers.js ile aynı; ek olarak cell (hücre sınırları) ve monthlyT2M döner. Önbellek hücre başına; zaman aşımı 20 sn.
export const POWER_URL = "https://power.larc.nasa.gov/";
const P = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M,RH2M";
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const cache = new Map();

/** MERRA-2 hücresi: enlem 0,5°, boylam 0,625° adımlı, merkezli. */
export function powerCell(lat, lon) {
  const la = Math.round(lat / 0.5) * 0.5, lo = Math.round(lon / 0.625) * 0.625;
  return { lat: la, lon: lo, s: la - 0.25, n: la + 0.25, w: lo - 0.3125, e: lo + 0.3125 };
}

export async function fetchPower(lat, lon) {
  const c = powerCell(lat, lon), key = `${c.lat},${c.lon}`;
  if (!cache.has(key)) {
    const url = `${POWER_URL}api/temporal/climatology/point?parameters=${P}&community=RE&longitude=${c.lon}&latitude=${c.lat}&format=JSON`;
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
    cache.set(key, fetch(url, { signal: ctl.signal }).then((r) => { if (!r.ok) throw new Error("NASA POWER " + r.status); return r.json(); })
      .finally(() => clearTimeout(to)).catch((e) => { cache.delete(key); throw e; }));
  }
  const d = await cache.get(key), pr = d.properties?.parameter || {}, fill = d.header?.fill_value ?? -999;
  const ann = (k) => { const v = pr[k]?.ANN; return v == null || v === fill ? null : v; };
  const monthly = MON.map((m) => pr.T2M?.[m]).filter((v) => v != null && v !== fill);
  const z = d.geometry?.coordinates?.[2];
  const src = "NASA POWER (MERRA-2, 0.5°×0.625°)", srcSun = "NASA POWER (CERES SYN1deg, 1°)";
  const v = (id, value, unit, source, resolution_m, kind) => ({ id, value, unit, source, resolution_m, kind, ...(value == null ? { missingReason: "NASA POWER returned no value for this cell" } : {}) });
  const pre = ann("PRECTOTCORR");
  return { cell: c, range: d.header?.range, monthlyT2M: monthly, variables: [
    v("elev", z == null || z === fill ? null : z, "m", src + ", cell mean elevation", 55000, "obs"),
    v("t2m", ann("T2M"), "°C", src, 55000, "obs"), v("t2mMax", ann("T2M_MAX"), "°C", src, 55000, "obs"), v("t2mMin", ann("T2M_MIN"), "°C", src, 55000, "obs"),
    v("tRange", monthly.length === 12 ? Math.max(...monthly) - Math.min(...monthly) : null, "°C", src + "; warmest − coldest month mean", 55000, "der"),
    v("rain", pre == null ? null : pre * 365.25, "mm/year", src + "; mm/day × 365.25", 55000, "der"),
    v("sun", ann("ALLSKY_SFC_SW_DWN"), "kWh/m²/day", srcSun, 110000, "obs"),
    v("wind", ann("WS2M"), "m/s", src, 55000, "obs"), v("rh", ann("RH2M"), "%", src, 55000, "obs"),
  ] };
}

export const nasaPower = { id: "nasaPower", bodies: ["earth"], async query(body, lat, lon) { const r = await fetchPower(lat, lon); return { found: true, place: { cell: r.cell }, ...r }; } };

/** NASA GIBS WMS görüntüsü (EPSG:4326) — seçili bölgenin gerçek NASA görüntüsü. */
export const gibsImg = (lat, lon, layer, half = 1, px = 360) =>
  `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${layer}&STYLES=&CRS=EPSG:4326&BBOX=${lat - half},${lon - half},${lat + half},${lon + half}&WIDTH=${px}&HEIGHT=${px}&FORMAT=image/jpeg`;
export const worldviewUrl = (lat, lon, half = 1) => `https://worldview.earthdata.nasa.gov/?v=${lon - half * 2},${lat - half},${lon + half * 2},${lat + half}`;
