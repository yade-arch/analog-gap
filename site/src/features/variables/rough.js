import { topoCompute } from "./topo.js";

// Sınırlama notu hedefe göre (limitations.json L02 text_by_profile ile aynı içerik): Ay'a özgü LOLA notu Mars'ta gösterilmez.
const NOTE = {
  moon: "Düşük güvenilirlik (teknik ad: L02): Dünya verisi radar kökenli düşey gürültü içerir; Ay referansı LOLA kutup modeli büyük ölçüde ara değer (interpolasyon).",
  mars: "Düşük güvenilirlik (teknik ad: L02): Dünya verisi radar kökenli düşey gürültü içerir; Mars referansı farklı bir yükseklik ürünüdür (Mars 2020 TRN CTX DTM).",
};
export default {
  id: "rough", titleKey: "station.rough", unit: "m",
  requires: ["NASADEM_HGT v001", "LOLA LDEM_80S_20M (yalnız Ay)", "Mars 2020 TRN CTX DTM (yalnız Mars)"],
  availability: (profile) => ({ status: "limited", note: NOTE[profile] || NOTE.mars }),
  compute: topoCompute("rough", 2, "m"), card: null, report: null,
};
