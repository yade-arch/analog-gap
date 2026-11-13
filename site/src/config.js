// Rota ve ayarlar tek yerde. Yeni sayfa = ROUTES'a satır + App.jsx'te eşleme.
export const ROUTES = [
  { id: "compare", key: "nav.compare" },
  { id: "map", key: "nav.map" },
  { id: "list", key: "nav.list" },
  { id: "method", key: "nav.method" },
];
export const DEFAULT_ROUTE = "compare";

export const SETTINGS = {
  lang: "tr",
  windowKm: 10,                         // 3D pencere kenarı (km); sol ve sağ aynı ölçekte
  exaggerations: [1, 3, 5],
  defaultExag: 1,
  cameraModes: ["follow", "free", "top"],
  // Eğim sınıfı sınırları (derece), tek yönlü sıralı palet (iyi/kötü anlamı yok)
  slopeEdges: [5, 10, 15, 25],
  slopeColors: ["#2f4b8f", "#2a8a9c", "#6fb98f", "#d9d36a", "#f2a65a"],
  noDataColor: "#27303d",
  limitLineColor: "#f4f1e6",            // limiti aşan bölge konturu
  // F2b: birim hareketi (görsel; gerçek performans değildir)
  stationRing: 0.3,                     // istasyon halkası yarıçapı (pencere kenarı oranı) — gösterim düzeni
  routeSamples: 80,                     // rota başına DEM örnek sayısı
  routeColor: "#f0b445",
  moveSpeedKmPerS: 1.6,                 // gösterim hızı (ekran); gerçek hız değil
  followZoom: 0.6,                      // Takip modunda uzaklık (tüm pencereyi sığdıran mesafenin oranı)
  // Profil -> varsayılan Dünya karşılaştırma referansı
  references: { moon: ["Site04", "Site01", "Site07"], mars: ["R2"] },
  // D gösterge ölçeği (sim.py: düşük = daha yakın)
  dScaleMax: 1.2,
  // Sınırlama kaydı (limitations.json) için profil -> uygulanan referans anahtarı (EK DÜZELTME, F2'de kullanılır)
  profileBody: { moon: "Ay", mars: "Mars" },
};
