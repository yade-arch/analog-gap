# ANALOG GAP mimarisi (kısa)

Statik site (Vite + React + three.js + MapLibre). Sunucu yok; bilimsel sayılar Python hattından gelen `site/public/data/*.json|geojson` dosyalarından okunur, tarayıcı yeni değer üretmez.

| Modül | Yer | Sözleşme |
|---|---|---|
| Planet Registry | `src/features/planet/registry.js` | `BODIES[id]`: yarıçap, yerçekimi, sıcaklık, basınç, atmosfer, uydu, yörünge (NASA Fact Sheet, URL'li), tema rengi, doku. `enabled:false` = "Yakında: veri yok". |
| Coordinates + Picking | `src/features/planet/coords.js` | `toXYZ/toLatLon` (y = kuzey, doğu +), `pick(o, d, r)` küre yerel ışını → `{lat, lon}` veya null, `surfaceKm`. Testler: `scripts/planet.test.mjs`. |
| Data Provider | `src/features/planet/providers.js`, `localScan.js` | Adapter `{id, bodies, query(body, lat, lon, data)}` → `{found, place, variables[{id, value|null, unit, source, resolution_m, kind, missingReason}]}`. `queryAll` paralel; hata yalıtılır. |
| Analysis Registry | `src/features/planet/analyses.js` | Etkin analizler `features/variables` (istasyonlar); `PLANNED` yalnızca ad + "kaynak yok". |
| Küresel durum | `src/features/world/` | Hedef (Ay/Mars) + Dünya bölgesi (adres + localStorage), olay günlüğü. |
| Görev simülasyonu | `src/features/compare`, `mission`, `units` | Sahne, birim hareketi, otomatik görev. |
| Rapor | `src/features/mission/report.js`, `pages/Report.jsx` | Yazdırılabilir + JSON. |

## Nasıl eklenir
- **Yeni cisim:** `registry.js`'e bir kayıt (Fact Sheet değerleri + kaynak URL) ve `public/data/tex/` altına doku; `data_inventory.csv`'ye satır. Verisi yoksa `enabled:false`.
- **Yeni veri kaynağı:** `providers.js` `ADAPTERS` listesine `{id, bodies, query}` ekle; değer yoksa `value:null` + `missingReason`. NASA dışıysa `source` içinde "NASA verisi değil".
- **Yeni analiz:** `features/variables/<ad>.js` (availability + compute) + `VARIABLES` satırı; `analyses.js` kaydı otomatik. Arazi uzaklığına (D) girecekse Python hattında hesaplanır, tarayıcıda değil.
