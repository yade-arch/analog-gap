# Emergency Analog Mission — çalışma notları

Dal: `feature/emergency-analog-mission`. Rota: `#/game`.

## Bitti
- Paylaşılan dosyalara minimum satır: config.js (ROUTES +1), App.jsx (+2), i18n/tr.js (+2), i18n/en.js (+2).
- Tarayıcıda doğrulandı (Ay SUIT1 başarılı, Mars SUIT2 riskli, HAW termal Veri eksik, süre doldu, 375 px taşma yok).
- Aşama 1–6: Brifing, Harita keşfi (MapView yeniden kullanıldı), 3 rover testi, kıyafet, sayaç, sonuç.
- Dosyalar: pages/Game.jsx, features/game/*, game.css, i18n/tr.game.js, en.game.js.

## Sırada
- PR açıldı; gözden geçirme bekleniyor.

## Varsayımlar (PR'a da yazıldı)
- Süre/maliyet/kıyafet değerleri `rules.js` içinde, hepsi "Simülasyon varsayımı"; RulesPanel'de görünür.
- Rover limiti: parameters_sources.json `selectable_in_ui` "yes" ile başlayan satır (Ay P01 15°, Mars P03 30° yatış).
- Termal her iki profilde risk bayrağı: Ay (LST ≠ PRP, doğrulanamaz), Mars (Veri eksik).
- Eğim testi yalnızca P50/P90'dan kesin bant (%10'dan az / %10–50 / %50'den fazla) verir.
- "Düşük D" eşiği sabit değil: profil adaylarının alt çeyreği (veriden).
- Gösterilen adayların hepsinde D var (filtreyi geçenler); D yoksa "Veri eksik" yolu kodda mevcut.
- Haversine Card.jsx'te dışa aktarılmadığı için (dokunulmaz dosya) data.js'de küçük kopya var.
- MapView onSelect ilk çizimde yakalanıyor (MapView.jsx dokunulmaz): Game.jsx'te ref + useCallback ile sarıldı.

## Oyun 3D küre (dal: feature/oyun-3d-kure)
- (a) D'siz pencere denendi: candidates_mars.geojson'da HAW pencerelerinin D/d'si geçici olarak null yapıldı (commit edilmedi, git'ten geri alındı). CompareCard ve sonuç ekranı "Veri eksik" gösterdi, sıfır saymadı; ölçüt "Veri eksik" oldu.
- ORTAK KÜRE BU DALDA (origin'de GlobeView yoktu): site/src/components/GlobeView.jsx + components/globe/{geo.js,scene.js,globe.css}. Props: body, markers [{id,lat,lon,kind,label}], onPick(marker|{lat,lon}), selectedId, className. three + OrbitControls; WebGL yoksa düz SVG; klavye için <select>; doku yok.
- Küre metinleri i18n/tr.globe.js, en.globe.js; tr.game.js/en.game.js üzerinden yüklenir (tr.js/en.js'ye dokunulmadı).
- Aşama 1: hedef küre (Ay: reference_moon.json 3 pencere; Mars: R2 koordinatı veride yok → işaretçi yok, açıklama var). Aşama 2: Dünya küresi ↔ 2D MapView, "Küreye dön". Maliyet: mevcut inceleme maliyeti.
- UYARI: Bu klasörde başka bir oturum aynı anda çalışıyor; dc0958f "Faz A" commit'i bu dala onun tarafından atıldı (oyun işi değil).
