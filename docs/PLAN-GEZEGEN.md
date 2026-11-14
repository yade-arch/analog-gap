# Gezegen Keşfi: Faz 0 doğrulama (2026-11-14)

Doğrulama tek seferlik `curl` (Origin: https://yade-arch.github.io) ile yapıldı; tekrar sorgulanmaz.

## 1. Küre dokuları
| Cisim | Seçim | Kaynak / lisans | Erişim | Boyut |
|---|---|---|---|---|
| Dünya | Yerel `data/tex/earth_bmng_200412_2048.jpg` (envanter T1) | NASA Blue Marble NG, Aralık 2004; telif yok, kaynak belirtilir | Yerel (CORS sorunu yok) | 2048×1024, 325 KB |
| Ay | Yerel `moon_lroc_color_2048.jpg` (T2) + `moon_ldem_bump_1024.jpg` (T3) | NASA SVS CGI Moon Kit (LROC WAC + LOLA); telif yok | Yerel | 406 KB + 105 KB |
| Mars | Yerel `mars_viking_clr_2048.jpg` (T4) | USGS Astrogeology, Viking renkli mozaik 925 m; kamu malı | Yerel | 266 KB |

Uzak döşemeler (yakın yakınlaştırma için, sonraki iş): GIBS `BlueMarble_ShadedRelief_Bathymetry` 200, CORS `*`. Moon Trek `LRO_WAC_Mosaic_Global_303ppd_v02` 200, CORS `*`, ~49 KB/döşeme. Mars Trek `Mars_Viking_MDIM21_ClrMosaic_global_232m` 200, CORS `*`, ~53 KB/döşeme. Karar: Faz 2 yerel dokuları kullanır (≤ 0,5 MB/doku, çevrimdışı derlemeyle uyumlu).

## 2. Gezegen sabitleri
Kaynak: NASA NSSDCA Planetary Fact Sheet (metrik), https://nssdc.gsfc.nasa.gov/planetary/factsheet/ ; atmosfer bileşimi `marsfact.html`, `earthfact.html`. Değerler `site/src/features/planet/registry.js` içinde kaynak URL'siyle.

## 3. Küresel yükseklik sorgusu (tarayıcıdan)
Mars Trek MOLA DEM döşemesi denendi: 404. Trek görsel döşemeleri yükseklik değeri taşımaz (8 bit görsel). LOLA/MOLA/NASADEM için CORS'lu nokta sorgu servisi doğrulanmadı. **Karar: küresel yükseklik adapter'ı ERTELENDİ.** Nokta verisi yalnızca `localScan` (mevcut tarama pencereleri ve referans alanları) ile gelir; kapsam dışında "Veri yok: bu nokta taranmadı".
