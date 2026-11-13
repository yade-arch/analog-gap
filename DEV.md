# DEV.md: geliştirici notları

Proje kuralları `CLAUDE.md`, durum ve kararlar `STATUS.md`, teknik şartname `SPEC.md`. Bu dosya yalnızca **nasıl çalıştırılır / nasıl genişletilir** içindir.

## Gereksinimler
- Node 20+ (geliştirmede 26.13) ve npm. Site: Vite 5 + React 18 + three + MapLibre GL.
- Veri hattı için Python 3.12 ve `.venv` (rasterio, numpy, scipy, geopandas, pyarrow, requests, pypdf, pyhdf). Siteyi çalıştırmak için **Python gerekmez**: üretilmiş veri `site/public/data` içindedir.
- WebGL'li tarayıcı (yoksa 2D eğim görünümü açılır; birim hareketi yalnızca 3D'de görünür).

## Siteyi çalıştırma
```bash
cd site
npm install
npm run dev          # geliştirme sunucusu
npm run build        # dist/ (statik; hash yönlendirme, base "./")
npm run preview -- --port 4173
npm run check        # derleme öncesi kontroller + derleme (aşağıda)
```

## Klasörler
```
data/            Python çıktıları ve kaynak kayıtları (JSON/GeoJSON/parquet)
data_raw/        ham indirmeler (repoya konmaz, yeniden indirilebilir)
scripts/         Python veri hattı (build_site_data.py -> site/public/data)
site/public/data siteye giden küçük veri (~9 MB; dem/ = 299 gerçek DEM penceresi)
site/src/
  config.js            tek yerde ayarlar (yönlendirme, renk sınıfları, hareket, kamera)
  i18n/                tr.js (tüm metinler), en.js (iskelet; eksik anahtar tr'ye düşer)
  features/variables/  değişken (istasyon) kaydı
  features/units/      birim kaydı (rover, astronot)
  features/compare/    DEM yükleme, arazi ağı, sahne (sceneRig), rota (route), katman (rigOverlay)
  features/mission/    hareket kancası (useMove), rapor
  hud/                 HUD panelleri (Fold = dar ekranda açılır/kapanır)
  hardware/            rover bağlantı iskeleti (docs/PROTOCOL.md); arayüze bağlı değil
  pages/               Home, Compare (Görev), Report, ListPage, MapPage; Card/Method src/ kökünde (Method = kapalı bölümler)
  components/          TopBar, PageIntro (+Term ipucu, Glossary), CopyPre
  features/mission/    useMove (hareket), useAuto (otomatik görev), report
  offline-kit/         çevrimdışı paketin serve.mjs ve baslat.bat dosyaları (npm run offline)
docs/            PROTOCOL.md, tasarım taslağı, ekran görüntüleri
```

## Genişletme
- **Yeni değişken/istasyon:** `features/variables/` altına tek dosya + `index.js`'e import ve `VARIABLES` satırı. Sayı üretmek için yalnızca mevcut Python sonuçlarını oku; eksik veri için satır üretme ("Veri eksik", kural 2). Etiket: `real` / `calc` / `sim`.
- **Yeni birim:** `features/units/` altına dosya + `index.js`; model `features/compare/unitModels.js` (önü +x). Eğim limiti **yalnızca** `parameters_sources.csv` kaynaklı ve `selectable_in_ui=yes` olan satırdan gelir (kural 8); limit hafızadan yazılmaz.
- **Yeni parametre:** `parameters_sources.csv` (değer, birim, kaynak linki) → `scripts/build_site_data.py` → `site/public/data/parameters_sources.json`.
- **Metin:** `i18n/tr.js`'e anahtar ekle; kodda `t("anahtar")`.
- **Veri güncelleme:** ilgili `scripts/*.py` çalıştırılır (argümansız: `.venv\Scripts\python scripts\<betik>.py`), en sonda `build_site_data.py`. İndirme betikleri `EARTHDATA_TOKEN` ortam değişkenini okur; **token hiçbir dosyaya yazılmaz**. DEM pencereleri: `scripts/export_dem_windows.py`.
- **Rover bağlantısı:** `docs/PROTOCOL.md`; `createLink("mock")` donanımsız dener.

## Kurallar (kısa)
- Dosya başına < 300 satır (`npm run check` denetler). Tekrar eden kod yok; ortak işlev ortak dosyada.
- Yalan sayı yok: ekranda görünen her sayı bir veri ürününe ya da etiketli hesaba dayanır. Hız/süre gibi gösterim değerleri "Simülasyon varsayımı" etiketli olmalı.
- Hiçbir bölge Ay/Mars'ın tam karşılığı diye sunulmaz; "keşfedilmemiş" denmez.

## `npm run check` ne yapar
`site/scripts/check.mjs` (sırayla, ilk hatada çıkış kodu 1):
1. `src/` altındaki her `.js/.jsx/.css` dosyası 300 satırı aşmıyor mu.
2. `t("...")` ile kullanılan **sabit** anahtarlar `i18n/tr.js`'de var mı (dinamik anahtarlar atlanır).
3. `public/data` içindeki JSON/GeoJSON dosyaları ayrışıyor mu; `dem/index.json` ile `.bin.gz` dosyaları eşleşiyor mu.
4. Protokol: `MockLink` ile `hello`/`ack`/`goto` telemetri varışı, hatalı mesaj reddi, parçalı satır birleştirme (Node'da, tarayıcısız).
5. `vite build`.

Kapsam dışı (yok): birim testi çerçevesi, ESLint, tarayıcı içi uçtan uca test. Görsel doğrulama elle yapıldı (puppeteer-core + Edge, SwiftShader; betik repoda değil).

## Bilinen sınırlar
Ayrıntı `STATUS.md` ve `data/limitations.json`. Paket 1,5 MB (three + maplibre tek parça).
