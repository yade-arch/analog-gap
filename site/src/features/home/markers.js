// Ana ekran ve Harita küresi için işaretçiler. Yalnızca mevcut veri: aday pencere merkezleri (candidates_*.geojson) ve referans pencereleri.
import { D_STOPS, dColor, fmt } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { candMarkers, refMarkers } from "../game/data.js";

export { refMarkers };

/** Küre renk ölçeği: D, tek yönlü sıralı palet (common.jsx D_STOPS = theme --seq1..4); D yoksa "Veri eksik" rengi (dColor(null)). Sabit nesne: küre kamerası sıfırlanmasın. */
export const D_SCALE = { stops: D_STOPS, missing: dColor(null), label: t("globe.legend.D"), loLabel: t("globe.legend.near"), hiLabel: t("globe.legend.far") };

/** Aday işaretçileri: value = arazi uzaklığı D (null -> Veri eksik), sıra numarasına göre dizili. Renk GlobeView'da D_SCALE ile. */
export function dMarkers(cand) {
  const props = new Map((cand?.features || []).map((f) => [f.properties.id, f.properties]));
  return candMarkers(cand)
    .map((m) => { const p = props.get(m.id); return { ...m, rank: p.rank, value: p.D ?? null, label: `${p.rank}. ${m.id} · ${regionLabel(p.region)} · D ${fmt(p.D, 3)}` }; })
    .sort((a, b) => a.rank - b.rank);
}
