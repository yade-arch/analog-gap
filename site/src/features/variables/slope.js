import { topoCompute } from "./topo.js";
import { fmt } from "../../common.jsx";

const pct = (f) => (f == null ? "Data missing" : fmt(f * 100, 1) + " %");
// Limit aşan hücre oranı: limit NASA kaynaklı simülasyon varsayımıdır; oran görüntülenen 90 m ızgaradan hesaplanır.
const extra = ({ lim, stats }) => (lim
  ? [{ label: `Share of cells with slope > ${lim.value}° (limit ${lim.id}, 90 m grid)`, ref: pct(stats?.ref), cand: pct(stats?.cand), tag: "sim" }]
  : [{ label: "Vehicle slope limit", ref: "Data missing", cand: "Data missing (source pending)", tag: "sim" }]);

export default {
  id: "slope", titleKey: "station.slope", unit: "°",
  requires: ["NASADEM_HGT v001", "LOLA LDEM_80S_20M", "Mars 2020 TRN CTX DTM"],
  availability: () => ({ status: "ok", note: "Horn 3×3, 30 m" }),
  compute: topoCompute("slope", 1, "°", extra), card: null, report: null,
};