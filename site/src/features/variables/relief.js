import { topoCompute } from "./topo.js";

export default {
  id: "relief", titleKey: "station.relief", unit: "m",
  requires: ["NASADEM_HGT v001", "LOLA LDEM_80S_20M", "Mars 2020 TRN CTX DTM"],
  availability: () => ({ status: "ok", note: "11×11 pencere (330 m)" }),
  compute: topoCompute("relief", 1, "m"), card: null, report: null,
};