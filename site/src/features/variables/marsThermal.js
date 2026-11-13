// Mars termal (THEMIS): işlenmedi; "veri eksik" olarak gösterilir, değer üretilmez (kural 2).
export default {
  id: "mars_thermal", titleKey: "station.mars_thermal", unit: "K",
  requires: ["THEMIS (doğrulanmadı)"],
  availability: () => ({ status: "missing", note: "THEMIS ürünü doğrulanmadı / işlenmedi" }),
  compute: null, card: null, report: null,
};
