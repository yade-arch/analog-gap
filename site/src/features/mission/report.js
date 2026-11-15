// ANALOG GAP Report verisi: ekrandaki istasyon kartları ve Gap paneliyle aynı kaynak (stationResult). Yeni sayı üretmez.
import { VARIABLES, stationResult } from "../variables/index.js";
import { PROFILES, SOURCES } from "../../common.jsx";
import { t } from "../../i18n/index.js";

export const TAG_KEYS = { real: "tag.real", calc: "tag.calc", sim: "tag.sim" };

export function buildReport({ p, profile, ctx }) {
  const stations = VARIABLES.map((v) => { const s = stationResult(v, profile, ctx); return { id: v.id, status: s.status, note: s.note, rows: s.rows.map((r) => ({ ...r, tag_label: t(TAG_KEYS[r.tag]) })) }; });
  return {
    product: "ANALOG GAP Report", generated: new Date().toISOString(), generated_note: "browser clock (UTC); not a server timestamp",
    profile: PROFILES[profile].name, reference: ctx.reference?.label ?? null,
    candidate: { id: p.id, region: p.region, center_lat: p.center_lat, center_lon: p.center_lon, window_km: 10, rank: p.rank, passes_filter: p.passes_filter, D: p.D, d_k: p.d, O_k: p.O },
    formula: "d_k = W1(F_cand,k, F_ref,k) / IQR(F_ref,k); D = mean(d_slope, d_relief, d_roughness), equal weights (fixed); lower = closer",
    slope_limit: ctx.lim ? { id: ctx.lim.id, value: ctx.lim.value, unit: ctx.lim.unit, source: ctx.lim.source, url: ctx.lim.url, label: "Simulation assumption" } : null,
    stations,
    evidence: { coverage: p.evidence_coverage, reliability: p.evidence_reliability },
    labels: { observed: p.labels?.observed, derived: p.labels?.derived, interpretation: p.labels?.interpretation, mission: ["Real measurement", "Calculated", "Simulation assumption"] },
    gap: ["Spectral / minerals: out of scope", "Atmosphere: out of scope", "Gravity: out of scope", "Radiation: out of scope", "Soil (regolith) properties: no data", profile === "mars" ? "Temperature: data missing for Mars" : "Temperature: not in the distance; nicelikler eşdeğer değil"],
    data_products: SOURCES,
    disclaimer: "The window is not a copy of the Moon/Mars; it only shows how close the landform patterns are. Not a prediction of real performance.",
  };
}
