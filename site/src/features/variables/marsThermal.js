// Mars termal (THEMIS): işlenmedi; "veri eksik" olarak gösterilir, değer üretilmez (kural 2).
export default {
  id: "mars_thermal", titleKey: "station.mars_thermal", unit: "K",
  requires: ["THEMIS (not verified)"],
  availability: () => ({ status: "missing", note: "THEMIS product not verified / not processed" }),
  compute: null, card: null, report: null,
};
