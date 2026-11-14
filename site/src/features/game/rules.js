// Oyun kuralları ve simülasyon varsayımları tek yerde. Bunların hiçbiri NASA verisi değildir;
// arayüzde "Simülasyon varsayımı / oyun kuralı" etiketiyle gösterilir (RulesPanel).
export const GAME = {
  startMin: 300,          // başlangıç oksijen/süre bütçesi (oyun dakikası)
  tickMs: 1000,           // gerçek 1 sn = 1 oyun dakikası
  cost: { inspect: 5, test: 15, suit: 10 },     // eylem maliyetleri (oyun dakikası)
  warnFrac: 0.5,          // bu oranın altında sayaç "dikkat" ritmine geçer
  critFrac: 0.2,          // bu oranın altında "kritik" ritim
  similarD: 0.25,         // d_k ≤ bu değer: değişken "benzer" sayılır; üstü "farklı"
  novelKm: 50,            // en yakın bilinen analog bu mesafeden uzaksa "bu katalogda yok"
  coverageMin: 0.95,      // geçerli piksel oranı ≥ bu değer: veri kapsamı yeterli
  dQuantile: 0.25,        // D, profilin gösterilen adaylarının alt çeyreğindeyse "düşük D"
};

// Kıyafetler: dayanıklılık ve hız değerleri gerçek giysi performansı DEĞİLDİR (Simülasyon varsayımı).
// parameters_sources.csv P06 (giysi parametreleri) kaynak beklediği için seçilemez; burada yalnızca oyun mekaniği var.
export const SUITS = {
  suit1: { id: "suit1", returnMin: 60, tolerant: true },   // yüksek dayanıklılık: yavaş, risk bayraklarına dayanır
  suit2: { id: "suit2", returnMin: 25, tolerant: false },  // yüksek hareketlilik: hızlı, risk bayrağı varsa riskli dönüş
};

export const TESTS = ["thermal", "terrain", "surface"];
