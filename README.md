# ANALOG GAP

NASA Space Apps Challenge 2026 projesi. Dünya'da, Ay ve Mars referans bölgelerine topografik (ve sınırlı termal) olarak yakın, **daha az incelenmiş** pencereleri bulur, karakterize eder, referanslarla yan yana karşılaştırır ve karşılaştırmanın **sınırlarını (Gap)** her zaman gösterir. Statik web sitesidir; sunucu yoktur.

**Canlı site: https://yade-arch.github.io/analog-gap/** · Gösteri metni: [`docs/DEMO.md`](docs/DEMO.md) · İnternetsiz kopya: [`docs/OFFLINE.md`](docs/OFFLINE.md)

> Hiçbir bölge Ay veya Mars'ın tam karşılığı olarak sunulmaz. Site yalnızca topografik/termal özellikleri karşılaştırır; spektral, regolit, atmosfer, yerçekimi ve radyasyon karşılaştırılamaz. Görev simülasyonu gerçek performans tahmini değildir.

## Ne var
- **Ana sayfa:** tek cümlelik amaç, "Görevi başlat" ve 3 adım (aday seç, birim gönder, rapor al). Her sayfada amaç cümlesi ve "Nasıl okunur" kutusu, D ve türevleri için ipucu/sözlük var.
- **Karşılaştırma ekranı (Görev):** Ay veya Mars referansı ile Dünya adayı yan yana, gerçek DEM'den 3D (10×10 km). 6 istasyon (eğim, röleyf, pürüzlülük, termal, Mars termal, spektral); birim (Rover/Astronot) istasyona yüzeyde gider, varışta karşılaştırma kartı açılır; **Otomatik görev** iki birimi tüm istasyonlarda sırayla gezdirir (ölçüm bekleme ve kart süreleri "Simülasyon varsayımı"). Kamera, günlük, mini harita ve lejant kapalı "Gelişmiş" bölümündedir. Eksik veri "Veri eksik" yazılır, değer üretilmez.
- **Harita, aday listesi, Analog Card, Yöntem ve Doğrulama, yazdırılabilir rapor** (+ JSON dışa aktarma).
- **Mesafe:** değişken bazlı Wasserstein mesafesi / referans IQR'nin eşit ağırlıklı ortalaması, `D` (düşük = yakın). "Benzerlik yüzdesi" veya güven puanı yoktur. Formül ve eşikler Yöntem sayfasında.

## Çalıştırma
```bash
cd site
npm install
npm run dev            # geliştirme
npm run build          # dist/
npm run preview -- --port 4173
npm run check          # kontroller + derleme (bkz. DEV.md)
npm run offline        # internetsiz paket: ../offline/analog-gap-offline(.zip), bkz. docs/OFFLINE.md
```
Node 20+ gerekir. Python **gerekmez**: üretilmiş veri `site/public/data` içindedir (~9 MB). Veri hattını yeniden çalıştırmak için `DEV.md`.

## Veri kaynakları ve lisanslar
Tüm ürünler `data_inventory.csv` içinde kapsam, çözünürlük, birim, tarih, lisans ve doğrulama durumuyla kayıtlıdır; **doğrulanmayan ürün kullanılmaz**.

| Ürün | Kullanım | Lisans / kullanım koşulu (envanterden) |
|---|---|---|
| NASADEM_HGT v001 (NASA JPL / LP DAAC), 1 arc-sn (~30 m) | Dünya DEM | EOSDIS veri kullanımı ve atıf rehberi; kısıtlamasız açık paylaşım. DOI 10.5067/MEASURES/NASADEM/NASADEM_HGT.001 |
| MYD11A2 v061 (MODIS/Aqua LST, 1 km, 8 günlük) | Dünya termal (yalnızca Characterize/Gap) | EOSDIS veri politikası (açık); sayfada lisans metni yok. DOI 10.5067/MODIS/MYD11A2.061 |
| LOLA LDEM_80S_20M (PDS Geosciences) | Ay referans DEM | PDS kamu arşivi; lisans beyanı yok (NASA verisi) |
| LOLA 5 m kutup ürünleri (PGDA; Barker et al. 2021) | Ay referans pencere konumları (ROI) | Lisans beyanı sayfada yok; atıf: Barker et al. 2021, Planet. Space Sci. 203, 105119 |
| Diviner PRP (south) (UCLA / PDS) | Ay termal (türetilmiş model, doğrudan ölçüm değil) | PDS kamu arşivi; lisans beyanı yok |
| Mars 2020 TRN CTX DTM (USGS Astrogeology) | Mars referans DEM (Jezero) | CC0 1.0. DOI 10.5066/P906QQT8 |
| NASA GIBS WMTS, katman BlueMarble_ShadedRelief_Bathymetry (NASA EOSDIS GIBS) | Harita altlığı (yalnızca Harita sayfası, çevrimiçi) | Görüntüler NASA/EOSDIS açık veri politikasıyla sunulur; atıf: "Imagery: NASA EOSDIS GIBS". Çevrimdışıysa altlık yüklenmez, kıyı çizgileri kalır |
| Natural Earth 1:110m kara poligonları (naturalearthdata.com) | Harita kıyı çizgisi/kara dolgusu (pakete dahil: `site/public/data/ne_110m_land.geojson`) | Kamu malı (public domain); atıf zorunlu değil, verilir |
| MOLA MEGDR, SRTMGL1, MOD11A2 | bağlam / çapraz kontrol (envanterde) | envanter dosyasına bakın |

Siteye giden `site/public/data/*` bu ürünlerden **türetilmiştir** (eğim, röleyf, pürüzlülük, yüzdelikler, 90 m görüntü ızgarasına örneklenmiş DEM pencereleri); işlem adımları arayüzde ve Yöntem sayfasında yazılıdır. Yukarıdaki kaynakları kullanırken ilgili atıf kurallarına uyun. "Lisans beyanı yok" yazan ürünler için hukuki bir yorum yapmıyoruz; yeniden dağıtımdan önce kaynak sayfayı kontrol edin.
Simülasyon parametreleri (ör. rover eğim limiti) yalnızca `parameters_sources.csv` içinde NASA kaynak bağlantısıyla tutulur; kaynaksız parametre arayüzde seçilemez.

## Sınırlamalar (kısa; tamamı `data/limitations.json` ve Yöntem sayfasında)
- **Pozitif kontrol ölçütü SAĞLANMADI.** Bilinen analogların medyan yüzdeliği 74,5 (ölçüt ≤ %20); n çok küçük (5), bazı koordinatlar zayıf kaynaklı. Parametre ayarlanarak düzeltilmedi; "yöntem doğrulandı" denmez. Ayrıntı: `data/controls.json`, Yöntem sayfası.
- Ay referansı yalnızca 3 pencere; Mars referansı tek, küçük bir bölge (%50 örtüşen pencereler). Ay sıralaması bu yüzden zayıf yorumlanır.
- PSR maskesi, antropojenik alan maskesi yok; pürüzlülük düşük güvenilirlikli; LOLA piksellerinin büyük kısmı interpolasyondur.
- Termal puana/filtreye girmez; Dünya LST (yüzey, iki örnek) ile Ay Diviner (2 cm derinlik, model) eşdeğer nicelik değildir. Mars termal: "Veri eksik". Spektral: kapsam dışı.
- DEM penceresi yalnızca profil/bölge başına en iyi 40 aday için var. Harita altlığı (GIBS) yalnızca çevrimiçi yüklenir; altlık yoksa Natural Earth kıyı çizgileri gösterilir. Altlık görüntü bilimsel veri değildir, yalnızca konum bağlamıdır.
- Birim modelleri şematik; istasyon konumları gösterim düzenidir; hareket hızı/süresi görseldir. Rota düz çizgidir (eğim maliyetli rota yok); otomatik görev süreleri görseldir.
- Astronot yürüyüş sınırı, giysi ve genel Mars gezgin limiti "kaynak bekliyor" (seçilemez).
- `site/src/hardware` (RoverLink, MockLink, Web Serial/WebSocket) bir **iskelettir**: arayüze bağlı değil, gerçek donanımla denenmedi (`docs/PROTOCOL.md`).

## Nasıl atıf yapılır
GitHub'daki **Cite this repository** düğmesi CITATION.cff dosyasını kullanır. Elle: *ANALOG GAP contributors (2026). ANALOG GAP, sürüm 0.1.0. https://github.com/yade-arch/analog-gap*. Veri ürünleri (NASADEM, LOLA, CTX DTM, MODIS, Diviner) kendi atıf kurallarına tabidir (yukarıdaki tablo).
**DOI:** [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24206820.svg)](https://doi.org/10.5281/zenodo.24206820) · https://doi.org/10.5281/zenodo.24206820 (Zenodo, v0.1.0). .zenodo.json Zenodo için hazırdır. Sürüm notları: docs/RELEASE_NOTES_v0.1.0.md.

## Lisans
Kod ve belgeler: **MIT** (`LICENSE`). Veri ürünleri yukarıdaki kaynaklarının kendi koşullarına tabidir; MIT onları kapsamaz. Üçüncü taraf kütüphaneler: React, three.js (MIT), MapLibre GL JS (BSD-3-Clause), Vite (MIT); lisansları `site/package-lock.json` ve paketlerinde.

## Belgeler
`docs/DEMO.md` (3 dk gösteri), `docs/OFFLINE.md` (internetsiz paket), `CLAUDE.md` (proje kuralları), `SPEC.md` (teknik şartname), `STATUS.md` (durum ve kararlar), `DEV.md` (geliştirici notları), `docs/PROTOCOL.md` (rover bağlantı taslağı).
