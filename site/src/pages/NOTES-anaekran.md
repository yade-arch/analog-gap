# Ana ekranlar ve 3D küre: çalışma notları

Dal: `feature/ana-ekran-3d`. Oyun dalı: `feature/oyun-3d-kure` (ortak küre oradan geldi). Birleştirme sırası: önce oyun PR'ı, sonra bu dal.

## Bitti
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
