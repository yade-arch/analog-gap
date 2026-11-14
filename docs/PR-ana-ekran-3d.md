## Ana ekranlar ve haritalar 3D küreye çevrildi (feature/ana-ekran-3d)

**Birleştirme sırası:** önce oyun PR'ı (`feature/oyun-3d-kure`), sonra bu. Bu dal oyun dalının güncel hâlini (`eaca596`) zaten içeriyor; oyun PR'ı birleşince çakışma beklenmez.

### Ne değişti
- **Ana ekran (`#/home`):** Dünya küresi: profilin aday pencereleri, arazi uzaklığına (D) göre tek yönlü renkli, 4 arama bölgesi kesikli çerçeveyle. Seçili aday paneli: sıra, D (Hesaplanmış), merkez, "görevi başlat" ve "aday kartı" bağlantıları. Hedef gövde küresi: Ay'da `reference_moon.json` pencereleri (konum + PGDA kaynak linki). Mars'ta R2'nin koordinatı veride yok, bu yüzden nokta konmadı ve "Veri eksik" yazıyor. Küreler ayrı parça olarak yükleniyor (lazy).
- **Harita (`#/map`):** varsayılan görünüm 3D küre. "2D harita" düğmesiyle MapLibre + NASA GIBS görünümü korunuyor. Sabit Türkçe metinler i18n'e taşındı. D açıklaması ortak bileşen oldu.
- **MapView.jsx:** tıklama işlevi artık ref ile tutuluyor, profil değişince eski işlev çağrılmıyor.
- **Görev ekranı mini haritası (`hud/Panels.jsx` MiniMap):** 2D tuval yerine küçük Dünya küresi (bölge çerçeveleri + seçili aday). Yalnızca "Gelişmiş" paneli açıkken çiziliyor.
- **Ortak küre, geriye uyumlu genişletme:** isteğe bağlı `marker.color`, `outlines` (GeoJSON Polygon çerçeve, WebGL'siz görünümde de çiziliyor) ve `compact` prop'ları eklendi. Oyunun mevcut çağrıları değişmeden çalışıyor (renk verilmezse `--cool` kullanılıyor).
- Bu dalda ayrıca önceki oturumun işleri var: Faz A (`dc0958f`: terms.js sözlüğü, sade dil, etiketler) ve çalışma düzeni kuralları (`0acdac4`: CLAUDE.md, docs/ISLER.md).

### Dosyalar
- Yeni: `features/home/{HomeGlobes.jsx, TargetPanel.jsx, DLegend.jsx, markers.js, home.css}`, `i18n/{tr,en}.anaekran.js`, `pages/NOTES-anaekran.md`
- Değişen (kendi alanım): `pages/Home.jsx`, `pages/MapPage.jsx`, `MapView.jsx`, `hud/Panels.jsx`, `hud.css`
- Ortak küre: `components/GlobeView.jsx` (+9/−5), `globe/scene.js` (+7/−3), `globe/globe.css` (+3)

### Paylaşılan dosyalara dokunulan satırlar (bu oturum)
- `App.jsx`: 1 satır (Home'a `D` prop'u)
- `i18n/tr.js`: +2 (import + spread)
- `i18n/en.js`: +2 (import + spread)
- `docs/ISLER.md`: +1 satır
- Faz A (önceki oturum, `dc0958f`): CLAUDE.md +14/−1, theme.css 2, tr.js 8, common.jsx 3/−2, PageIntro.jsx 12/−8, tr.pages.js 6, Card/Report/DGauge/StationCard 1'er satır, terms.js (yeni)
- `config.js`, `common.jsx` ve oyun dosyaları (`Game.jsx`, `features/game/**`) bu oturumda değişmedi.

### Varsayımlar
- Kürede yalnızca mevcut veriden gelen noktalar var: dosyadaki adaylar (bölge başına en iyi 250) ve koordinatı kayıtlı referans pencereleri. Bilinen analoglar gösterilmiyor.
- D paleti `common.jsx` D_STOPS'tan geliyor (tek yönlü). D yoksa gri.
- İşaretçiler oyunun `features/game/data.js` içindeki `candMarkers`/`refMarkers` işlevlerinden türetiliyor; kod kopyalanmadı.
- Yüzey dokusu yok: data_inventory.csv'de doğrulanmış küçük bir NASA ürünü bulunmuyor.

### Bilinen sorunlar / test edilmeyenler
- WebGL'siz düz görünümde Dünya notu "Kıyı çizgisi" diyor, ama düz görünüm kıyı çizmiyor. Bu metin oyunun; dokunulmadı.
- 2D haritada profil değiştirip gerçek fareyle tıklama denenmedi; düzeltme yalnızca kodda kontrol edildi.
- Rapor sayfası, İngilizce arayüz ve dokunmatik cihaz denenmedi.

### Doğrulama
- `npm run check` temiz (dosya < 300 satır, i18n, veri, protokol, build).
- Tarayıcı (dev, port 5181): Ay ve Mars profilinde ana ekran ve harita (seçim → aday kartı); 2D harita 833 pencereyle hatasız; Görev (mini küre), `#/game`, Aday listesi ve Yöntem açılıyor; 375 px'te yatay taşma yok; WebGL kapalıyken düz görünüm çıkıyor (bölge çerçeveleriyle); birleştirme sonrası konsolda hata yok.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
