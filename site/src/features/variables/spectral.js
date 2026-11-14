// Spektral: kapsam dışı (CLAUDE.md). Değer üretilmez.
export default {
  id: "spectral", titleKey: "station.spectral", unit: "",
  requires: [],
  availability: () => ({ status: "missing", note: "Out of scope / no data" }),
  compute: null, card: null, report: null,
};
