// Scientific Data Provider (adapter). Sözleşme: adapter = { id, bodies:[...], query(body, lat, lon, data) -> Promise<{ found, place?, variables:[...], missingReason? }> }.
// variable = { id, value|null, unit, source, resolution_m, kind: 'obs'|'der'|'sim'|'int', note?, missingReason? }. value null ise missingReason zorunlu.
// queryAll: adapter'lar paralel çalışır; biri hata verirse diğerleri sürer (hata satır olarak döner). Değer üretilmez, yalnızca dosyadan okunur.
import { localScan } from "./localScan.js";

export const ADAPTERS = [localScan];
// Faz 0 kararı: küresel yükseklik adapter'ı ertelendi (CORS'lu NASA nokta sorgu servisi doğrulanmadı; docs/PLAN-GEZEGEN.md §3).
export const DEFERRED = [{ id: "globalElevation", reason: "CORS'lu NASA yükseklik nokta servisi doğrulanmadı (MOLA/LOLA/NASADEM)" }];

export async function queryAll(body, lat, lon, data, adapters = ADAPTERS) {
  const run = adapters.filter((a) => a.bodies.includes(body)).map(async (a) => {
    try { return { adapter: a.id, ...(await a.query(body, lat, lon, data)) }; }
    catch (e) { return { adapter: a.id, found: false, variables: [], error: String(e?.message || e) }; }
  });
  return { body, lat, lon, results: await Promise.all(run) };
}
