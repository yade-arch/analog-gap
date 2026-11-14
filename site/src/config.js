import { cssVar } from "./cssVar.js";

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
  // Eğim sınıfı sınırları (derece), tek yönlü sıralı palet (iyi/kötü anlamı yok).
  // Renkler o anki temadan (theme.css --slope1..5, --slope-nodata, --slope-limit, --route); okunduğu anda geçerli tema. Yedekler açık tema.
  slopeEdges: [5, 10, 15, 25],
  get slopeColors() { return [["--slope1", "#2b4a8c"], ["--slope2", "#24808f"], ["--slope3", "#4c9a6a"], ["--slope4", "#968614"], ["--slope5", "#cf6f26"]].map(([v, d]) => cssVar(v, d)); },
  get noDataColor() { return cssVar("--slope-nodata", "#8a94a3"); },
  get limitLineColor() { return cssVar("--slope-limit", "#14243a"); },   // limiti aşan bölge konturu
  // F2b: birim hareketi (görsel; gerçek performans değildir)
  stationRing: 0.3,                     // istasyon halkası yarıçapı (pencere kenarı oranı) — gösterim düzeni
  routeSamples: 80,                     // rota başına DEM örnek sayısı
  get routeColor() { return cssVar("--route", "#f4f1e6"); },   // rota ve bekleyen istasyon: tüm eğim renklerine karşı ≥3:1 (anlam taşımaz)
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
