# ANALOG GAP: proje kuralları (Claude Code için)

NASA Space Apps Challenge 2026. Dünya'da Ay ve Mars için yeterince incelenmemiş analog bölgeleri keşfeden, karakterize eden, Ay/Mars referanslarıyla karşılaştıran ve sınırlarını (Gap) gösteren statik web sitesi. 1 kişi, yaklaşık 1 gün. Kullanıcı yalnızca izin verir; kodu ve siteyi sen yazarsın.

## Değişmez kurallar (kaliteden ödün yok)
1. Yalan bilgi yok. Her sayı gerçek bir veri ürününe dayanır. Ürün adı, sürüm, çözünürlük, birim, tarih ve işlem adımı arayüzde görünür. NASA'dan bir bilim insanı siteyi açsa işine yaramalı.
2. NASA verisi bulunmayan özellik için değer üretme. "Veri eksik" yaz. Gerekirse diğer ajans verisi kullan, kaynağını belirt.
3. Eksik veri sıfır veya gerçek fark sayılmaz. Ortak veri yoksa genel puan üretilmez.
4. Her sonuçta üç etiket ayrı: Observed Data, Derived Parameter, Scientific Interpretation. Görev simülasyonunda: Gerçek ölçüm / Hesaplanmış / Simülasyon varsayımı.
5. Hiçbir bölge Ay/Mars'ın tam karşılığı olarak sunulmaz. "Keşfedilmemiş" deme; "daha az incelenmiş" veya "katalogda yok" de.
6. Evidence Coverage ve Evidence Reliability ayrı. İstatistiksel anlamı olmayan tek "güven puanı" yok.
7. Bilinen analoglar aday üretiminde kullanılmaz, yalnızca pozitif kontrol ve "bilinen" etiketi içindir.
8. Simülasyon parametreleri (rover eğim limiti vb.) hafızadan yazılmaz. parameters_sources.csv içinde değer, birim ve NASA kaynak linkiyle tutulur. Kaynaksız parametre arayüzde seçilemez.
9. Farklı uydu verileri doğrudan karşılaştırılmaz: ortak mekansal ölçek, ortak eğim tabanı, uygun ön işleme.
10. Genel puan formülü ve ağırlıkları arayüzde görünür, kullanıcı değiştiremez (MVP: eşit ağırlık).

## Kapsam
- Profiller: Lunar Base Analogs (Shackleton çevresi, güney kutbu), Martian Landing & Exploration (Jezero çevresi). Referans seçimi veri kapsamı doğrulanınca netleşir.
- Değişkenler: topografya (eğim P50/P90, yerel röleyf, pürüzlülük), termal (günlük sıcaklık aralığı, yıllık ortalama; Dünya MODIS LST, Ay Diviner, Mars THEMIS zaman kalırsa), spektral = "kapsam dışı / veri yok" olarak gösterilir.
- Aday üretimi: Dünya'da seçilmiş 3-4 geniş kara bölgesi, referansla aynı pencere boyu, referans P10-P90 örtüşme filtresi. Sıralama: değişken bazlı Wasserstein mesafesi / referans IQR.
- Kontroller: pozitif (bilinen 15-20 analog ilk N'de mi), negatif (rastgele hücreler), duyarlılık.
- Mission Simulation: Rover (DEM eğim maliyetli rota; tam), Astronot (yürüyüş/eğim sınırı; giysi yalnızca kaynaklı parametre), Combined (ulaşılabilir alan kesişimi/farkı). Gerçek performans tahmini iddia edilmez.
- Kapsam dışı: küresel kümeleme, süreç analogları, spektral mineraloji, antropojenik alanlar.

## Teknoloji
Python veri hattı (rasterio/numpy/scipy/geopandas, parquet) -> küçük JSON/GeoJSON -> Vite + React + MapLibre GL statik site -> GitHub Pages veya Vercel. Sunucu yok.
Ekranlar: Harita, Aday listesi, Analog Card (Characterize / Compare / Evidence / Expose the Gap + Novelty), Görev ekranı, Yöntem ve Doğrulama, otomatik ANALOG GAP Report (yazdırılabilir).

## Çıktı kalite çıtası
- Arayüz profesyonel, sakin, bilimsel: tek yönlü sıralı palet (kırmızı/yeşil iyi-kötü yok), erişilebilir kontrast, net birimler.
- "Benzerlik" gösterimi her zaman "Gap" paneliyle yan yana.
- Her sayfada kaynak ve veri ürünü bilgisi. Yöntem sayfasında formüller, eşikler, data_inventory.csv.
- README: çalıştırma adımları, veri kaynakları, lisanslar, sınırlamalar.

## Çalışma düzeni (hak tasarrufu)
- Önce data_inventory.csv: her ürünün kapsamı, çözünürlüğü, birimi, tarihi, lisansı, boyutu. Doğrulanmayan ürün kullanılmaz.
- Önce küçük test (tek karo), sonra tam çalıştırma. Büyük dosyaları tekrar okutma.
- Aşama sonunda kısa durum ve bir sonraki adım yaz.
- Zor tasarım/hata gelirse kullanıcıya şunu söyle: "Opus 5.5 / High'a geç, çünkü X".
- Kesme sırası (süre baskısında): Mars termal, astronot giysi parametreleri, duyarlılık testi, PDF dışa aktarma. Topografya + aday üretimi + Gap paneli her durumda teslim edilir.
- Kullanıcı yalnızca izin verir; yapılması gereken işi yap, gereksiz soru sorma.

## Veri kaynakları (aday liste, hepsi doğrulanacak)
Earth: NASA Earthdata Search, Worldview (NASADEM/SRTM, MODIS LST, ASTER, EMIT). Moon: NASA PDS, LRO (LOLA, Diviner, LROC). Mars: NASA PDS (MOLA, CRISM, THEMIS).
Tamamlayıcı (yalnızca NASA verisi eksikse): CSA RADARSAT, ESA Copernicus Data Space, ESA Open Science Catalog, JAXA G-Portal.
