// Oyun kuralları ve simülasyon varsayımları tek yerde. Bunların hiçbiri NASA verisi değildir;
// arayüzde "Simülasyon varsayımı / oyun kuralı" etiketiyle gösterilir (RulesPanel).
export const GAME = {
  startMin: 300,        // başlangıç oksijen/süre bütçesi (oyun dakikası)
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
  suit1: { id: "suit1", returnMin: 60, tolerant: true, stats: { dur: 90, spd: 80, o2: 85, cargo: 70 } },   // yüksek dayanıklılık: yavaş, risk bayraklarına dayanır
  suit2: { id: "suit2", returnMin: 25, tolerant: false, stats: { dur: 70, spd: 95, o2: 90, cargo: 80 } },  // yüksek hareketlilik: hızlı, risk bayrağı varsa riskli dönüş
};

export const TESTS = ["thermal", "terrain", "surface"];

// Earth-to-Space Rescue (solo mode). Every number below is a GAME RULE (fictional gameplay parameter), not NASA data.
// Real values (slopes, roughness, temperatures, rover slope limit) come from the data files; these only set time costs and wear.
export const RESCUE = {
  cost: { survey: 8, inspectCand: 10, inspectPoint: 15, send: 10, askEarth: 15, waitAnalysis: 20, switchSuit: 10, toRover: 8, scan: 5 },   // game minutes
  collectMin: { suit1: 12, suit2: 6 },      // time to load one supply cache (sturdy suit moves slower)
  suitWear: 0.3,                            // suit durability lost per game minute on gentle ground (%)
  steepWear: 3,                             // multiplier while the rover is on ground steeper than the rover limit
  suitWearMul: { suit1: 0.5, suit2: 1 },    // sturdy suit wears slower
  waterPerMin: 0.25,                        // drinking water used per game minute (%)
  dryWear: 1.5,                             // wear multiplier once the water is gone
  eventAt: 25, eventLen: 20,                // unexpected event: minutes after the drive starts, and how long it lasts
  storm: { speed: 0.6, drain: 1.6 },        // Mars dust storm: slower rover, faster battery use
  cold: { suit1: 1.4, suit2: 2.5 },         // Moon shadow (sudden cold): extra suit wear
  equip: { wheels: { wear: 0.4 }, battery: { drain: 0.6 }, backup: {} },   // spare wheels: less rover damage; extra battery: slower drain
  safeSpeed: 0.85,                          // safe route: auto-avoid steep ground, a bit slower
  suitLow: 50, backupSuit: 80, roverRest: 15,
  betterD: 0.8,                             // decision 3 appears if the best catalog place has D below 80 % of the reported place's D
};
export const EQUIP = ["wheels", "battery", "backup"];
