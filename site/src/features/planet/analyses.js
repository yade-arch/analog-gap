// Analysis Registry. Mevcut analizler features/variables (istasyonlar) içinde çalışır; burada kayıt + durum tutulur.
// Yeni analiz: features/variables altına tek dosya + VARIABLES'a bir satır, burada bir kayıt. PLANNED: kaynak yok, değer üretilmez, arayüzde "planlanan" görünür.
import { VARIABLES } from "../variables/index.js";

export const ANALYSES = VARIABLES.map((v) => ({ id: v.id, titleKey: v.titleKey, unit: v.unit, requires: v.requires, status: "active" }));

export const PLANNED = ["Jeolojik yapı", "Kayaç türleri", "Regolit özellikleri", "Krater yoğunluğu", "Su buzu olasılığı", "Güneş ışınımı", "Radyasyon",
  "Toz özellikleri", "İniş alanı uygunluğu", "Rover hareket uygunluğu", "Astronot hareket uygunluğu", "Enerji üretim potansiyeli", "İletişim görüş hattı", "Kaynak erişilebilirliği"]
  .map((name) => ({ name, status: "planned", source: null, note: "Planlanan; doğrulanmış kaynak yok, değer üretilmez" }));
