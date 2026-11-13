// Birim kaydı. Yeni birim = bu klasöre tek dosya + aşağıya import ve satır.
// Birim: { id, labelKey, limits: {profil: parametre kimliği (parameters_sources.json)}, model: 'rover'|'astronaut' }
import rover from "./rover.js";
import astronaut from "./astronaut.js";

export const UNITS = [rover, astronaut];

/** Birimin profildeki eğim limiti; yalnızca kaynaklı ve arayüzde seçilebilir satırlar (kural 8). */
export function slopeLimit(unit, profile, params) {
  const id = unit.limits[profile];
  const p = (params || []).find((r) => r.id === id);
  const v = p && p.value !== "" ? Number(p.value) : NaN;
  if (!p || !String(p.selectable_in_ui).startsWith("yes") || !Number.isFinite(v)) return null;
  return { value: v, unit: p.unit, id: p.id, source: p.source_title, url: p.source_url, note: p.notes, kind: p.kind };
}
