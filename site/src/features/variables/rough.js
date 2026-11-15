import { topoCompute } from "./topo.js";

// Sınırlama notu hedefe göre (limitations.json L02 text_by_profile ile aynı içerik): Ay'a özgü LOLA notu Mars'ta gösterilmez.
const NOTE = {
  moon: "Low reliability (technical name: L02): the Earth data has radar-based vertical noise; the Moon reference (LOLA polar model) is largely interpolated.",
  mars: "Low reliability (technical name: L02): the Earth data has radar-based vertical noise; the Mars reference is a different elevation product (Mars 2020 TRN CTX DTM).",
};
export default {
  id: "rough", titleKey: "station.rough", unit: "m",
  requires: ["NASADEM_HGT v001", "LOLA LDEM_80S_20M (Moon only)", "Mars 2020 TRN CTX DTM (Mars only)"],
  availability: (profile) => ({ status: "limited", note: NOTE[profile] || NOTE.mars }),
  compute: topoCompute("rough", 2, "m"), card: null, report: null,
};
