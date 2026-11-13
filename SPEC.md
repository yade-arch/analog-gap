# ANALOG GAP: Teknik Şartname (SPEC)

Sürüm 0.1, 2026-11-13. Veri ürünleri `data_inventory.csv` dosyasında ayrıntılı olarak yer alır. Yalnızca `DOĞRULANDI` veya `KISMİ` durumundaki ürünler kullanılır. `DOĞRULANMADI` durumundaki ürünler kullanılmaz.

---

## 0. Kısa karar özeti

| Konu | Karar |
|---|---|
| Ortak ızgara | Tüm DEM'ler **30 m** eşit alanlı yerel projeksiyona alan ortalamasıyla yeniden örneklenir |
| Eğim tabanı | 30 m ızgarada Horn 3×3 (etkin taban yaklaşık 60 m) |
| Pencere | **10 km × 10 km** (333 × 333 piksel), adım 5 km (%50 örtüşme) |
| Değişkenler (puanlanan) | Eğim, yerel röleyf, pürüzlülük (yalnızca topografya) |
| Termal | Puana ve filtreye **girmez**. Yalnızca Characterize ve Gap panelinde gösterilir |
| Aday filtresi | Her topografik değişkende aday [P10, P90] ile referans [P10, P90] örtüşmesi en az referans aralığının **%50**'si |
| Benzerlik | `d_k = W1(aday_k, ref_k) / IQR(ref_k)`; `D = ortalama_k d_k` (eşit ağırlık). Düşük D daha yakın demektir |
| Ay referansı | LOLA LDEM_80S_20M; PGDA Site04, Site01, Site07 ve LM1 ROI'leri (Shackleton çevresi) |
| Mars referansı | USGS Mars 2020 TRN CTX DTM 20 m (Jezero iniş bölgesi) |
| Dünya bölgeleri | ABD Güneybatı, Atacama, Hawaii Büyük Ada, Batı/Orta Anadolu (hepsi NASADEM kapsamında, 60°K–56°G) |

---

## 1. Ortak mekansal ölçek (CLAUDE.md kural 9)

### 1.1 Neden 30 m
| Ürün | Doğal çözünürlük | 30 m'ye işlem |
|---|---|---|
| NASADEM_HGT (Dünya) | 1″ (enleme göre yaklaşık 24–31 m) | Yerel eşit alanlı projeksiyona (pencere merkezli Lambert Azimutal Eşit Alan) **ortalama** ile |
| LOLA LDEM_80S_20M (Ay) | 20 m, kutup stereografik | 20 m'den 30 m'ye **ortalama** (ölçek 1.5). Shackleton 89.7°G'de olduğundan kutup stereografik ölçek bozulması ihmal edilebilir; yine de hesaplanır ve raporlanır |
| CTX DTM (Mars) | 20 m, eşkenar dikdörtgen (latTs0) | Jezero 18°K'de boylam ölçek bozulması var. Yerel LAEA projeksiyonuna 30 m ortalama ile alınır |
| MOLA MEGDR (Mars) | 463 m | 30 m'de **kullanılmaz**. Yalnızca §7.3 ölçek duyarlılığında kullanılır |

En kaba birincil ürün NASADEM'dir (yaklaşık 30 m). Daha ince ürünler bu ölçeğe kabalaştırılır. Hiçbir ürün inceltilmez (yukarı örneklenmez). Ay ve Mars'ın ince verisi bu ölçekte kaybedilir; bu kayıp yöntem sayfasında açıkça belirtilir.

### 1.2 Eğim tabanı
- Eğim, 30 m ızgarada **Horn (1981) 3×3** yöntemiyle hesaplanır. Etkin yatay taban yaklaşık 60 m'dir. Üç cisim için aynı kod ve aynı taban kullanılır.
- Yerçekimi farkı eğim geometrisini değiştirmez. Ancak gezgin ve astronot sınırları cisme özeldir; bunlar §8 kapsamında ele alınır.
- PGDA'nın hazır 5 m eğim ürünleri (ldsm, slp) puanlamada **kullanılmaz**. Bu ürünlerin tabanı farklıdır. Yalnızca §7.4'teki tutarlılık kontrolünde kullanılır.

### 1.3 Pencere boyu
- **10 km × 10 km** (333 × 333 piksel, 30 m). Gerekçeleri:
  1. Shackleton krateri yaklaşık 21 km çapındadır (Gazetteer). Kenar ve sırt bölgeleri 10 km pencerelerle kraterin içine taşmadan örneklenebilir.
  2. Bir gezginin bir operasyon döneminde kat edebileceği alan ölçeğindedir. Bu bir değerlendirmedir, ölçüm değildir.
  3. Pencere başına yaklaşık 110 bin piksel düşer. Bu, P10/P90 ve Wasserstein tahminleri için yeterlidir.
- Adım 5 km'dir. Duyarlılık testinde 5 ve 20 km pencereler denenir (§7.3).
- Mars referansının (R2) kapsamı GeoTIFF başlığından okunacak. Kapsam 10 km pencereye yetmezse R3 doğrulanır. R3 de doğrulanamazsa Mars için 5 km pencere kullanılır ve bu, arayüzde belirtilir.

### 1.4 Pencere başına türetilen değişkenler (Derived Parameter)
| Değişken | Tanım | Birim |
|---|---|---|
| `slope` | Horn eğimi, piksel dağılımı. Kartta P50 ve P90 gösterilir | derece |
| `relief` | 11×11 piksel (330 m) hareketli pencerede `max(z) − min(z)` değerinin piksel dağılımı | m |
| `rough` | `z − ortalama_5x5(z)` (150 m yüksek geçiren) artığının 11×11 hareketli RMS değeri, piksel dağılımı | m |

Benzerlik hesabında özet istatistikler değil, dağılımların tamamı kullanılır (§4).

### 1.5 Geçerli piksel ve dolgu kuralları
- NASADEM: `NUM` katmanından SRTM kökenli ve dolgu (GDEM, interpolasyon 250, quad kenarı 251) pikselleri sayılır. Dolgu oranı Evidence Reliability bölümünde gösterilir.
- LOLA: 20 m GDR interpolasyon içerir. M2 `ldec` (LOLA dönüş sayısı) 30 m'ye toplanır ve "en az 1 gözlem" oranı Evidence Coverage olarak raporlanır.
- Penceredeki geçerli piksel oranı %90'ın altındaysa pencere elenir. Bu durumda "Veri eksik" yazılır ve sıfır kullanılmaz (kural 3).
- **Bilinen sınırlama (Gap paneline yazılır):** LOLA kutup DEM'lerinde iz aralığı nedeniyle piksellerin büyük kısmı interpolasyondur. Ay'ın 30 m pürüzlülüğü bu nedenle olduğundan düşük hesaplanabilir.

---

## 2. Termal karşılaştırılabilirlik

### 2.1 Sorun
| Cisim | Ürün | Ölçülen veya türetilen nicelik | Zaman örneklemesi |
|---|---|---|---|
| Dünya | MYD11A2 (Aqua) | Emisivite düzeltmeli yüzey LST (K) | 8 günlük kompozit; günde iki örnek (Day/Night_view_time piksel başına) |
| Ay | Diviner PRP | `temp_avg`: **2 cm derinlikte**, modelden yıllık ortalama; `temp_max`: yüzey yıllık maksimum (K) | Model uydurması |
| Ay | Diviner PCP ltim | Bolometrik parlaklık sıcaklığı, yerel saat kutusu ortalaması (240 m) | 96 yerel saat kutusu × yaz/kış |
| Mars | THEMIS Day IR mozaik | Birim ve kalibrasyon belirtilmemiş göreli mozaik | Kullanılamaz |

Nicelikler fiziksel olarak aynı değildir: yüzey ile 2 cm derinlik, LST ile bolometrik sıcaklık, 2 örnek ile tam gün. Atmosfer ve gün uzunluğu da farklıdır (Ay günü yaklaşık 29.5 Dünya günüdür). Dağılımlar çoğunlukla hiç örtüşmez.

### 2.2 Karar
1. Termal değişkenler **aday filtresine ve D puanına girmez.** Girerse bütün adaylar elenir veya mesafe termal fark tarafından domine edilir.
2. Termal veriler yalnızca iki yerde gösterilir:
   - **Characterize:** her cisim kendi ürünüyle, ürün adı ve niceliğin tanımıyla birlikte.
   - **Expose the Gap:** mutlak farklar (K) gösterilir ve "nicelikler eşdeğer değil" uyarısı eklenir.
3. Dünya için türetilen değerler (MYD11A2, 2023 takvim yılı, 46 kompozit):
   - `dT_dn = LST_Day − LST_Night`: yıllık medyan. Etiketi "günlük aralık vekili (iki örnek)" olur.
   - `T_mean2 = (LST_Day + LST_Night)/2`: yıllık ortalama. Etiketi "iki örnek ortalaması, gerçek günlük ortalama değil" olur.
   - QC filtresi: QC_Day/QC_Night bit 0–1 = 00 (iyi kalite). Bit tanımı MOD11 kullanıcı kılavuzundan doğrulanacak.
   - Piksel başına view_time medyanı arayüzde gösterilir.
4. Ay için:
   - **P1:** PRP `temp_max` ve `temp_avg (2 cm)`, referans ROI üçgenlerinin medyanı. Ürün 605 MB, tek dosyadır.
   - **P2 (opsiyonel):** PCP yaz ltim kutularından `max_t − min_t`. Dosyalar akış halinde okunur ve yalnızca Shackleton kutusu tutulur. Kutu genişliği ve sütunlar LBL'den doğrulanmadan kullanılmaz. Yapılmazsa "Veri eksik" yazılır.
5. Mars termal: **"Veri eksik"** (MVP). THEMIS mozaiği kalibre değildir; nicel TI ürünü (R5) doğrulanamadı. Kesme listesinde ilk sıradadır.
6. MODIS (1 km) ve Diviner (240 m) kendi çözünürlüklerinde kalır. 30 m ızgaraya **zorlanmaz.** Pencere içi medyan ve geçerli hücre sayısı gösterilir.

---

## 3. Aday üretimi ve filtre eşiği

### 3.1 Dünya arama bölgeleri (bilinen analoglar seçimde kullanılmaz, kural 7)
Bölgeler jeomorfolojik çeşitlilik (volkanik, kurak, çarpma veya göl tabanı) ve NASADEM kapsamı göz önüne alınarak seçildi. Kesin sınırlar `regions.geojson` dosyasında tutulacak. Hedef büyüklük bölge başına 20–35 NASADEM karosudur.

| Kod | Bölge | Yaklaşık kutu |
|---|---|---|
| US-SW | ABD Güneybatı (Colorado Platosu, Mojave) | 34–39°K, 109–118°B |
| ATA | Atacama ve Orta And Dağları | 20–26°G, 67–71°B |
| HAW | Hawaii Büyük Ada | 18.9–20.3°K, 154.8–156.1°B |
| ANA | Batı ve Orta Anadolu | 37–40°K, 29–35°D |

Su yüzeyleri ve antropojenik alanlar maskelenir (kapsam dışı). Maske ürünü henüz envanterde yok ve eklenmeden önce doğrulanmalı. Doğrulanana kadar yalnızca NASADEM'in su/boşluk kodları kullanılır.

### 3.2 Referans dağılımı
Her profil için referans pencerelerindeki tüm geçerli pikseller tek bir dağılımda birleştirilir. Örneğin `ref_slope` Shackleton ROI pencerelerinin tüm eğim pikselleridir. Ayrıca referans pencereleri arasındaki yayılım da saklanır (§7.5).

### 3.3 Örtüşme filtresi
Her topografik değişken k için:

```
O_k = |[c10, c90] ∩ [r10, r90]| / (r90 − r10)
```

Burada c aday penceresinin, r ise referansın yüzdelikleridir.

**Aday koşulu:** her k için `O_k ≥ 0.5` ve geçerli piksel oranı ≥ %90. Eşik 0.5, duyarlılık testinde 0.25 ve 0.75 ile denenir. Eşiği geçemeyen pencereler sıralanmaz, ancak haritada "filtre dışı" katmanında görünür.

---

## 4. Benzerlik formülü

```
d_k = W1(F_aday,k , F_ref,k) / IQR(F_ref,k)         k ∈ {slope, relief, rough}
D   = (1/K) · Σ_k d_k                                  eşit ağırlık, K = 3
```

- **W1:** birinci dereceden Wasserstein mesafesi (`scipy.stats.wasserstein_distance`), piksel dağılımları üzerinde. Hesap hızı için 20 bin piksellik sabit tohumlu (seed = 42) alt örnek kullanılır.
- **IQR normalizasyonu:** farklı birimleri (derece, metre) ortak ve boyutsuz bir ölçeğe getirir. Bunun anlamı şudur: d = 1, adayın dağılımının referansın çeyrekler arası genişliği kadar kaydığı anlamına gelir.
- **Sıralama:** D küçükten büyüğe. Arayüzde "Analog Mesafesi D (düşük = daha yakın)" ifadesi kullanılır. "Benzerlik %"si veya güven puanı **üretilmez** (kural 6).
- **Eksik veri:** herhangi bir d_k hesaplanamıyorsa D üretilmez. Yalnızca mevcut d_k değerleri "kısmi" etiketiyle gösterilir (kural 3).
- Formül ve ağırlıklar yöntem sayfasında ve her Analog Card'da sabit olarak görünür. Kullanıcı bunları değiştiremez (kural 10).
- **Gap paneli** her zaman D ile yan yana gösterilir. İçeriği: her d_k, termal farklar, kapsam dışı değişkenler (spektral, atmosfer, yerçekimi, radyasyon) ve veri sınırlamaları (§1.5).

**Etiketleme (kural 4):**

| Etiket | Örnek |
|---|---|
| Observed Data | NASADEM yüksekliği, MODIS LST, LOLA yüksekliği |
| Derived Parameter | Eğim, röleyf, pürüzlülük, d_k, D, PRP sıcaklıkları (modelden türetilmiş) |
| Scientific Interpretation | "Eğim dağılımı Shackleton kenarına yakın, ancak termal rejim ve regolit özellikleri karşılaştırılamaz" |

---

## 5. Referans bölge seçimi

### 5.1 Lunar Base Analogs (Shackleton çevresi)
- **DEM:** M1 LDEM_80S_20M. 3.7 GB'lık dosyanın tamamı indirilmez. LBL'deki ofsetlerle (30400 × 30400, float32, satır başına 121,600 bayt) HTTP Range üzerinden yalnızca kutup merkezli yaklaşık 60 × 60 km'lik bölge okunur.
- **Referans pencereleri:** PGDA ürün 78 ROI shapefile'larının merkezlerine yerleştirilmiş 10 km pencereler. Kullanılan sahalar: **Site04 (Shackleton rim), Site01 (Connecting ridge), Site07 (Peak near Shackleton), LM1 (Shackleton Rim B).** Saha seçimi PGDA/Mazarico et al. 2011 numaralandırmasına dayanır; koordinatlar elle yazılmaz, shapefile'dan okunur.
- Krater içindeki kalıcı gölge bölgeleri (PSR) referansa dahil edilmez. Gerekçe: yüzey operasyonu değil, kaynak hedefi olmaları. Bu bir tasarım tercihidir ve yöntem sayfasında belirtilir.
- **Gazetteer bağlamı:** Shackleton merkezi yaklaşık 89.67°G, 129.78°D, çap yaklaşık 20.9 km (Gazetteer feature 5450). Yalnızca harita etiketi için kullanılır.

### 5.2 Martian Landing & Exploration (Jezero çevresi)
- **DEM:** R2 Mars 2020 TRN CTX DTM, 20 m, CC0, 9.7 MB. Ürün, iniş sistemi için iniş elipsi çevresinde üretilmiştir.
- **Referans pencereleri:** R2 kapsamını tamamen dolduran ve geçerli piksel oranı ≥ %90 olan tüm 10 km pencereler (adım 5 km). Koordinat elle girilmez.
- Kapsam 10 km pencerelere yetmezse §1.3'teki yedek plan uygulanır.

---

## 6. Evidence Coverage ve Evidence Reliability (kural 6)

İkisi ayrı paneldir ve birleştirilmez.

| Coverage (ne kadar veri var) | Reliability (veri ne kadar sağlam) |
|---|---|
| Değişken başına geçerli piksel oranı | Ürünün belgelenmiş doğruluğu (ör. LOLA 87S: RMS Z 0.30–0.50 m, eğim 1.5–2.5°) |
| NASADEM: SRTM kökenli piksel oranı | NASADEM: dolgu ve interpolasyon oranı (NUM) |
| LOLA: ≥1 LOLA dönüşlü 30 m hücre oranı (ldec) | Yeniden örnekleme oranı (20 m→30 m: 1.5) |
| MODIS: QC'den geçen kompozit sayısı / 46 | §7.4 tutarlılık kontrolü sonucu (Ay eğimi, iki ürün arası fark) |
| Termal: veri var / yok / kapsam dışı | Ürün yaşı ve gözlem dönemi |

---

## 7. Doğrulama planı

### 7.1 Pozitif kontrol
- `known_analogs.csv` dosyasında 15–20 bilinen analog yer alır: ad, cisim profili, koordinat, **kaynak linki** (NASA analog programı veya hakemli yayın). Yalnızca 4 arama bölgesinin içindekiler test edilir.
- Aday listesi (koordinatları kaynaktan doğrulanacak, hafızadan yazılmayacak):
  - US-SW: SP Crater / Black Point Lava Flow (Desert RATS), Cinder Lake Crater Field, Meteor Crater, MDRS Hanksville, Amboy Crater, Death Valley / Mojave Mars analog alanları.
  - ATA: Yungay, Atacama rover saha testleri.
  - HAW: Mauna Kea (PISCES), HI-SEAS (Mauna Loa), Kaʻū Çölü / Kīlauea.
  - ANA: Salda Gölü (Jezero analoğu).
- **Metrik:** analog noktasını içeren pencerenin, kendi bölgesindeki tüm pencereler arasında D'ye göre yüzdelik sırası.
- **Başarı:** bilinen analogların medyan yüzdeliği ≤ %20. Ek olarak tek yönlü Mann–Whitney U testiyle analog pencereleri ile rastgele pencereler karşılaştırılır; p değeri raporlanır.
- **Dürüst sınırlama:** bilinen analogların bir kısmı topografya için değil, erişim, jeokimya veya lojistik nedeniyle seçilmiştir. Kaçırılan bir analog tek başına yöntem hatası sayılmaz. Bu durum raporda tablo halinde gösterilir.

### 7.2 Negatif kontrol
- Bölge başına sabit tohumlu (seed = 42) 200 rastgele pencere. D dağılımları raporlanır.
- Ek olarak düz pencereler (eğim P90 < 2°) eklenir. Bu pencerelerin Shackleton profilinde son çeyreğe düşmesi beklenir; düşmezse bu bir uyarı olarak raporlanır.

### 7.3 Duyarlılık
| Değiştirilen parametre | Değerler |
|---|---|
| Pencere | 5, **10**, 20 km |
| Izgara | **30 m**, 90 m (Mars için ek olarak 463 m MOLA ve CTX'in 463 m'ye kabalaştırılmış hali) |
| Filtre eşiği | 0.25, **0.5**, 0.75 |
| Değişken | Birini dışarıda bırakma (3 varyant) |

**Ölçütler:** ilk 50 adayda Kendall τ, ilk 20 adayda Jaccard benzerliği. Kesme listesinde üçüncü sıradadır.

### 7.4 Ürün tutarlılığı
- Ay: M2 5 m mozaiği 30 m'ye ortalanır ve eğim yeniden hesaplanır. Sonuç M1 ile aynı pencerelerde karşılaştırılır (P50/P90 farkı).
- Dünya: NASADEM ile SRTMGL1 arasında bir test karosunda eğim farkı hesaplanır.

### 7.5 Referans iç yayılımı
Referans pencereleri birbirine karşı D ile ölçülür (biri dışarıda, diğerleri referans). Bu değer "referansın kendi içindeki D'si" olarak her kartta gösterilir. Böylece adayın D değeri bir taban çizgisiyle okunabilir.

---

## 8. Görev simülasyonu (özet, ayrıntı sonraki aşamada)
- Parametreler yalnızca `parameters_sources.csv` dosyasından gelir: değer, birim, NASA kaynak linki. Kaynağı olmayan parametre arayüzde seçilemez.
- Rover rotası: 30 m eğim ızgarasında maliyetli en kısa yol (Dijkstra veya A*), eğim sınırı CSV'den alınır.
- Etiketler "Gerçek ölçüm (DEM)", "Hesaplanmış (eğim, rota)" ve "Simülasyon varsayımı (sınırlar)" şeklindedir. Gerçek performans tahmini iddia edilmez.

## 9. Çıktılar (site için)
- `data/regions.geojson`, `data/candidates_{profile}.geojson` (pencere poligonu, d_k, D, O_k, coverage, reliability)
- `data/reference_{profile}.json` (dağılım özetleri, histogram kutuları), `data/controls.json`, `data/sensitivity.json`
- `data_inventory.csv` yöntem sayfasında tablo olarak gösterilir.

## 10. Açık riskler
1. Bu makinede **Python kurulu değil.** Veri hattına başlamadan önce Python 3.11+ ve rasterio/numpy/scipy/geopandas/pyarrow kurulmalı.
2. NASADEM ve MODIS indirmesi için **Earthdata Login** hesabı ve token gerekli.
3. R2'nin kapsamı henüz bilinmiyor (§1.3 yedek planı var).
4. Diviner PCP ltim sütunları ve kutu genişliği LBL'den okunmadı (P2).
5. Maske ürünü (su, antropojenik alan) henüz envanterde yok.
