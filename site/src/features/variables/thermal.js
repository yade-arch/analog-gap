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
      { label: "Gündüz–gece yüzey sıcaklığı farkı, yıllık ortanca (teknik ad: dT_dn = LST_Day − LST_Night; iki ölçüm anı)", ref: "Veri eksik (Ay günlük aralığı işlenmedi)", cand: ok ? `${fmt(e.dT_dn_K_median, 1)} K (P10–P90: ${e.dT_dn_K_p10_p90.join(" – ")})` : "Veri eksik", tag: "calc" },
      { label: "Yıllık ortalama sıcaklık: Dünya yüzeyi (teknik ad: T_mean2, iki ölçüm anı) / Ay 2 cm derinlik (model, teknik ad: temp_avg; eşdeğer değil)", ref: m == null ? "Veri eksik" : fmt(m, 1) + " K", cand: ok && e.T_mean2_K_median != null ? fmt(e.T_mean2_K_median, 1) + " K" : "Veri eksik", tag: "calc" },
    ],
    note: "Nicelikler eşdeğer değil (yüzey LST ile 2 cm derinlikte model ortalama). Fark benzerlik puanına girmez.",
  };
}

export default {
  id: "thermal", titleKey: "station.thermal", unit: "K",
  requires: ["MYD11A2 v061", "Diviner PRP"],
  availability: (profile) => (profile === "moon"
    ? { status: "limited", note: "Dünya LST (yüzey) ile Ay PRP (2 cm derinlik, model) eşdeğer nicelik değil; Ay dT_dn yok" }
    : { status: "missing", note: "Mars termal verisi işlenmedi (kesme listesi)" }),
  compute, card: null, report: null,
};