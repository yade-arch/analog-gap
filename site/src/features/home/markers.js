// Ana ekran ve Harita küresi için işaretçiler. Yalnızca mevcut veri: aday pencere merkezleri (candidates_*.geojson) ve referans pencereleri.
import { dColor, fmt } from "../../common.jsx";
import { regionLabel } from "../../i18n/terms.js";
import { candMarkers, refMarkers } from "../game/data.js";

export { refMarkers };

/** Aday işaretçileri: renk = arazi uzaklığı D (tek yönlü palet; D yoksa gri), sıra numarasına göre dizili. */
export function dMarkers(cand) {
  const props = new Map((cand?.features || []).map((f) => [f.properties.id, f.properties]));
  return candMarkers(cand)
    .map((m) => { const p = props.get(m.id); return { ...m, rank: p.rank, color: dColor(p.D), label: `${p.rank}. ${m.id} · ${regionLabel(p.region)} · D ${fmt(p.D, 3)}` }; })
    .sort((a, b) => a.rank - b.rank);
}
