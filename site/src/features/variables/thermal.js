// Termal: Dünya MODIS LST (MYD11A2 v061) ve Ay Diviner PRP. Mars için ayrı kayıt (marsThermal.js). Benzerlik puanına girmez.
import { fmt } from "../../common.jsx";

const medP50 = (tM) => {
  const v = Object.values(tM?.windows || {}).map((s) => s.temp_avg_K_p10_p50_p90?.[1]).filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[v.length >> 1] : null;
};

function compute({ p, tE, tM }) {
  const e = tE?.windows?.[p.id], ok = e && e.dT_dn_K_median != null;
  const m = medP50(tM);
  return {
    status: "limited",
    rows: [
      { label: "Day–night surface temperature difference, yearly median (technical name: dT_dn = LST_Day − LST_Night; two measurement times)", ref: "Data missing (Moon daily range not processed)", cand: ok ? `${fmt(e.dT_dn_K_median, 1)} K (P10–P90: ${e.dT_dn_K_p10_p90.join(" – ")})` : "Data missing", tag: "calc" },
      { label: "Yearly mean temperature: Earth surface (technical name: T_mean2, two measurement times) / Moon 2 cm below the surface (model, technical name: temp_avg; not the same quantity)", ref: m == null ? "Data missing" : fmt(m, 1) + " K", cand: ok && e.T_mean2_K_median != null ? fmt(e.T_mean2_K_median, 1) + " K" : "Data missing", tag: "calc" },
    ],
    note: "Not the same quantity (surface LST vs modelled mean 2 cm below the surface). The difference is not part of the terrain distance.",
  };
}

export default {
  id: "thermal", titleKey: "station.thermal", unit: "K",
  requires: ["MYD11A2 v061", "Diviner PRP"],
  availability: (profile) => (profile === "moon"
    ? { status: "limited", note: "Earth LST (surface) and Moon PRP (2 cm below the surface, model) are not the same quantity; no Moon dT_dn" }
    : { status: "missing", note: "Mars temperature data not processed (cut list)" }),
  compute, card: null, report: null,
};