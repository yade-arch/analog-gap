# Ana ekranlar ve 3D küre: çalışma notları

Dal: `feature/ana-ekran-3d`. Oyun dalı: `feature/oyun-3d-kure` (ortak küre oradan geldi). Birleştirme sırası: önce oyun PR'ı, sonra bu dal.

## TEMA SİSTEMİ: AÇIK + KOYU (2026-11-14) — oyun oturumu için, ÖNCE BUNU OKU
- `html[data-theme="light"|"dark"]`; değişken ADLARI iki temada aynı, değerleri farklı (theme.css). Aşağıdaki tablo açık tema değerleri; koyu değerler theme.css `html[data-theme="dark"]` bloğunda.
- Yeni: `--slope1..5`, `--slope-nodata`, `--slope-limit`, `--route` (eğim katmanı), `--radius` 6px / `--radius-lg` 8px.
- İlk tema index.html betiğiyle boyamadan önce (localStorage "ag-theme", yoksa prefers-color-scheme). `src/theme.js`: `useTheme()` → {theme, pref, setPref}; değişince window "themechange" olayı.
- JS'te renk okuma: `cssVar("--x", yedek)` (src/cssVar.js; common.jsx de dışa verir). Modül düzeyinde SABİTLEMEYİN; çizim anında okuyun. `dStops()`, `dScale()` (features/home/markers.js), `SETTINGS.slopeColors/noDataColor/limitLineColor/routeColor` artık okunduğu anda tema rengini veren getter/işlev.
- App içerikleri tema değişince yeniden kurulur (`<Suspense key={theme}>`), tuval/WebGL yeni renkleri alır. Görev ekranında tema değişirse görev durumu sıfırlanır (bilinen).
- Oyun sayfası: game.css'te sabit renk varsa bu değişkenlere geçin; tema anahtarı üst çubukta.

## YENİ TEMA DEĞİŞKENLERİ (açık tema değerleri)
theme.css `:root` (yalnızca bu oturum düzenler). Sabit renk yazmayın; CSS'te `var(--x)`, JS'te `cssVar("--x", yedek)` (common.jsx). Renkler 6 haneli #hex.
| Değişken | Değer | Kullanım |
|---|---|---|
| `--bg` / `--bg2` | #f3f6fa / #e6edf6 | sayfa zemini / ikincil zemin (düğme, seçili satır) |
| `--panel` / `--panel-solid` | rgba(255,255,255,.94) / #ffffff | panel, kart |
| `--ink` / `--muted` | #14243a / #4b5e76 | metin (15,6:1) / ikincil metin (≥5,6:1) |
| `--line` / `--line-soft` | #788aa1 / #d3dce7 | kenarlık ≥3:1 (düğme, kart) / ayırıcı (tablo satırı) |
| `--accent` / `--accent-ink` / `--accent-soft` | #1d5fae / #ffffff / rgba(29,95,174,.14) | vurgu, etkin düğme, seçili / vurgu üstü metin (6,4:1) / yumuşak vurgu zemini |
| `--cool` | #1a569e | bağlantı |
| `--good-edge` | #2c7d57 | yalnızca "tamamlandı" çerçevesi |
| `--err` | #a8321c | hata metni |
| `--warn-bg` / `--warn-line` | #fff6de / #9a7300 | uyarı kutusu |
| `--seq1..4` | #4a8dca #2f72b5 #1d5596 #0f3263 | D paleti: yakın → uzak (tek yönlü; common.jsx D_STOPS bunları okur) |
| `--nodata` | #8a94a3 | "Veri eksik" rengi |
| `--globe-ocean` / `--globe-land` / `--globe-coast` / `--map-bg` | #d3e3f2 / #ede9df / #6f839b / #d3e3f2 | küre ve 2D harita |
| `--scene-top` / `--scene-bottom` | #f4f8fc / #d9e6f3 | 3D sahne degrade zemini (küre arka planı için de uygun) |
| `--t-obs` / `--t-der` / `--t-int` | #dcebfa / #e7e4f6 / #f6ecd8 | etiket zeminleri (metin --ink) |
Eğim paleti (config.js slopeColors) beyaz zeminde her renk ≥3:1: #2b4a8c #24808f #4c9a6a #968614 #cf6f26; veri yok #8a94a3, sınır konturu #14243a, rota #f4f1e6.

## AÇIK + KOYU TEMA VE YENİ ÇATI (2026-11-14) — DURUM: HAZIR, main'e oyun dalından SONRA
Bitti (her faz ayrı commit): (1) tema sistemi + güneş/ay anahtarı (f3487d9); (2) üst çubuk + sol yan çubuk (Ana sayfa, Raporlar, Ayarlar, Yardım), Ayarlar = yalnızca tema (Açık/Koyu/Sistem), Yardım = sözlük + Yöntem bağlantısı (d067535); (3) Görev ekranı ızgara düzeni + yükselti görünümü (aecfe7e); (5) cila: köşe 6–8 px, 1px kenarlık, cam/parlama/gölge yok, başlıklar cümle düzeni (tr.anaekran.js üzerine yazar; tr.js'e dokunulmadı).
- Görev ekranı: sol = referans paneli (ad, ürün, yükseklik aralığı, seçici) + Birimler (kaynaklı eğim limiti) + Otomatik görev; üst orta = D göstergesi; sağ = aday paneli + "Raporu aç" + Gelişmiş (kamera, günlük, mini küre); orta = araç çubuğu (Görünüm | Eğim, dikey abartı ×1/3/5, Sol ↔ sağ takas) + iki arazi + lejant; alt = değişken kartları + "Görev tamam → Rapor". useMove/useAuto/route/StationBar/StationCard mantığı aynı.
- Yükselti görünümü (features/compare/reliefTexture.js): gerçek DEM'den gölge (ışık KB, 45°) × pencere içi en düşük→en yüksek renk rampası. Ay gri, Dünya ova yeşil → kahverengi → açık, Mars kızıl-kahverengi (theme.css --relief-*). Lejant gerçek min–max (m) ve "görsel; arazi örtüsü/uydu görüntüsü değildir" notu. Eğim katmanı (slopeColors + sınır konturu) "Eğim" seçeneğinde, veri katmanı olarak duruyor.
- Doğrulandı: npm run check; iki temada Ana sayfa, Görev, Harita, Aday listesi, Yöntem, Rapor, Kart, Ayarlar, Yardım, #/game açılıyor; tema seçimi localStorage'da kalıcı, ilk boyamada titreme yok; Ay/Mars; 375 px'te taşma yok, hamburger menü; WebGL'siz yedek (Görev 2D, küre düz).
- YAPILMADI / NEDEN:
  - Harita küresi gerçekçi renk: Blue Marble NG dokusu oyun dalında henüz yok (origin/feature/oyun-3d-kure = main). Kural gereği kendim boyamadım, ikinci doku indirmedim. Doku gelince: merge et, GlobeView `texture`'ı kullan, kaynak notu "Görüntü: NASA Blue Marble NG, <ay/yıl>. Görsel amaçlıdır; analiz verisi değildir." ekle. Şimdilik küre alanına temaya uyumlu degrade zemin kondu.
  - Taslak görseller bu oturuma ulaşmadı; düzen talimattaki metinden kuruldu.
  - Görev sağ panelinde ayrı profil seçici yok: profil üst çubukta zaten var (aynı durumu iki seçici yönetmesin).
  - Tema değişince Görev ekranı yeniden kurulur, görev ilerlemesi sıfırlanır (WebGL renkleri yeniden okunur).
  - Raporlar/Ayarlar/Yardım içerikleri sonraki talimata bırakıldı (sahte özellik yok).

## DURUM: HAZIR (açık tema, a0b66ab sonrası) — main'e birleştirme oyun dalından SONRA
Doğrulandı (2026-11-14): `npm run check` temiz; Ana ekran, Görev, Harita (3D + 2D), Aday listesi, Analog Card, Yöntem, Rapor, #/game açık temada okunur; Ay ve Mars profili; 375 px'te tüm sekmelerde yatay taşma yok; WebGL'siz yedek (kara/okyanus dolgulu) çalışıyor. Kontrast: metin ≥5,6:1, kenarlık 3,0–3,3:1, eğim renkleri beyazda ≥3:1, D paletinin en açığı beyazda 3,5:1.
Bilinen: küre noktalarında kontur yok (D en açık renk açık karada 2,9:1); oyun oturumu dokulu kürede kontrast halkası ekleyecek. game.css'te kalan sabit renkler oyun oturumunun işi.

## Bitti
- **Açık tema:** theme.css değişkenleri yeniden tanımlandı; hud.css (Görev sahnesi), MapLibre (zemin, kara, kıyı, bölge, aday kenarı, seçim, etiket), common.jsx (D paleti, RangeBars SVG), 3D sahne etiketleri/iz (rigOverlay, trail) değişkene bağlandı. game.css ve oyun dosyalarına dokunulmadı.
- Faz A (önceki oturum, dc0958f): sözlük, sade dil, etiketler.
- Ortak küre geriye uyumlu genişletildi (GlobeView.jsx, globe/scene.js, globe/globe.css): `marker.color` (isteğe bağlı; yoksa `--cool`), `outlines` (GeoJSON Polygon çerçeve; WebGL'siz görünümde de çizilir), `compact` (küçük boy). Oyunun mevcut çağrıları değişmeden çalışır.
- Ana ekran (Home): Dünya küresi (profilin aday pencereleri, D rengi, 4 arama bölgesi çerçevesi) + seçili aday paneli (sıra, D [Hesaplanmış], merkez, kart/görev bağlantıları) + hedef gövde küresi (Ay: reference_moon.json pencereleri; Mars: koordinat yok, "Veri eksik" notu). Küreler ayrı parça (lazy).
- Harita sayfası: varsayılan 3D küre, "2D harita" düğmesi ile MapLibre/GIBS görünümü korunur. Sabit Türkçe metinler i18n'e taşındı. D açıklaması ortak bileşen (features/home/DLegend.jsx).
- MapView.jsx: tıklama işlevi ref ile güncel tutuluyor (profil değişince eski işlev çağrılmıyor).
- Görev ekranı (hud/Panels MiniMap): 2D tuval → küçük Dünya küresi (bölge çerçeveleri + seçili aday). Yalnızca "Gelişmiş" paneli açıkken çizilir.
- Metinler: `i18n/tr.anaekran.js`, `en.anaekran.js` (tr.js/en.js'ye 2'şer satır). App.jsx: Home'a `D` prop'u (1 satır).
- Doğrulandı (tarayıcı, 2026-11-14): Ay ve Mars profilinde ana ekran ve harita (seçim → aday kartı), 2D harita (833 pencere, hata yok), Görev, #/game, Aday listesi, Yöntem açılıyor; 375 px'te yatay taşma yok; WebGL kapalıyken düz görünüm (bölge çerçeveleriyle); konsol hatası yok. `npm run check` temiz.

- **regionLabel (site geneli):** `i18n/terms.js` → `REGIONS` ve `regionLabel(code)`. US-SW = ABD Güneybatı, ATA = Atacama, ANA = Anadolu, HAW = Hawaii; regions.geojson `name`/`n_tiles` ve STATUS.md karo sayılarıyla doğrulandı. Kodlar veri anahtarı olarak kaldı (filtre değeri, JSON). Kullanıldığı yerler: Home, HomeGlobes, markers (küre listesi), MapView (açılır kutu + bölge etiketi tam adı), ListPage (kart, tablo, filtre seçenekleri), Card, Report, Method. Oyun dosyalarına dokunulmadı: oyun oturumu `import { regionLabel } from "../../i18n/terms.js"` ile geçebilir.

- **Küre renklendirme (yalnızca görsel, veriye dayalı):** theme.css'e `--globe-ocean`, `--globe-land`, `--globe-coast`, `--nodata` (1 satır). Dünya: okyanus zemini + kara dolgusu (Natural Earth 110m GeoJSON'dan tuvale çizilen düz renk; uydu dokusu DEĞİL, yüzey dokusu eklenmedi) + kıyı çizgisi. WebGL'siz düz görünüm de kara/okyanusu çizer (eski "Kıyı çizgisi" notu artık doğru). Seçili işaretçi: ekranda sabit boyda amber halka + açık çerçeve.
- **Yeni GlobeView prop'ları (geriye uyumlu):** `marker.value` + `colorScale = {stops: [[değer, "#hex"]...], missing, label, loLabel?, hiLabel?}`. Renk önceliği: `marker.color` > ölçek (markerda `value` alanı varsa; null → `missing`). `colorScale` verilince lejant çıkar (ölçek çubuğu, "Veri eksik", seçili, okyanus/kara). colorScale'i sabit nesne ver (her çizimde yeni nesne kamerayı sıfırlar). Ana ekran ve Harita: `features/home/markers.js` `D_SCALE` (D_STOPS; D yoksa dColor(null) gri, etiket "D Veri eksik"). Oyun çağrıları değişmedi; oyun aynı ölçeği `import { D_SCALE } from "../home/markers.js"` + markerlara `value: p.D` ile kullanabilir. `createGlobe(el, {body})` ikinci argüman isteğe bağlı. Dosyalar: components/globe/{color.js, GlobeParts.jsx} yeni.

## Sırada
- PR gözden geçirme. Oyun PR'ı birleşince `git merge origin/main`.

## Varsayımlar
- Küre noktaları yalnızca dosyadaki adaylar (bölge başına en iyi 250) ve koordinatı kayıtlı referans pencereleri.
- D renk paleti `common.jsx` D_STOPS (tek yönlü). D yoksa gri (`dColor`).
- Aday/referans işaretçileri oyunun `features/game/data.js` `candMarkers`/`refMarkers` işlevlerinden türetilir (kopya yok; o dosyaya yazılmadı). Oyun bu işlevleri değiştirirse `features/home/markers.js` uyarlanmalı.

## Bilinen sorunlar / yapılmayanlar
- Yüzey dokusu: doğrulanmış küçük NASA ürünü data_inventory.csv'de yok → dokusuz küre.
- Mars işaretçisi: R2 enlem/boylamı veride yok → sahte koordinat konmadı.
- WebGL'siz düz görünümde Dünya notu "Kıyı çizgisi" der ama düz görünüm kıyı çizmez (oyunun metni; dokunulmadı).
- Küre otomatik döner (hareket azaltma tercihinde durur); sürükleyince durur.
- 2D haritada profil değiştirip tıklama gerçek fareyle denenmedi (düzeltme kodla doğrulandı).
- Rapor sayfası ve İngilizce arayüz ayrıca denenmedi.
