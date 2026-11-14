// Yüzey MALZEMELERİ (yalnızca GÖSTERİM dokusu). Ölçüm değildir: projede arazi örtüsü verisi (ör. MODIS) yok; bölge türüne göre
// seçilmiş renk paleti + gerçek DEM'den gölge. Geometri (köşe yükseklikleri) değişmez; bkz. scripts/invariance.mjs.
// Renkler: düşük -> yüksek (pencere içi göreli yükseklik), grain = tane gürültüsü genliği, craters = görsel krater izi sayısı (0 = yok).
export const SURFACE = {
  // Referans cisimler
  moon: { colors: ["#3b3b3d", "#8b8b8e", "#c7c7c9"], grain: 0.10, craters: 46, why: "Ay regoliti: gri/kömür/gümüş tonlar; yeşil/kahverengi toprak yok." },
  mars: { colors: ["#5e2a19", "#9f4e2c", "#c97a4b"], grain: 0.10, craters: 30, why: "Mars regoliti: demir oksitli pas kırmızısı/turuncu-kahve; toz ve kaya." },
  // Dünya aday bölgeleri (kodlar: regions.geojson)
  "US-SW": { colors: ["#8f6a48", "#c2a57d", "#a39282"], grain: 0.08, craters: 0, why: "Colorado Platosu/Mojave: kurak; kum bej, kahverengi toprak, kaya; seyrek bitki (yeşil yok)." },
  ATA: { colors: ["#9a7756", "#d0b48d", "#b6a798"], grain: 0.07, craters: 0, why: "Atacama/Orta And: dünyanın en kurak bölgelerinden; kum, toprak, çıplak kaya." },
  HAW: { colors: ["#2f2b29", "#4f4843", "#6b625a"], grain: 0.09, craters: 0, green: "#56663f", why: "Hawaii Büyük Ada: genç bazalt lav alanları (koyu); alçak kesimlerde seyrek yeşil." },
  ANA: { colors: ["#857552", "#a99f6f", "#bdb08a"], grain: 0.08, craters: 0, why: "Batı/Orta Anadolu: bozkır; zeytin-bej otlak ve kahverengi toprak." },
  ANT: { colors: ["#8c97a3", "#c8d5e1", "#eef3f7"], grain: 0.05, craters: 0, why: "Antarktika: buz/kar (beyaz-mavi-gri). Şu an aday bölgesi değil; seçimde kullanılırsa." },
  neutral: { colors: ["#7b6d5b", "#9a8a74", "#b3a48e"], grain: 0.08, craters: 0, why: "Bölge bilinmiyor: nötr toprak tonu (yeşil kullanılmaz)." },
};

/** Sol taraf: profil (moon|mars); sağ taraf: aday bölge kodu. Bilinmeyen -> neutral. */
export const surfaceKey = (k) => (SURFACE[k] ? k : "neutral");
