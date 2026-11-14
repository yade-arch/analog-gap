// Rota ve ayarlar tek yerde. Yeni sayfa = ROUTES'a satır + App.jsx'te eşleme.
export const ROUTES = [
  { id: "compare", key: "nav.mission", primary: true },
  { id: "method", key: "nav.method", primary: true },
  { id: "map", key: "nav.map" },
  { id: "list", key: "nav.list" },
  { id: "game", key: "nav.game" },
];
export const DEFAULT_ROUTE = "home";

export const SETTINGS = {
  lang: "tr",
  windowKm: 10,                         // 3D pencere kenarı (km); sol ve sağ aynı ölçekte
  exaggerations: [1, 3, 5],
  defaultExag: 1,
  cameraModes: ["follow", "free", "top"],
  // Eğim sınıfı sınırları (derece), tek yönlü sıralı palet (iyi/kötü anlamı yok). Açık temada okunur (her renk beyaz zeminde ≥3:1).
  // Piksel tuvali #hex ister; veri yok / kontur / rota renkleri theme.css --nodata / --ink ile aynı tutulur.
  slopeEdges: [5, 10, 15, 25],
  slopeColors: ["#2b4a8c", "#24808f", "#4c9a6a", "#968614", "#cf6f26"],
  noDataColor: "#8a94a3",
  limitLineColor: "#14243a",            // limiti aşan bölge konturu
  // F2b: birim hareketi (görsel; gerçek performans değildir)
  stationRing: 0.3,                     // istasyon halkası yarıçapı (pencere kenarı oranı) — gösterim düzeni
  routeSamples: 80,                     // rota başına DEM örnek sayısı
  routeColor: "#f4f1e6",                 // rota ve bekleyen istasyon: tüm eğim renklerine karşı ≥3:1 açık krem (anlam taşımaz)
  moveSpeedKmPerS: 1.6,                 // gösterim hızı (ekran); gerçek hız değil
  autoMeasureMs: 1500,                  // otomatik görev: istasyonda "ölçüm" bekleme süresi (gösterim; Simülasyon varsayımı)
  autoCardMs: 4500,                     // otomatik görev: kart açık kalma süresi (gösterim; Simülasyon varsayımı)
  followZoom: 0.85,                      // Takip modunda uzaklık (tüm pencereyi sığdıran mesafenin oranı)
  // Profil -> varsayılan Dünya karşılaştırma referansı
  references: { moon: ["Site04", "Site01", "Site07"], mars: ["R2"] },
  // D gösterge ölçeği (sim.py: düşük = daha yakın)
  dScaleMax: 1.2,
  // Sınırlama kaydı (limitations.json) için profil -> uygulanan referans anahtarı (EK DÜZELTME, F2'de kullanılır)
  profileBody: { moon: "Ay", mars: "Mars" },
};
