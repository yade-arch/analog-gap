# Ana ekranlar ve 3D küre: çalışma notları

Dal: `feature/ana-ekran-3d`. Oyun dalı: `feature/oyun-3d-kure` (ortak küre oradan geldi). Birleştirme sırası: önce oyun PR'ı, sonra bu dal.

## Bitti
- Faz A (önceki oturum, dc0958f): sözlük, sade dil, etiketler.
- Ortak küre geriye uyumlu genişletildi: `marker.color` (isteğe bağlı), `outlines` (GeoJSON Polygon çerçeve), `compact` (küçük boy). Eski çağrılar değişmeden çalışır (renk yoksa `--cool`).
- Ana ekran (Home): Dünya küresi (profilin aday pencereleri, D rengi, 4 arama bölgesi çerçevesi) + seçili aday paneli + hedef gövde küresi (Ay: reference_moon.json pencereleri; Mars: koordinat yok, "Veri eksik" notu). Küreler ayrı parça (lazy).
- Metinler: `i18n/tr.anaekran.js`, `en.anaekran.js` (tr.js/en.js'ye 2'şer satır).

## Sırada
- Harita sayfası: 3D küre varsayılan, 2D harita seçeneği; sabit metinler i18n'e; MapView onSelect ref düzeltmesi.
- Görev ekranı mini haritası (hud/Panels MiniMap) → küçük küre.
- Tarayıcı denemesi (Ay/Mars, #/game, diğer sekmeler, 375 px, WebGL yok).

## Varsayımlar
- Küre noktaları yalnızca dosyadaki adaylar (bölge başına en iyi 250) ve koordinatı kayıtlı referans pencereleri.
- D renk paleti `common.jsx` D_STOPS (tek yönlü). D yoksa gri (`dColor`).
- Aday işaretçileri oyunun `features/game/data.js` `candMarkers`/`refMarkers` işlevlerinden türetilir (kopya yok; o dosyaya yazılmadı).

## Yapılmayanlar
- Yüzey dokusu: doğrulanmış küçük NASA ürünü data_inventory.csv'de yok → dokusuz küre.
- Mars işaretçisi: R2 enlem/boylamı veride yok → sahte koordinat konmadı.
