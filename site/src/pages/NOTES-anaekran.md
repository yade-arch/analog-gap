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
