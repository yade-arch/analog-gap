// Sözlüğün TEK kaynağı: ad, birim, tek cümlelik anlam, teknik ad (yalnızca ayrıntıda gösterilir).
export const TERMS = {
  slope: { name: "Eğim", unit: "°", meaning: "Yüzeyin ne kadar yamaç olduğu. 0° düz, 90° dik duvar.", tech: "slope (Horn 3×3, 30 m)" },
  relief: { name: "Yükseklik farkı", unit: "m", meaning: "Komşu çevrede en yüksek ve en alçak nokta arasındaki fark.", tech: "yerel röleyf (330 m)" },
  rough: { name: "Yüzey engebesi", unit: "m", meaning: "Yüzeyin küçük ölçekte ne kadar engebeli olduğu.", tech: "pürüzlülük (RMS)" },
  typical: { name: "Tipik değer ve aralık", unit: "", meaning: "Ortanca değer ve çoğu yerin içinde kaldığı aralık.", tech: "P50, P10–P90" },
  D: { name: "Arazi uzaklığı", unit: "birimsiz", meaning: "Dünya adayının arazi şeklinin referanstan ne kadar farklı olduğu: 0 = aynı, düşük = daha benzer. Yüzde veya benzerlik oranı değildir; fiziksel mesafe de değildir.", tech: "D" },
  d_slope: { name: "Eğim uzaklığı", unit: "birimsiz", meaning: "Yalnızca eğim bakımından arazi uzaklığı; düşük = daha benzer.", tech: "d_eğim (d_k)" },
  d_relief: { name: "Yükseklik farkı uzaklığı", unit: "birimsiz", meaning: "Yalnızca yükseklik farkı bakımından arazi uzaklığı; düşük = daha benzer.", tech: "d_röleyf (d_k)" },
  d_rough: { name: "Yüzey engebesi uzaklığı", unit: "birimsiz", meaning: "Yalnızca yüzey engebesi bakımından arazi uzaklığı; düşük = daha benzer.", tech: "d_pürüz. (d_k)" },
  overlap: { name: "Örtüşme", unit: "0–1", meaning: "Referansın tipik aralığının ne kadarının adayın aralığıyla örtüştüğü: 0 = hiç, 1 = tamamen.", tech: "O_k" },
  valid: { name: "Veri doluluğu", unit: "%", meaning: "Penceredeki ölçülü alanın oranı; boşluklar sıfır sayılmaz.", tech: "geçerli piksel oranı" },
  coverage: { name: "Kanıt kapsamı", unit: "", meaning: "Sonucun ne kadar alanda gerçek ölçüme dayandığı.", tech: "Evidence Coverage" },
  reliability: { name: "Güvenilirlik", unit: "", meaning: "Ölçümün kendi hata ve gürültü durumu; kapsamdan ayrı değerlendirilir.", tech: "Evidence Reliability" },
  gap: { name: "Gap", unit: "", meaning: "Eksik ve karşılaştırılamayan konular.", tech: "Gap" },
  temp: { name: "Sıcaklık", unit: "K", meaning: "Yüzey sıcaklığı (Dünya: uydu ölçümü; Ay: model). Doğrudan eşdeğer değildir.", tech: "LST / Diviner" },
};
// Etiketler (İngilizce teknik adı ayrıntıda).
export const TAGS = {
  obs: { name: "Gerçek ölçüm", tech: "Observed Data" },
  der: { name: "Hesaplanmış", tech: "Derived Parameter" },
  int: { name: "Yorum", tech: "Scientific Interpretation" },
  sim: { name: "Simülasyon varsayımı", tech: "Simulation assumption" },
};
// Arama bölgeleri: kod veri anahtarı olarak kalır, ekranda sade ad gösterilir. Kaynak: public/data/regions.geojson
// (name, n_tiles) ve STATUS.md karo sayıları (US-SW 45, ATA 24, ANA 18, HAW 6). Tam ad + kapsam: regions.geojson "name".
export const REGIONS = { "US-SW": "ABD Güneybatı", ATA: "Atacama", ANA: "Anadolu", HAW: "Hawaii" };
/** Bölge kodu -> sade ad (bilinmeyen kod olduğu gibi döner). Veri karşılaştırmalarında kodu kullan, yalnızca gösterimde bunu. */
export const regionLabel = (code) => REGIONS[code] || code || "";
export const tipOf = (k) => { const x = TERMS[k]; return x ? `${x.name}${x.unit ? " (" + x.unit + ")" : ""}: ${x.meaning}${x.tech ? " Teknik ad: " + x.tech + "." : ""}` : ""; };
