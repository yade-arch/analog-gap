import { topoCompute } from "./topo.js";

export default {
  id: "rough", titleKey: "station.rough", unit: "m",
  requires: ["NASADEM_HGT v001", "LOLA LDEM_80S_20M", "Mars 2020 TRN CTX DTM"],
  availability: () => ({ status: "limited", note: "Düşük güvenilirlik (L02): SRTM düşey gürültüsü / LOLA interpolasyonu" }),
  compute: topoCompute("rough", 2, "m"), card: null, report: null,
};