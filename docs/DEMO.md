# ANALOG GAP: 3 dakikalık gösteri metni

Canlı adres: https://yade-arch.github.io/analog-gap/ · Önce profil: **Lunar Base Analogs** (üstteki seçici). Tüm sayılar sitenin kendi veri dosyalarından okunmuştur (`site/public/data/candidates_*.geojson`, kartlar ve JSON rapor ile birebir aynı); buraya yeni değer yazılmadı.

## Tek cümlelik bulgu (gösteride söylenecek)
> "Atacama'daki ATA_r119_c61 penceresi (25,426°G, 67,994°B, 10×10 km), Ay'daki Shackleton referansına eğim, yerel röleyf ve pürüzlülük dağılımı bakımından, taradığımız 6.699 filtreyi geçen pencere arasında en yakın aday: analog mesafesi D = 0,160 (düşük = yakın), ama bu bir Ay karşılığı değil, yalnızca topografik bir yakınlık."

Mars profili için aynı cümle: ANA_r15_c33 (Batı/Orta Anadolu, 39,311°K, 30,879°D) Jezero referansına D = 0,081 ile en yakın aday (filtreyi geçen 17.892 pencere arasında; referans: Mars 2020 TRN CTX DTM, R2).

## Akış (≈ 3 dk)
| Süre | Sayfa / tıklama | Ne söylenir |
|---|---|---|
| 0:00 | **Ana sayfa** (`#/home`). Sadece bakılır. | "Dünya'da, Ay veya Mars referans arazisine en yakın, daha az incelenmiş 10×10 km pencereleri buluyoruz. Üç adım: aday seç, birim gönder, rapor al." |
| 0:20 | **Görevi başlat →** | "En yakın adayla Karşılaştırma Görevi açıldı: solda Ay (LOLA), sağda Dünya (NASADEM), aynı ölçek, gerçek DEM." |
| 0:35 | Ortadaki **D göstergesi**'ne işaret et | "D = 0,160. Yüzde ya da güven puanı değil; mesafe. Küçük = yakın. Yanındaki Gap bilgisi sınırı hatırlatır." |
| 0:50 | **▶ Otomatik görev** | "İki birim aynı anda 6 istasyonu geziyor. Hız ve süreler Simülasyon varsayımı; gerçek performans değil. Her istasyonda kısa ölçüm, sonra kart." |
| 1:10 | İlk kart (Eğim) açıkken kartı göster | "Gerçek ölçüm, Hesaplanmış, Simülasyon varsayımı etiketleri ayrı. Eğim P50: Ay 12,6°, aday 12,2°. d_eğim = 0,117." |
| 1:35 | Termal / Mars termal / Spektral kartları (otomatik gelir) | "Veri olmayan yerde sayı üretmiyoruz: 'Veri eksik'. Spektral kapsam dışı." |
| 2:00 | **MISSION DONE** → **Rapor** | "Yazdırılabilir rapor ve JSON: aynı sayılar, etiketler ve Gap paneli." |
| 2:20 | **Yöntem ve Doğrulama** → *Kısaca* kutusu, hemen altındaki sarı not | "Doğruluk konusunda dürüstüz: pozitif kontrol ölçütü sağlanmadı (bilinen analogların medyan yüzdeliği 74,5; hedef ≤ 20). Bu yüzden 'doğrulandı' demiyoruz." |
| 2:45 | **Harita** (isteğe bağlı) | "Her nokta bir aday pencere, renk D. Bir noktaya tıkla → aday kartı → görev." |
| 2:55 | Kapanış | "Hiçbir bölge Ay/Mars'ın tam karşılığı değil; 'daha az incelenmiş' diyoruz, 'keşfedilmemiş' demiyoruz." |

## Olası sorular
- *Neden yüzde yok?* D bir mesafe, olasılık değil; tek bir yüzde istatistiksel anlam taşımaz (Yöntem → Kısaca).
- *Astronot?* Eğim limiti için NASA kaynaklı parametre bulunmadığından tarama yapılmıyor: "Eğim limiti kaynağı bekleniyor, tarama yok."
- *Çevrimdışı?* `docs/OFFLINE.md` (internetsiz paket).