// Boş oyun/görev altyapısı (oyun yok). Kimlikler: bölge = regions.geojson "code" (ATA, HAW, ANA, US-SW); pencere = aday "id" (örn. ATA_r119_c61).
// Seçim olayları ve görev/olay günlüğü için sözleşme; ileride görev ekranları buna abone olur. Sayısal sonuç üretmez.
const subs = new Set();
const log = [];

/** Olay: { type: 'select-region'|'select-window'|'mission', target: 'moon'|'mars', id, t: ISO zaman, data? } */
export function emit(ev) {
  const e = { ...ev, t: new Date().toISOString() };
  log.push(e); if (log.length > 500) log.shift();
  subs.forEach((f) => { try { f(e); } catch { /* abone hatası diğerlerini durdurmaz */ } });
  return e;
}
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const eventLog = () => log.slice();
