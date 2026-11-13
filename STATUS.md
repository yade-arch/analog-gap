# ANALOG GAP: Durum (2026-11-13)

Kurallar: `CLAUDE.md`. Teknik şartname: `SPEC.md`. Veri ürünleri: `data_inventory.csv`.

## 1. Tamamlananlar
- **Ortam:** Python 3.12.10 (kullanıcı kapsamı), `.venv` içinde rasterio, numpy, scipy, geopandas, pyarrow, requests, pypdf. `EARTHDATA_TOKEN` yalnızca ortam değişkeninden okunur; hiçbir dosyaya yazılmadı.
- **`parameters_sources.csv`:** 7 satır. 4'ü NASA/JPL sayfasından alıntıyla doğrulandı (VIPER 15° nominal, 25–30° riskli aralık; Perseverance 30° yatış planlama sınırı, 23° rota öngörüsü). Astronot yürüyüş sınırı, giysi ve genel Mars gezgin limiti "kaynak bekliyor" (arayüzde seçilemez).
- **`known_analogs.csv`:** 13 satır, 6'sında koordinat var. USGS GNIS kaynaklı: SP Crater, Meteor Crater, Amboy. Salda: NASA EO Explorer harita merkezi. HI-SEAS ve MDRS: Wikipedia kaynaklı / atıfsız ("kaynak zayıf"). Kalan 7 satır "kaynak bekliyor".
- **Testler (tek karo):** NASADEM N35W112 (indirme, NUM, SP Crater) geçti. LOLA Shackleton penceresi (HTTP Range) geçti; çöküntü beklenen yarıçapta ve azimutta bulundu.
- **Çekirdek:** `scripts/terrain.py` (Horn 3x3 eğim, 11x11 röleyf, 5x5 yüksek geçiren + 11x11 RMS pürüzlülük; NaN yayılır, sıfır kullanılmaz). `scripts/sim.py` (O_k, W1 / IQR, D = ortalama d_k, 20 bin piksel alt örnek, seed 42).
- **NASADEM:** 93 karo (US-SW 45, ATA 24, ANA 18, HAW 6), 1,0 GB, `data_raw/nasadem_zip/`. `NUM` kod tablosu kılavuzdan çıkarıldı: `data/nasadem_num_codes.json`.
- **Referanslar:** `data/reference_moon.json` (Site04, Site01, Site07; LOLA 20 m → 30 m) ve `data/reference_mars.json` (R2 CTX DTM; 25 pencere, pencere birleşimindeki tekil pikseller). R2 kapsamı 31,9 x 30,2 km, geçerli piksel %100, R3 yedeği gerekmedi.
- **Dünya taraması:** `scripts/earth_scan.py` bölge başına LAEA 30 m şerit şerit çalışır. Tek şerit testi geçti (158 pencere, 26 sn). Tam tarama bu dosya yazılırken arka planda sürüyordu; çıktı `data/windows_earth.parquet`. Dosya yoksa taramayı yeniden çalıştır.

- **Dünya taraması BİTTİ** (14:44): 32.652 pencere (US-SW 17.241, ATA 8.681, ANA 6.384, HAW 346) → `data/windows_earth.parquet`. Betik: `scripts/candidates_controls.py`.
- **Adaylar:** `data/candidates_moon.geojson` (filtreyi geçen 6.699 pencere; D'li 15.193) ve `candidates_mars.geojson` (geçen 17.892; D'li 25.514). Web boyutu için dosyada bölge başına en iyi 250 (≈1 MB/dosya); tam sıralama parquet'ten betikle yeniden üretilir. O_k < 0.25 pencereler D almaz (kural 3).
- **Kontroller:** `data/controls.json`.
  - Pozitif (n = 5 test edildi; 13 satırın 7'sinde koordinat yok, Salda geçerli pencere dışı: su maskesi): **medyan yüzdelik 74,5 → ölçüt (≤ %20) SAĞLANMADI**; Mann–Whitney tek yönlü p = 0,79. Neden: 3 Ay-profil analogu (SP Crater, Meteor Crater, Amboy) Shackleton referansıyla O_k < 0.25 olduğu için D alamadı (Ay referansı çok dik: eğim P50 12,6°) ve "sıralanmadı = en sonda" kuralıyla 74,5 aldı. Mars-profil: MDRS yüzdelik 27,1 (filtreyi geçti), HI-SEAS 23,1 (D var, filtreyi geçmedi). Parametre ayarlanarak düzeltilmedi. n çok küçük, MDRS/HI-SEAS koordinatı zayıf kaynaklı; sonuç "yöntem doğrulanmadı" yönünde okunur, ayrıntı Yöntem sayfasına.
  - Negatif: bölge başına 200 rastgele pencere (seed 42), D dağılımları `controls.json`. Düz pencereler (eğim P90 < 2°, n = 51): Ay profilinde hiçbiri D alamadı (hepsi sıralanmadı = en sonda), uyarı yok. Mars profilinde de D yok.
  - Pencereler %50 örtüşür; p değerleri iyimser olabilir.

- **Termal (Characterize + Gap paneli; puana/filtreye girmez) — kullanıcı izniyle onaysız yürütüldü:**
  - *Doğrulama:* MYD11A2 v061 ve Diviner PRP `data_inventory.csv`'de DOĞRULANDI. Ek doğrulanan: MOD11A2 V6.1 şartnamesinde (LAADS) QC bit 0–1: 00 = LST iyi kalitede üretildi; 8 günlük kompozitte QC günlük QC'lerin çoğunluğudur (ek filtre yok). PRP sütunları `label/dlre_prp.fmt`'den okundu (tri_clon/clat bayt 127/144, temp_avg 178, temp_max 188; 210 B kayıt, kayıt 1 başlık). Sinüzoidal karo sınırları HDF StructMetadata ile doğrulandı. `pyhdf` kuruldu (rasterio'da HDF4 sürücüsü yok).
  - *Dünya:* 322 granül (7 karo × 46, 1,6 GB; CMR sorgusu `scripts/modis_cmr.py`, indirme `download_modis.py` → `data_raw/modis/`). `scripts/thermal_earth.py` → `data/thermal_earth.json`: 1.587 aday pencerenin 1.269'unda dT_dn (yıllık medyan) ve T_mean2 (yıllık ortalama), geçerli hücre sayısı, view_time medyanı, geçerli kompozit sayısı; 318'i "Veri eksik" (<5 geçerli 1 km hücre; HAW 80, US-SW 196, ANA 29, ATA 13). Bölge medyanları: dT_dn ATA 37,8 K, HAW 36,4, ANA 23,8, US-SW 23,8; T_mean2 287–293 K (makul). Hücre başına ≥ 23/46 geçerli kompozit şartı bir *işlem seçimidir* (ürün özelliği değil); ANA/US-SW/HAW'da medyan geçerli kompozit ≈ 26–27/46 → mevsimsel yanlılık olabilir (Evidence Coverage'da gösterilecek).
  - *Ay:* PRP (605 MB) diske yazılmadan akıtıldı, enlem ≤ −87° olan 202.612 üçgen `data_raw/prp_polecap.parquet`. `scripts/thermal_moon.py` → `data/thermal_moon.json` (referans pencere başına temp_avg [2 cm derinlik] ve temp_max [yüzey] P10/P50/P90; Site04 temp_avg P50 112,4 K, temp_max 259,1 K; Site01 126,4 / 238,6; Site07 134,8 / 247,5). Pencere = 10×10 km'ye eşit alanlı daire (kare yönelimi kutup stereografik eksenine bağlı). Ay `dT_dn` (PCP, P2) **yapılmadı: "Veri eksik"**. Mars termal: **"Veri eksik"** (kesme listesi).
  - Termal kuralları: Dünya LST (yüzey, iki örnek) ile Ay PRP (2 cm derinlik, model) eşdeğer nicelik değil; UI'da yan yana mutlak fark gösterilirken bu uyarı zorunlu. Toplam indirme: MODIS 1,6 GB + PRP 0,6 GB akış; her indirme 2 GB altında, kümülatif ≈ 2,2 GB (yorum: sınır indirme başına).

- **Karar uygulandı (kullanıcı):** pozitif kontrol sonucu olduğu gibi raporlanır; parametre/eşik ayarlanmadı. (a) `controls.json` → `two_views`: A (eşleşmeyen = son grup, medyan 74,5) ve B ("eşleşme yok (O_k<0.25)" ayrı: 3 eşleşme yok, 2 eşleşen 27,1 / 23,1), Yöntem sayfasında yan yana. (b) Ay referansı Site04/01/07 ayrı ayrı: `scripts/explore_sites_build.py`, `earth_scan_sites.py` (→ `data/windows_earth_sites.parquet`), `explore_sites_report.py` (→ `data/exploratory_moon_sites.json`), Yöntem sayfasında "sonradan yapılan keşifsel analiz" etiketiyle; ana sıralama değişmedi. Duyarlılık analizi atlandı.
  - Keşifsel sonuç (3 Ay-profil analogu; n çok küçük): Site04 referansıyla üçü de eşleşmedi (O_k<0,25). Site01 ve Site07 ile SP Crater eşleşti (yüzdelik 2,8 / 4,5) ama O_k<0,5 olduğu için filtreyi geçmedi; Meteor Crater ve Amboy her üçünde eşleşmedi. Bu, ana sonucu değiştirmez; hipotez testi değildir.
- **Web sitesi (`site/`, Vite + React + MapLibre GL):** Harita (D renkli, düşük zoomda nokta), Aday listesi, Analog Card (Characterize / Compare / Evidence / Novelty; Expose the Gap paneli her sekmenin yanında sabit), Yöntem ve Doğrulama (formül, pozitif/negatif kontrol, limitations.json, validation.json, data_inventory). Veri: `scripts/build_site_data.py` → `site/public/data`. Çalıştırma: `cd site; npm install; npm run build; npm run preview -- --port 4173`. Ekran görüntüsüyle doğrulandı (puppeteer-core + Edge, scratchpad). Altlık harita yok (kasıtlı; çevrimdışı/lisanssız). Henüz yok: Görev ekranı, ANALOG GAP Report, README, Mars profilinde Analog Card ekran kontrolü.

## 2. Verilen kararlar
| Konu | Karar |
|---|---|
| Ortak ızgara / pencere | 30 m, 10 x 10 km (333 px), adım 5 km (167 px) |
| Termal | Puana ve filtreye girmez; yalnızca Characterize ve Gap panelinde |
| Aday filtresi | Her topografik değişkende O_k ≥ 0,5. d_k, tüm O_k ≥ 0,25 olan pencereler için hesaplanır (duyarlılık testi için) |
| Benzerlik | d_k = W1 / IQR(ref), D = eşit ağırlıklı ortalama (düşük = daha yakın). "Benzerlik %" veya güven puanı yok |
| Ay referansı | ROI merkezli 10 km pencereler (ROI çevresi mantığı). LM1 dışarıda: PGDA'da ROI shapefile yok |
| Mars referansı | R2'nin tamamı (25 pencere birleşimi) |
| Bölgesel LAEA | Pencere merkezli LAEA yerine bölge başına tek LAEA ızgarası (~500 km'de ölçek sapması %0,08). Yöntem sayfasına yazılacak |
| Pozitif kontrol | n = 6 koordinatlı satırla yapılır; küçük örnek ve dengesiz dağılım (US-SW 4, HAW 1, ANA 1, ATA 0) `data/validation.json` ve Yöntem sayfasında açıkça belirtilir. Geçse bile "yöntem doğrulandı" denmez |
| NASADEM indirme eşiği | 2 GB üstünde onay istenir. 959 MB olduğu için istenmedi |

## 3. Açık sınırlamalar (`data/limitations.json`; Gap paneli ve Yöntem sayfasında sabit görünür)
- **L01 PSR maskesi yok.** Site04 penceresi Shackleton'ın kalıcı gölgeli iç duvarını kapsar. Referans içi yayılımda Site04 aykırı (D = 1,22; Site01 0,34, Site07 0,44). Ay sıralaması bu yüzden zayıf yorumlanır.
- **L02 Pürüzlülük düşük güvenilirlik.** SRTM düşey gürültüsü ile LOLA interpolasyonu eşdeğer değil.
- **L03 LOLA piksellerinin büyük kısmı interpolasyon.** ldec (M2) ile Evidence Coverage henüz hesaplanmadı.
- **L04 Antropojenik alan maskesi yok;** yalnızca NASADEM su/boşluk (NUM = 0) maskelenir.
- Ay referansı yalnızca 3 pencere. Mars referansı küçük kapsamlı (%50 örtüşen pencereler, bağımsız bilgi ~9 pencere).
- Hawaii'de yalnızca 6 karo (çoğu okyanus); Anadolu 18 karo, SPEC hedefi olan 20–35'in altında.
- LOLA kutup pikseli ofseti ±yarım piksel belirsizliğe sahip (PDS 1-tabanlı → 0-tabanlı çeviri).
- Doğrulanmamış ürünler kullanılmaz: R3, R5 (THEMIS TI), maske ürünü, M5 (PCP) sütunları.

## 4. Dosya yapısı
```
analog-gap/
  CLAUDE.md  SPEC.md  STATUS.md  data_inventory.csv
  known_analogs.csv  parameters_sources.csv
  scripts/   terrain.py  sim.py  window_test.py  build_references.py  earth_scan.py
             candidates_controls.py  modis_cmr.py  download_modis.py  prp_stream.py  thermal_earth.py  thermal_moon.py
             (çıktılar: data/candidates_{moon,mars}.geojson, controls.json, thermal_earth.json, thermal_moon.json, modis_granules.csv; data_raw/modis/, prp_polecap.parquet)
             tile_list.py  download_nasadem.py  lola_test.py  lola_fetch.py  nasadem_test.py  cmr_nasadem.py  _pdf.py
  data/      regions.geojson  nasadem_tiles.csv  nasadem_num_codes.json  limitations.json  validation.json
             reference_windows_moon.json  reference_moon.json  reference_mars.json  windows_earth.parquet (tarama bitince)
  data_raw/  nasadem_zip/ (93 zip)  nasadem/ (test karosu)  roi/ (Site01/04/07)  mars/R2.tif
             lola_pole_40km.npy  lola_pole_90km.npy  ref_moon.npz  ref_mars.npz
  .venv/
```
`data_raw/` ve `.venv/` repoya konmaz (git yok; eklenirse `.gitignore`). Ham kopyalar (zip, npy, tif) yeniden indirilebilir.

## 5. Sıradaki adımlar
1. ~~Aday listesi~~ (yapıldı) ve ~~kontroller~~ (yapıldı; pozitif kontrol ölçütü SAĞLANMADI, bkz. §1). **Karar bekliyor:** Ay profili için analoglar O_k < 0.25 olduğundan D alamıyor; referans seçimi/eşik ayarı bir tasarım kararıdır, kendiliğinden değiştirilmedi.
2. ~~Termal Dünya + Ay P1~~ (yapıldı). Kalan: Dünya termal için `candidates_*.geojson`'a birleştirme (UI aşamasında), Ay PCP (opsiyonel), Mars "Veri eksik" etiketi.
3. **Duyarlılık** (kesme listesinde 3. sıra): pencere 5/10/20 km, ızgara 30/90 m, eşik 0,25/0,5/0,75, değişken çıkarma; Kendall τ ve Jaccard. `sensitivity.json`.
4. **Ürün tutarlılığı:** Ay M2 5 m → 30 m karşılaştırması, NASADEM–SRTMGL1 farkı. Evidence Coverage/Reliability alanları (NUM, ldec).
5. (Termal: yukarıda tamamlandı.)
6. **Web sitesi:** Vite + React + MapLibre. Ekranlar: Harita, Aday listesi, Analog Card (Characterize / Compare / Evidence / Expose the Gap + Novelty), Yöntem ve Doğrulama (formül, eşikler, `data_inventory.csv`, `limitations.json`), ANALOG GAP Report (yazdırılabilir). Tek yönlü sıralı palet, Gap paneli daima D ile yan yana.
7. **Görev simülasyonu:** rover (30 m eğim ızgarasında Dijkstra/A*, limitler yalnızca `parameters_sources.csv` kaynaklı satırlardan), astronot (yürüyüş sınırı kaynak bekliyor), kombine (kesişim/fark). Etiketler: Gerçek ölçüm / Hesaplanmış / Simülasyon varsayımı.
8. **README:** çalıştırma adımları, kaynaklar, lisanslar, sınırlamalar.
9. **Analog koordinat boşlukları** (isteğe bağlı): 7 "kaynak bekliyor" satır.

---
## F1 (2026-11-13): tema + iskelet + taslak 6 + gerçek DEM 3D sahne — TAMAM

**Yapılanlar**
- `scripts/export_dem_windows.py` (+ `earth_scan.read_strip` ortak fonksiyon): 299 gerçek DEM penceresi → `site/public/data/dem/` (Ay Site04/01/07, Mars R2 merkez penceresi, Dünya adayları: profil ve bölge başına en iyi 40). Pencere başına ~37 KB gzip, toplam 7,4 MB (<50 MB). Biçim: Int16 yükseklik + Uint8 eğim, 111×111 (90 m görüntü ızgarası; yükseklik 30 m'nin 3×3 ortalaması, eğim Horn 3×3 30 m'de hesaplanıp 3×3 ortalanır). Tarayıcıda eğim hesaplanmaz. Doğrulama: ATA_r119_c61 eğim P50 görünümde 12,25° / aday dosyasında 12,21°; Site04 18,75° / L01 notunda 19,0°.
- Ön yüz modüler: `config.js`, `theme.css` (tek tema), `i18n/tr.js` + `en.js` iskeleti, `features/variables/*` (6 kayıt), `features/units/*` (rover, astronot; limitler yalnızca `parameters_sources` kaynaklı), `features/compare/*` (demLoader, slopeTexture, terrainMesh, unitModels, sceneRig, SceneView; WebGL yoksa 2D), `hud/*`, `pages/Compare.jsx`, `components/TopBar.jsx`. Tüm dosyalar <300 satır.
- Ana ekran `#/compare/<aday>/<profil>`: iki yarım 3D sahne (tek kamera, aynı ölçek, 10×10 km), eğim sınıf renkleri (tek yönlü palet), limit aşan hücrelerde tarama (Rover Ay: P01 15°; Mars: P03 30° yatış sınırı; Astronot: kaynak bekliyor → tarama yok), dikey abartı ×1/×3/×5, kamera Takip/Serbest/Üstten, D göstergesi (yalnızca `D` Python sonucundan; yoksa "—"), istasyon çubuğu (yalnızca veri durumu), mini harita (regions.geojson), Analog Card'da "Karşılaştırma Görevi başlat".
- Eski sayfalar (Harita, Aday listesi, Analog Card, Yöntem) koyu HUD temasına geçti; üst gezinmeden erişilir. D paleti koyu tema için ters çevrildi (yakın=açık).
- **EK DÜZELTME:** `limitations.json` her kayda `applies_bodies` (moon/mars/earth) ve L02 için `text_by_profile` aldı; Analog Card yalnızca ilgili sınırlamaları gösterir (Mars kartında PSR ve LOLA yok; Ay kartında var; Yöntem sayfası hepsini "Geçerli: …" etiketiyle listeler). Altlık harita yok uyarısı kalıyor. Ekran/DOM ile doğrulandı.

**Bilinen eksikler / dürüst notlar**
- Birim modelleri şematik ve ölçeksiz (arayüzde yazıyor). İstasyon etiketleri 3D sahnede yok, günlük boş, MISSION DONE ve "Raporu aç" devre dışı (F2).
- D, 3 pencerelik Ay referans havuzuna göre hesaplanmıştır; sol karttaki Site seçimi D'yi değiştirmez (göstergede yazıyor).
- DEM penceresi yalnızca profil/bölge başına en iyi 40 aday için var; diğerleri için arayüz "DEM yok" der.
- Görüntü ızgarası 90 m: tarama ve sınıflar 30 m eğimin 3×3 ortalamasından gelir.
- Tarayıcı konsolunda 1 adet 404 (büyük olasılıkla favicon); yan etki yok.
- Paket boyutu 1,5 MB (three + maplibre tek parça); F3'te bölünebilir.

**Sonraki adım:** F2 (istasyon/birim akışı, karşılaştırma kartları, D, MISSION DONE, rapor + JSON). Onay bekliyor.

---
## F1 düzeltmesi (2026-11-13) — TAMAM
- **Kahverengi duvar:** `terrainMesh.js` yükseklik verisi olmayan (nodata) köşeleri medyana çekip bağlıyordu; bu, kenarda dikey duvar/bant üretiyordu. Artık nodata köşeye dokunan üçgenler hiç çizilmez; yükseklik uydurulmaz, etek yok.
- **Dikey abartı:** varsayılan ×1 (`config.js defaultExag`); ×3/×5 seçilebilir; sahnede "Dikey abartı ×N" etiketi.
- **Limit aşımı gösterimi:** tarama (moiré) kaldırıldı; limiti aşan hücre gruplarının dış sınırına 2 px ince açık kontur (`limitLineColor`), eğim renkleri aynen okunur; lejant buna göre güncellendi (≥15° Ay P01, ≥30° Mars P03).
- **Kamera:** 10×10 km pencerenin tamamı görünecek şekilde mesafe, yarım görünüm alanına göre otomatik hesaplanır (yeniden boyutlandırmada da); birim pencere merkezinde olduğundan Takip modunda kadrajda kalır. Sahne alanı HUD panellerinin arasına alındı.
- **1366×768 / %100:** ana ekran yüksekliği = ekran − üst gezinme (ölçülür, `--hdr`); HUD alt paneli kesilmeden sığar (puppeteer: compare alt kenarı 768, alt panel 605–756 px). Altbilgi (kaynaklar) kaydırınca altta.
- Doğrulama: puppeteer (Chrome, SwiftShader) ile Ay profili tek ekran görüntüsü; konsolda yalnızca 1 adet 404 (favicon, önceki gibi).
- Bilinen not: Ay Site04 penceresinde ~3 km yükseklik farkı gerçek DEM'den gelir (×1'de bile dik rampa görünür).
**Sonraki adım:** F2 (onay bekliyor).
---
## F2 (2026-11-13): istasyon akışı, karşılaştırma kartları, MISSION DONE, rapor + JSON — TAMAM
- **İstasyon akışı:** alttaki 6 istasyon tıklanır; her biri referans (Ay/Mars) ile Dünya adayını yan yana gösteren karşılaştırma kartı açar (`hud/StationCard.jsx`). Her satırda etiket: Gerçek ölçüm / Hesaplanmış / Simülasyon varsayımı. Veri eksik istasyonlar (Mars termal, Spektral, Mars profilinde Termal) satır üretmeden "Veri eksik" der ve ziyaret sayılır. Günlük, ziyaret edilen istasyonları yazar.
- **Hesap kaynağı:** `features/variables/*.compute()` mevcut Python sonuçlarını okur (derived_percentiles, O_k, d_k, thermal_*.json, reference_*.json); yeni istatistik üretilmez. Tek ek hesap: görüntülenen 90 m ızgarada eğim > birim limiti hücre oranı (`compare/stats.js`; limit `parameters_sources` kaynaklı, "Simülasyon varsayımı").
- **D:** karttaki Gap uyarısıyla yan yana; yalnızca Python'daki D.
- **MISSION DONE:** 6/6 istasyon ziyaretinden sonra açılır → `#/report/<aday>/<profil>`. Üst çubuktaki "Raporu aç" da çalışır.
- **Rapor (`pages/Report.jsx`):** D + sıra, tüm istasyon tabloları (ekranla aynı `stationResult`), Gap paneli (Analog Card ile ortak), etiketler, veri ürünleri, sabit sınırlamalar. Yazdır/PDF (tarayıcı yazdırma) ve JSON indir (`features/mission/report.js`).
- Doğrulama: puppeteer, Ay ve Mars profilleri: akış, buton durumu, rapor sayfası; konsolda yalnızca 1 favicon 404. Yazdırma çıktısı ve indirilen JSON'un içeriği tarayıcıda gözle denenmedi.
- Dürüst notlar: birim sahnede hareket etmez (rota/Dijkstra F3+; hız/süre gösterilmez); kart sahnenin alt yarısını örter (✕ ile kapanır); rapor rover limitini kullanır (astronot limiti kaynak bekliyor); rapor tarihi/`generated` tarayıcı saatidir.
**Sonraki adım:** onay bekliyor (öneri: rover rota simülasyonu, ardından Yöntem sayfası/README).
---
## F2b (2026-11-13): birim hareketi — TAMAM
- **Akış:** istasyona (alt çubuk veya klavye 1–6) tıklayınca seçili birim (Rover/Astronot), iki tarafta da kendi DEM yüzeyinde düz çizgi rotada istasyona gider; varışta mevcut karşılaştırma kartı açılır. Kart açıkken hareket yoktur; başka istasyon seçilince kart kapanır ve yeni hareket başlar. Hareket sürerken istasyon düğmeleri kapalı.
- **Rota:** düz çizgi, 80 örnek, yükseklik yalnızca DEM'den çift doğrusal örneklenir (`features/compare/route.js`). DEM boşluğuna düşen örnekte çizgi kesilir, birim son geçerli yüksekliği korur; panelde "N örnek boşluğa düştü" yazar (uydurma yok). Hareket sırasında rota çizgisi (amber) görünür, varışta silinir.
- **İstasyon konumları:** pencere merkezi etrafında 6 eşit aralıklı nokta (yarıçap = pencerenin %30'u), iki tarafta aynı göreli konum; en yakın geçerli DEM hücresine oturtulur. Bu bir **gösterim düzenidir, ölçüm yeri değil** (arayüzde yazıyor). Sahnede numaralı işaretler var (1–6).
- **Hız/süre:** yalnızca görsel (`config.js` `moveSpeedKmPerS`). Ekranda sabit: "Simülasyon varsayımı: gösterim hızı, gerçek performans değildir."
- **Atla:** "Atla (S)" düğmesi / `S` tuşu hareketi bitirir; `Esc` kartı kapatır. `prefers-reduced-motion` açıksa hareket otomatik atlanır.
- **Günlük:** "hareket başladı" ve "vardı" satırları, ardından mevcut gözlem satırı.
- **Kamera Takip:** birimi izler (iki birimin yatay ortalaması; kamera tek). Artık pencerenin tamamını değil %60 yakınlığı gösterir (`followZoom`); Serbest ve Üstten değişmedi.
- **Dosyalar:** yeni `features/compare/route.js`, `rigOverlay.js`, `features/mission/useMove.js`, `hud/MovePanel.jsx`; `sceneRig.js` (115 satır), `Compare.jsx`, `SceneView.jsx`, `StationBar.jsx`, `unitModels.js` (astronot önü +x), `config.js`, `tr.js`, `hud.css` küçük değişiklik. Hepsi <300 satır.
- **Doğrulama:** tarayıcıda (1366×768, Ay Site04 / ATA_r119_c61, Rover): tıklama ve klavye (1–6, S, Esc) ile hareket, varışta kart, günlük satırları, Atla; ekran görüntüsü `docs/f2b_hareket.png`; derleme temiz. Mars profili, Astronot birimi ve DEM'siz aday için hareket elle denenmedi; WebGL yoksa (2D yedek) hareket gösterilmez.
- **Dürüst notlar:** birim modelleri hâlâ şematik ve ölçeksiz; rota Dijkstra/eğim maliyetli değil (düz çizgi), eğim limiti aşan yerlerden de geçebilir; rota/süre performans tahmini değildir.
**Sonraki adım:** onay bekliyor (öneri: eğim maliyetli rota, sonra Yöntem sayfası/README).

---
## F3 (2026-11-13): dar ekran HUD düzeni — TAMAM
- **Sorun:** 1100 px altında HUD panelleri (kamera, birimler, HAREKET şeridi, D göstergesi, aday seçici) üst üste biniyor, sahne çok küçülüyor, altbilgi içeriğin üstüne biniyordu.
- **Çözüm:** 1280 px altında (`hud.css`, tek kesim noktası; `hud/Fold.jsx` aynı sorguyu kullanır) HUD mutlak konumdan akışa geçer: üstte iki kart + D göstergesi, HAREKET şeridi, **sahne (sticky, yükseklik clamp(300px, 50vh, 520px); kaydırınca da görünür)**, birim/kamera/günlük/harita panelleri, lejant, istasyon çubuğu. Sayfa yüksekliği otomatik (altbilgi binmesi giderildi).
- **Açılır/kapanır paneller:** `Fold` bileşeni; geniş ekranda yalnızca başlık+içerik (davranış aynı), dar ekranda başlık düğmesi (aria-expanded). Varsayılan: Birimler ve Kamera açık; Gözlem günlüğü, Harita ve iki yan kart (Ay/Dünya) kapalı. Karttaki aday/referans seçici kartı açınca görünür.
- **Her zaman görünür:** D göstergesi, HAREKET şeridi (hareket durumu, Atla, "Simülasyon varsayımı: gösterim hızı, gerçek performans değildir."). Klavye ipucu dar ekranda gizli. 640 px altında D göstergesi tam genişlik, istasyonlar 3 sütun.
- **İstasyon kartı:** dar ekranda sahnenin altında akışta açılır ve görünüme kaydırılır (sahne üstte sticky kalır).
- **Geniş ekran (≥1280) düzeltmeleri:** HAREKET şeridi D göstergesinin alt satırını kesiyordu → 184 px'e indirildi; sol/sağ panel sütunları 150 px'e (yan kartlara değmesin).
- **Doğrulama:** puppeteer (Edge, SwiftShader) 1366×768, 1280×768, 1100, 800 genişlik: yatay taşma yok (scrollWidth = genişlik), üst üste binme yok; 800 ve 1100'de hareket sonrası kart açıldı ve sahne görünür. Gerçek dokunmatik cihaz ve 640 px altı (yalnızca CSS) gözle denenmedi.
- **Notlar:** 1366'da HAREKET şeridi sahnenin üst kenarındaki 1 numaralı işareti kısmen örtebilir. Üst gezinme dar ekranda iki satıra iner (değiştirilmedi).
**Sonraki adım:** onay bekliyor (öneri: eğim maliyetli rota, Yöntem sayfası/README).

---
## F3 ek maddeleri (2026-11-13): hardware, protokol, DEV, check, README/lisans — TAMAM; deploy BEKLİYOR
Not: bu maddeler önceki STATUS.md'de planlı değildi (yalnızca README §5 adım 8 vardı); kullanıcı isteğiyle eklendi, arayüzler ve alanlar bu oturumda tasarlandı.
- **`site/src/hardware/`:** `protocol.js` (v0 doğrulayıcı, NDJSON ayırıcı), `RoverLink.js` (taban: komut/ack, olaylar), `MockLink.js` (döngü-içi sahte rover; telemetri `source:"mock"`), `WebSerialLink.js`, `WebSocketLink.js` (**iskelet, gerçek donanım/sunucuyla denenmedi**), `index.js` (`createLink`, `availability`). Arayüze BAĞLI DEĞİL.
- **`docs/PROTOCOL.md`:** v0 TASLAK (kendi tasarımımız, standart değil): mesaj türleri, koordinat çerçevesi (km, pencere yerel), `source: mock|hardware`, güvenlik ve sınırlar.
- **`DEV.md`:** gereksinimler, çalıştırma, klasörler, genişletme (değişken/birim/parametre/metin/veri), kurallar, `npm run check` açıklaması.
- **`npm run check`** (`site/scripts/check.mjs`): dosya < 300 satır; sabit i18n anahtarları `tr.js`'de var; JSON ayrışır + 299 DEM penceresi dizinle eşleşir; MockLink protokol testi (hello/ack/goto varışı/hatalı mesaj/zaman aşımı/parçalı satır); `vite build`. `--no-build` hızlı mod. Geçti; i18n kontrolü bilerek bozularak hata verdiği görüldü. Yok: ESLint, birim test çerçevesi, tarayıcı içi uçtan uca test.
- **`README.md` + `LICENSE` (MIT, "ANALOG GAP contributors"):** kod/belge MIT; veri ürünleri kendi koşullarında (envanterden aktarıldı; "lisans beyanı yok" olanlar öyle yazıldı). Telif sahibi adı ve MIT seçimi kullanıcı onayına açık.
- **`.gitignore`:** .venv, data_raw, node_modules, site/dist, __pycache__.
- **Deploy: YAPILDI (GitHub Pages).** Adres: https://yade-arch.github.io/analog-gap/ · Depo: https://github.com/yade-arch/analog-gap · İş akışı `.github/workflows/pages.yml` (npm ci, npm run check, derleme, yayın).

## Deploy sonrası düzeltme (2026-11-13)
- **Bozuk Türkçe karakter:** `data/regions.geojson`, `reference_mars.json`, `reference_moon.json`, `reference_windows_moon.json` Windows yerel kod sayfasıyla (cp1254) yazılmıştı; site kopyaları "(bozuk karakter)" gösteriyordu (haritada bölge adları, Mars/Ay referans metinleri). Kaynaklar kayıpsız UTF-8'e çevrildi, yazan betikler (`build_references.py`, `tile_list.py`) `encoding="utf-8"` aldı, site verisi yeniden üretildi; `npm run check` artık JSON'da U+FFFD bulursa hata verir.
- **Canlı doğrulama:** #/compare (iki DEM 200, 3D sahne, istasyon → kart), #/report, #/map, #/list, #/method açıldı; konsol hatası yok. Sunucudaki dosyalar temiz; tarayıcı önbelleği (Pages ~10 dk) eski kopyayı bir süre gösterebilir.
---
## Canlı site testleri (2026-11-13) — TAMAM
Yöntem: puppeteer-core + Edge (SwiftShader), önce canlı adreste, düzeltmelerden sonra yerelde ve yeniden canlıda. Betikler repoda değil.
1. **Astronot:** seçilir, istasyona gider, kart açılır; "Eğim limiti: kaynak bekliyor (tarama yok)", kartta "Birim eğim limiti: Veri eksik / Veri eksik (kaynak bekliyor)" (Simülasyon varsayımı). Hata yok. Tek bulgu: `favicon.ico` 404 → `public/favicon.svg` + `<link rel=icon>` eklendi.
2. **Mars (R2):** referans R2, D = 0,081, rover limiti P03 (30°), 6 istasyon sırayla açıldı; Termal, Mars termal ve Spektral "Veri eksik" (değer yok); Spektral'de "Sonraki" düğmesi yok; MISSION DONE açıldı; rapor JSON'u doğru. Hata yok. Not: profil değişince URL hash'i değişmiyor (paylaşılan bağlantı profili taşımaz) — düzeltilmedi, yeni özellik sayıldı.
3. **Rapor:** JSON içeriği ekrandakiyle aynı kaynak, doğru. Düzeltilenler: (a) yazdırma koyu temada kalıyordu (açık gri metin, koyu etiket zemini, 5 px yatay taşma) → `@media print` ile açık tema değişkenleri, `minmax(0,…)` grid; (b) JSON satırlarına `tag_label` (Gerçek ölçüm/Hesaplanmış/Simülasyon varsayımı), `generated_note` ("tarayıcı saati (UTC); sunucu zaman damgası değildir"); (c) Yazdır/JSON düğmeleri DEM yüklenene kadar kapalı (yarım rapor üretmesin). Yazdırma: 794 px'te taşma yok, 4 sayfa PDF; fiziksel yazıcı ve PDF görüntüleyicide sayfa kırılımı gözle denenmedi (pdftoppm yok).
4. **Aday listesi → "Karşılaştırma Görevi başlat":** Ay ve Mars'ta doğru; DEM'i olmayan aday (ATA_r99_c53, ANA_r57_c82) için "(DEM yok)" ve açıklama gösteriliyor, kartlar ve hareket (yalnızca referans tarafta) çalışıyor. Hata yok.
5. **390 ve 800 px:** bulunan hatalar: (a) Rapor, Aday listesi, Yöntem sayfaları yatay taşıyordu (390'da 459/600/1167 px; Yöntem 800'de de) → neden `main { margin: 0 auto }` flex sütununda içeriğe göre büyümesi + `1fr` grid; `main { width: 100% }`, `minmax(0,1fr)`, kart `overflow-x: auto`; (b) **F3'te "sahne sticky" dediğim yanlıştı**: `inset: auto` `top: 0`'ı sıfırlıyordu → düzeltildi, karttan sonra kart sahnenin altına kayar (`scroll-margin-top`); (c) 390'da sahne ilk ekranda yarım görünüyordu → ≤640 px'te sahne en üstte; (d) karttaki etiket sağdan kesiliyordu → ≤640 px'te satır kırar. Sonuç: 390/800 px'te tüm sayfalarda yatay taşma yok, sahne kart açıkken görünür.
- Bilinen: harita sayfasında MapLibre işaretçisi kenarda taşıyor görünür (sayfa taşmaz); 390 px'te üst gezinme 3 satıra iner; "AŞAMA F2b" rozeti eski aşama adını gösteriyor (değiştirilmedi).

---
## Faz A+B+C: sadeleştirme, canlı sahne, doğrulama (2026-11-13) — TAMAM
Çalışma kararları (soru sorulmadı): faz A ve B tek commit'te; "Görev" = `#/compare`, varsayılan rota `#/home`; GIBS adresi canlı doğrulandı (katman BlueMarble_ShadedRelief_Bathymetry, kümeleme GoogleMapsCompatible_Level8, HTTP 200, CORS *; ilk denediğim EPSG3857_500m adresi 400 verdi, kullanılmadı); Natural Earth 110m kara poligonu `site/public/data/ne_110m_land.geojson` (kamu malı); sahte tarayıcı kimliğiyle (UA) bağlantı denemesi izin sistemince reddedildi, yapılmadı. `bekliyor` işareti gereken madde yok.
**Faz A:** Ana sayfa (amaç + "Görevi başlat" + 3 adım + gerçek en yakın aday sonucu); üst gezinme: Görev, Yöntem ve Doğrulama; Harita/Aday listesi ikincil; her sayfada amaç + "Nasıl okunur"; D, d_eğim, d_röleyf, d_pürüz., Geçerli piksel, Eğim P50 için ipucu + sözlük; profil adlarında Türkçe açıklama. Liste: en yakın 3 kart, tablo varsayılan Sıra/Bölge/D/Eğim P50/Karşılaştır ("Ayrıntılar" ile diğer sütunlar), satır tıklaması karşılaştırma açar, gerçek sayılarla "32652 pencere tarandı; filtreyi geçen 6699 …" (Mars 17892), DEM'siz adaylar "3B yok". Harita: NASA GIBS altlığı + Natural Earth kıyı çizgisi (çevrimdışıysa yalnızca kıyı), lejant/ipucu, etiket çakışma gizleme ve kenara sığdırma; "Orta And" yazım hatası (kaynakta kesik) → "Orta And Dağları". Karşılaştırma: sade ekran, kamera/günlük/mini harita/lejant/abartı kapalı "Gelişmiş" içinde, alt ipucu "Şimdi: birim seç → …". Yöntem: "Kısaca" kutusu, hemen altında pozitif kontrol başarısızlığı notu (görünür), adım şeması, 7 kapalı bölüm, formül bloğu satır kaydırır + "Kopyala".
**Faz B:** düşük poligonlu prosedürel rover/astronot (~3,5× büyük, yumuşak zemin gölgesi, bekleme + hareket animasyonu), numaralı/ışık huzmeli/etiketli istasyonlar (ziyaret edildi yeşil, bekliyor amber, veri eksik gri), "Otomatik görev" (iki birim eş zamanlı, ölçüm 1,5 s, kart 4,5 s veya "Devam", MISSION DONE; Durdur/Atla/Esc/S çalışır), iz çizgisi, yumuşak takip kamerası (geniş ekranda birim üstteki şeridin altında), WebGL yoksa 2D + animasyonsuz tamamlanır. Astronot: "Eğim limiti kaynağı bekleniyor, tarama yok". Süre/hız "Simülasyon varsayımı" etiketli. Değerler yalnızca Python sonuçlarından.
**Faz C (canlı adres, puppeteer+Edge/SwiftShader):** 1) astronot + otomatik görev geçti; 2) Mars R2: 6 istasyon, Mars termal/Spektral "Veri eksik", D 0,081 geçti; 3) rapor: JSON etiketli, `generated` var, yazdırma 794 px taşmasız açık tema geçti; 4) Liste→Karşılaştır ve "DEM yok" geçti; 5) 1366/1100/800/390 px tüm sayfalar: konsol hatası/uyarı yok; bulunup düzeltilenler: 390 px'te profil seçicisi 504 px'e taşıyordu, "Gelişmiş" özeti odak çerçevesiz, bölge etiketi kenarda kırpılıyordu.
**Ek kontroller:** 1) sır taraması (çalışma ağacı + git geçmişi): temiz (yalnızca `os.environ["EARTHDATA_TOKEN"]` ad referansı; değer yok; `.env` hiç izlenmedi) · 2) bağlantılar: 48 URL'den 44 çalışıyor; azgs.arizona.edu (bilinen analog kaydında düz metin, "sayfa açılmadı" diye işaretli) erişilemiyor, usgs.gov ve jpl.nasa.gov otomatik istemciye 403 veriyor (tarayıcıda elle doğrulanmalı; **denenemedi**), "https://carto.n" kaynak notunda kesik metin (bağlantı değil) · 3) soğuk önbellek (kablolu): ana sayfa 0,36 MB / ~1,1 s; harita+karşılaştırma dahil 0,95 MB; three.js ve MapLibre yalnızca ilgili sayfada yüklenir (ana paket 196 KB, Harita 789 KB, Görev 534 KB); DEM yalnızca seçilen iki pencere; yavaş-4G kısıtlamalı ölçüm **denenemedi** (test aracı bağlantısı koptu) · 4) konsol hata/uyarı: yok, favicon 404 yok · 5) klavye: Tab sırası mantıklı, odak çerçevesi görünür (düzeltildi: Gelişmiş/özet), 1–6, S, Esc çalışır; sahneye `role="img"` + açıklama eklendi; kontrast (CSS değişkenleri) tümü ≥ 6,2:1 · 6) dokunmatik: birim seçme ve istasyona dokunma geçti; sahne kanvası dokunmatik kaydırmayı engelliyordu (`touch-action:none`) → Takip/Üstten modunda `pan-y`, Serbest modda `none` (hesaplanan stil doğrulandı; gerçek parmakla kaydırma/döndürme **denenemedi**: otomasyon kaydırma hareketi bu ortamda sayfayı kaydırmadı) · 7) WebGL kapalı: 2D görünüm, otomatik görev tamamlanır, hata yok · 8) 1598 aday D/d_k/O_k/sıra Python `data/` çıktılarıyla birebir aynı (0 fark); rapor JSON'u (Ay ve Mars) aynı; ekran D 3 basamağa yuvarlı · 9) etiketler: "benzerlik %" / "güven puanı" yalnızca olumsuz cümlelerde ("üretilmez"); "ÖRNEK" yok · 10) U+FFFD kod, veri, rapor, belgelerde yok (bu belgede de temizlendi) · 11) README: canlı adres, çalıştırma, lisans, atıflar (NASADEM, LOLA, CTX, PGDA, MODIS, Diviner, GIBS, Natural Earth) güncellendi.
**Çevrimdışı kopya:** `npm run offline` → `offline/analog-gap-offline/` (11 MB) ve `offline/analog-gap-offline.zip` (7,9 MB); `baslat.bat` (Node 20+ ya da Python 3 gerekir; ikisi yoksa çalışmaz), `serve.mjs`, `OKU-BENI.md`; GIBS/CDN/yazı tipi yok (derleme `VITE_OFFLINE=1`); yerel sunucudan tüm sayfalar açıldı, **dış alan adına 0 istek**, konsol hatası yok. Klasör `.gitignore`'da. Belge: `docs/OFFLINE.md`. `baslat.bat` bu makinede çift tıklanarak denenmedi (yalnızca `serve.mjs` doğrudan çalıştırıldı).
**Gösteri:** `docs/DEMO.md` (3 dk metin; bulgu cümleleri gerçek değerlerle: Ay ATA_r119_c61 D 0,160; Mars ANA_r15_c33 D 0,081).
**Bilinen sınırlar:** profil değişince URL hash'i değişmiyor; ≤1279 px'te kapalı "Gelişmiş" içindeki paneller çakışma testinde yanlış pozitif verir (kapalı, görünmez); fiziksel yazıcı/PDF görüntüleyici denenmedi; Pages önbelleği ~10 dk eski kopya gösterebilir.

---
## Yarın için hazırlık (2026-11-13) — TAMAM (yalnızca belge/taslak; site kodu değişmedi)
1. **`docs/SUNUM.md`:** başlık bulgusu (tek cümle), 90 sn ve 3 dk metin, jüri cevapları (yüzde yok, pozitif kontrol, veri gerçekliği, Mars termal, astronot limiti, birim hızı, tavsiye). Sayılar siteden: Ay ATA_r119_c61 D 0,160; Mars ANA_r15_c33 D 0,081; pozitif kontrol medyan 74,5 (n = 5). Çevrimdışı kopya (`docs/OFFLINE.md`, `baslat.bat`) zaten vardı.
2. **`docs/ROADMAP.md`:** (b) eğime duyarlı rota, (a) Arduino Web Serial + Donanım paneli, (d) astronot limiti kaynağı, (c) gölge modülü, (e) yeni referans/bölge; her biri için amaç, kabul ölçütü, dosyalar, süre, risk, hazır komut. Öncelik gerekçesi dosyada. Karar: (b) başa alındı (CLAUDE.md'deki "rover eğim maliyetli rota" gereksinimi ve gölge için ön koşul).
3. **`docs/arduino/`:** `d_gostergesi` (sensörsüz LED/servo D göstergesi), `mpu6050_egim` (statik eğim; sensör yoksa yalnızca `sensor_missing` hatası, değer yok), kablolama tabloları, kütüphaneler, yükleme. `docs/PROTOCOL.md` §8'e taslak uzantılar eklendi (`show_d`, `sensor`, `sensor_missing`) — **`protocol.js` bunları henüz reddeder**; taslaklar derlenmedi ve cihazla **denenmedi**.
4. **`CITATION.cff`, `.zenodo.json`** (MIT, "ANALOG GAP contributors", ORCID yok), README'de "Nasıl atıf yapılır" ve **DOI: bekliyor**, `docs/RELEASE_NOTES_v0.1.0.md`. **`v0.1.0` tag'i** (açıklamalı) push edildi. GitHub **Release** nesnesi oluşturulmadı (token yok/istenmedi): Releases → "Draft a new release" → tag v0.1.0 → notları yapıştır; Zenodo bağlantısı kullanıcıda.
Her madde sonrası `npm run check` geçti, commit + push yapıldı.
