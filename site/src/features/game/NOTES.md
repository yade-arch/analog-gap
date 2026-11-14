# Emergency Analog Mission — çalışma notları

Dal: `feature/oyun-3d-kure`. Rota: `#/game`. main'e push YOK (ön talimattaki "birleştirme kapısı" metni kesik geldi; yalnızca bu dal). main'e almak için kullanıcının "main'e al" demesi gerekir.

## Mimari (3D oyun, 2026-11-14)
- `pages/Game.jsx`: aşama makinesi menu → intro → explore → drive → suit → result; Esc/II = duraklat (saat durur).
- `features/game/GameView.jsx`: sahne köprüsü. `engine/stage.js` tek renderer + iki görünüm (scissor), yarım ekran div'lerde OrbitControls.
- `engine/planetView.js`: dokulu küre + güneş + atmosfer (Dünya mavi, Mars ince kızıl, Ay yok), işaretçiler (hot = öncelikli seçim), uçuş.
- `engine/terrainView.js`: yalnızca gerçek DEM (features/compare buildTerrain/sampleH/layout), dikey abartı 2×, test noktaları = layout() istasyonları.
- `engine/rover.js`: WASD sürüş; veri boşluğuna girmez; yerel eğim > kaynaklı limit (parameters_sources.json) ise dik yöne gitmez.
- `script.js`: diyaloglar ve tek cümlelik nitel test sonuçları (ekranda sayı yok). `Hud.jsx`, `Menus.jsx`, `useKeys.js`.
- Korunan bilimsel mantık: `rules.js`, `data.js` (Ela'nın ana ekranı candMarkers/refMarkers kullanıyor), `useClock.js`.
- Eski panel bileşenleri silindi (StageBrief/Scout/Tests/Suit/Result, CompareCard, Tests, RulesPanel, TargetGlobe).
- GlobeView (ortak küre) oyunda artık kullanılmıyor; Ela'nın ana ekranı kullanıyor, değiştirilmedi.

## Dokular (data_inventory.csv T1–T4, site/public/data/tex, toplam 1,1 MB)
- T1 Dünya BMNG topo+bati Aralık 2004 (assets.science.nasa.gov) 2048×1024.
- T2/T3 Ay SVS 4720 CGI Moon Kit LROC renk + LOLA 8 bit kabartma.
- T4 Mars USGS Viking renkli küresel mozaik 925 m (overview yok; 1024 satır uzaktan okunup küçültüldü).
- Küçültme rasterio ile (.venv), blok ortalama, JPEG q85. Yön kontrolü: Mars'ta Olympus Mons ~−134°, Ay'da yakın yüz ortada.

## Biten (A, B, C, D-sade) — tarayıcıda Ay ve Mars ile doğrulandı
- A: tam ekran (Fullscreen API, reddedilirse alanı doldurur), TopBar/footer yalnızca #/game'de gizli, açık renkli başlangıç + duraklatma menüsü, rapor bağlantısı (#/report/<id>/<profil>), Kaynaklar.
- B: ikili 3D (sol Dünya, sağ Ay/Mars), sürükle/yakınlaş, adaya uçuş; DEM'i olan aday parlak ve öncelikli seçilir; DEM yoksa "Bu bölge için arazi verisi yok".
- C: rover sürüşü, 3 test noktası (sıcaklık/eğim/yüzey; maliyet rules.js), ekipman seçimi sahnede (astronot boyu/rengi), sonuç konuşması + rapor/yeniden oyna; süre bitişi.
- D (sade): hedef küreye kamera yaklaşması → referans DEM'e alçalma → astronot konuşma balonları (3 replik) → bölünmüş ekran.
- Test: Ay (ATA, eğim testi, SUIT 1 → başarılı), Mars (ATA, sıcaklık testi "Mars verisi yok", SUIT 2 → riskli), duraklatma + Kaynaklar, 375 px taşma yok, diğer sekmeler açılıyor.

## Yapılmayanlar ve nedenleri
- Uzay aracı, roket yolculuğu ve iniş animasyonu: lisansı doğrulanmış glTF model eklenmedi (süre). Kamera sinematiğiyle sade bırakıldı.
- Gerçek astronot/rover glTF modelleri: eklenmedi; mevcut şematik modeller kullanılıyor, Kaynaklar'da "şematik" yazıyor.
- Bulut katmanı: doğrulanmış NASA bulut dokusu indirilemedi (Visible Earth eski adresi zaman aşımı) → yok.
- Yakın arazide görüntü dokusu yok (küre dokuları 10 km pencerede ~1 piksel); tek renk gölgeleme.
- Astronotun yürümesi/animasyonları, Dünya'da ayrı yaya karakter, karakter değiştirme: yapılmadı (öncelik C).
- Multiplayer: yok (statik site, sunucu yok; sahte düğme konmadı). Durum Game.jsx'te sade nesnelerde (sel, done, suit); ileride serileştirilebilir.
- Mars küresinde referans işaretçisi yok (R2 koordinatı veride yok); intro Mars'ta koordinatsız genel görünüme yaklaşır.
- WebGL'siz tarayıcı: oyun başlamaz, menü rapora/siteye yönlendirir (eski 2D yedek oyun akışı kaldırıldı). Denenmedi.
- Gerçek dokunmatik cihaz denenmedi (ped yalnızca pointer: coarse cihazlarda çıkar).

## Sırada
- Uzay aracı/astronot glTF (NASA 3D Resources, lisans + CREDITS), bulut dokusu, astronot yürüyüşü.

## Durum 2026-11-14
- main'e girildi (11d67fa); Pages yayını başarılı, site ve dokular 200.
- Yapılmayanlar: uzay aracı/iniş, gerçek glTF modeller, bulut, astronot yürüyüşü, multiplayer (ayrıntı yukarıda).
- Sıradaki: NASA 3D Resources glTF (lisans + CREDITS), bulut dokusu, astronot animasyonu.
