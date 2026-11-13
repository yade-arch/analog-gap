# ANALOG GAP: sunum metinleri ve jüri cevapları

Canlı: https://yade-arch.github.io/analog-gap/ · Tüm sayılar sitenin veri dosyalarından ve ekranlarından okunmuştur (`site/public/data/*`; kartlar, rapor ve JSON ile aynı). Çevrimdışı kopya: `docs/OFFLINE.md` (`npm run offline`, `baslat.bat`) hazırdır.

## Başlık bulgusu (tek cümle)
**Atacama'daki ATA_r119_c61 penceresi (25,426°G, 67,994°B, 10×10 km), taradığımız 32.652 pencereden filtreyi geçen 6.699'u arasında Ay'ın Shackleton referansına topografik olarak en yakın aday (D = 0,160; düşük = yakın); bu bir Ay karşılığı değil, yalnızca eğim, röleyf ve pürüzlülük dağılımı yakınlığıdır.**
Mars için: ANA_r15_c33 (Batı/Orta Anadolu, 39,311°K, 30,879°D), Jezero referansına D = 0,081 (filtreyi geçen 17.892 pencere arasında 1. sıra).

## 90 saniyelik metin
1. (0-15 sn, Ana sayfa) "ANALOG GAP, Dünya'da Ay veya Mars referans arazisine en yakın, daha az incelenmiş 10×10 km pencereleri bulur ve karşılaştırmanın sınırlarını her zaman yanında gösterir."
2. (15-35 sn, Görevi başlat) "Solda Ay'ın Shackleton çevresi (LOLA), sağda Atacama penceresi (NASADEM 30 m); aynı ölçek, gerçek yükseklik verisi. Ortadaki D = 0,160: eğim, röleyf ve pürüzlülük mesafelerinin ortalaması."
3. (35-60 sn, Otomatik görev) "İki birim 6 istasyonu geziyor; hız ve süreler Simülasyon varsayımı. Eğim P50: Ay 12,6°, aday 12,2°. Veri olmayan istasyonlarda sayı üretmiyoruz: 'Veri eksik'."
4. (60-80 sn, Yöntem ve Doğrulama) "Dürüst olalım: pozitif kontrol ölçütümüz sağlanmadı. Bilinen analogların medyan yüzdeliği 74,5; hedef 20 veya altı. Yöntemi bu sonuca göre ayarlamadık."
5. (80-90 sn) "Hiçbir bölge Ay veya Mars'ın tam karşılığı değil; 'daha az incelenmiş' diyoruz, 'keşfedilmemiş' demiyoruz."

## 3 dakikalık metin
`docs/DEMO.md` içindeki akış tablosu 3 dakikadır (sayfa/tıklama/ne söylenir). Konuşma özeti:
- **Sorun:** Ay ve Mars ekibinin Dünya'da deneme yapacağı arazi seçimi çoğunlukla bilinen birkaç sahaya dayanır; daha az incelenmiş adaylar sistematik taranmaz.
- **Yaklaşım:** Dört geniş kara bölgesi (ABD Güneybatı, Atacama, Hawaii Büyük Ada, Batı/Orta Anadolu) ortak 30 m ızgarada 10×10 km pencerelere bölünür. Her pencerenin eğim, röleyf ve pürüzlülük dağılımı referansınkiyle karşılaştırılır: d_k = W1 / IQR(referans), D = üç d_k'nin eşit ağırlıklı ortalaması (ağırlıklar sabit, arayüzde görünür).
- **Sonuç:** Ay profilinde 1. ATA_r119_c61 (D 0,160; d_eğim 0,117, d_röleyf 0,151, d_pürüz. 0,210), 2. ATA_r101_c50 (0,191), 3. HAW_r8_c12 (0,194). Mars profilinde 1. ANA_r15_c33 (D 0,081; 0,057 / 0,076 / 0,108).
- **Gap:** Her kartın yanında karşılaştırılamayanlar yazar: spektral, regolit, atmosfer, yerçekimi, radyasyon. Veri kapsamı (Evidence Coverage) ve güvenilirlik (Reliability) ayrı gösterilir; tek bir güven puanı yoktur.
- **Sınırlar:** pozitif kontrol sağlanmadı (aşağıda); Ay referansı yalnızca 3 pencere; Mars referansı tek, küçük bölge; PSR ve antropojenik alan maskesi yok; pürüzlülük düşük güvenilirlikli; duyarlılık analizi yapılmadı.

## Jüri soruları: kısa cevaplar
**Neden yüzde (benzerlik %) yok?**
D bir mesafedir (Wasserstein / referans IQR), olasılık değildir. Eşiği veya dağılımı yüzdeye çevirmek istatistiksel anlamı olmayan bir sayı üretirdi. Sıralama için D yeterlidir; mutlak "iyi/kötü" eşiği iddia etmiyoruz.

**Pozitif kontrol neden başarısız?**
Bilinen analogları (ör. Cinder Lake, Black Point) adaylar arasında ilk sıralarda görmeyi bekledik: ölçüt, medyan yüzdelik ≤ 20. Gerçekte n = 5 analog test edilebildi (13 satırdan; 7'sinde koordinat yok) ve medyan yüzdelik 74,5 çıktı. Bölge dağılımı dengesiz, bazı koordinatlar zayıf kaynaklı. Parametreleri sonuca göre oynatmadık; bu yüzden "yöntem doğrulandı" demiyoruz. Bu, yöntemin mevcut hâliyle bilinen sahaları geri bulamadığı anlamına gelir; yorum buna göre temkinli olmalı. (Ayrıntı: Yöntem → Doğrulama.)

**Veriler gerçek mi?**
Evet, hepsi kayıtlı ürünlerden: Dünya NASADEM_HGT v001 (NASA LP DAAC, 30 m), Ay LOLA LDEM_80S_20M (NASA PDS), Mars Mars 2020 TRN CTX DTM (USGS, CC0). Ürün adı, sürüm, çözünürlük, birim ve lisans Yöntem sayfasındaki veri envanterindedir. Siteye giden dosyalar bunlardan türetilmiştir; 1.598 adayın D, d_k ve sırası Python çıktılarıyla birebir aynıdır (denetlendi). Rastgele veya örnek değer yok.

**Mars termal neden yok?**
Mars termal ürünü (THEMIS) doğrulanıp işlenmedi; süre baskısında kesme listesinin ilk maddesiydi. Bu yüzden Mars profilinde Termal ve Mars termal kartları "Veri eksik" der ve D'ye hiçbir termal değer girmez. Ay termali (Diviner) ve Dünya LST'si de eşdeğer nicelik olmadıkları (yüzey vs. 2 cm derinlik, model) için puana girmez, yalnızca karakterizasyonda gösterilir.

**Astronot limiti neden yok?**
Astronot yürüyüş eğimi ve giysi parametreleri için doğrulanmış bir NASA kaynağı bulamadık (`parameters_sources.csv` P05, P06: "kaynak bekliyor"). Kaynaksız parametre arayüzde seçilemez, bu yüzden astronot sahnede hareket eder ama eğim taraması yapılmaz: "Eğim limiti kaynağı bekleniyor, tarama yok." Rover limitleri kaynaklıdır: Ay 15° (NASA VIPER Lunar Operations), Mars 30° yatış (JPL PIA26402); ikisi de Simülasyon varsayımıdır, gerçek performans tahmini değildir.

**Birimlerin hızı gerçek mi?**
Hayır. Hız ve ölçüm/kart bekleme süreleri gösterim içindir ve her yerde "Simülasyon varsayımı" etiketlidir.

**Bu analog sahayı Ay/Mars'a gönderilecek ekip için öneriyor musunuz?**
Hayır. Yalnızca topografik dağılım yakınlığını ölçüyoruz; sahadan tavsiye üretmiyoruz. Hiçbir bölge Ay/Mars'ın tam karşılığı olarak sunulmaz.