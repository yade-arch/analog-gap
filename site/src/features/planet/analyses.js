// Analysis Registry. Mevcut analizler features/variables (istasyonlar) içinde çalışır; burada kayıt + durum tutulur.
// Yeni analiz: features/variables altına tek dosya + VARIABLES'a bir satır, burada bir kayıt. PLANNED: kaynak yok, değer üretilmez, arayüzde "planlanan" görünür.
import { VARIABLES } from "../variables/index.js";

export const ANALYSES = VARIABLES.map((v) => ({ id: v.id, titleKey: v.titleKey, unit: v.unit, requires: v.requires, status: "active" }));

export const PLANNED = ["Jeolojik yapı", "Kayaç türleri", "Regolit özellikleri", "Krater yoğunluğu", "Su buzu olasılığı", "Güneş ışınımı", "Radyasyon",
  "Dust properties", "Landing site suitability", "Rover mobility", "Astronaut mobility", "Energy potential", "Communication line of sight", "Resource access"]
  .map((name) => ({ name, status: "planned", source: null, note: "Planned; no verified source, no value is produced" }));
