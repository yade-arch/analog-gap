# ANALOG GAP: yarının yol haritası (öncelik sırasıyla)

Kurallar her madde için geçerli: mevcut siteyi bozma (`npm run check` geçmeli), uydurma sayı yok (kaynaksız değer arayüzde yok), etiketler (Gerçek ölçüm / Hesaplanmış / Simülasyon varsayımı), dosya başına < 300 satır, silme ve `push --force` yok, token yok. Her madde bitince: `npm run check`, commit, push, Actions'ın yeşil olmasını bekle. Süreler tahmindir (tek kişi + Claude Code).

## Öncelik özeti
| # | Madde | Süre | Risk |
|---|---|---|---|
| 1 | (b) Eğime duyarlı rota (ulaşılabilir / ulaşılamaz) | 3-4 sa | orta |
| 2 | (a) Arduino Web Serial adaptörü + "Donanım" paneli | 3-4 sa (+ cihaz denemesi) | orta-yüksek |
| 3 | (d) Astronot eğim limiti kaynağı arama | 1-2 sa | düşük (kaynak çıkmayabilir) |
| 4 | (c) Gölge modülü | 3-4 sa | orta |
| 5 | (e) Yeni referans/bölge ekleme | 2-3 sa (adım adım belge) | düşük |

Sıra gerekçesi: (b) CLAUDE.md'deki "Rover: DEM eğim maliyetli rota; tam" gereksinimini kapatır ve (c)'nin ön koşuludur; (a) sahada gösteri için en görünür ama donanım gerektirir; (d) yalnızca arama, hızlı; (c) ve (e) sonra.

---

## (b) Eğime duyarlı rota (ulaşılabilir / ulaşılamaz)
- **Amaç:** Rota düz çizgi yerine, birimin eğim limitini (`parameters_sources.csv`, `selectable_in_ui=yes`) aşmayan hücrelerden geçen en düşük maliyetli yol olsun; limit dışı hücreler "ulaşılamaz" gösterilsin.
- **Kabul ölçütü:** (1) Rover seçiliyken ulaşılabilir alan haritada ayrı renk/kontur; erişilemeyen istasyon için "Bu istasyona limit içinde rota yok" mesajı, değer uydurulmaz. (2) Rota DEM yüzeyine yapışık; 90 m ızgarada yeniden üretilebilir (aynı girdi aynı rota). (3) Astronot: limit kaynaksızsa hiçbir ulaşılabilirlik hesabı yapılmaz ("tarama yok" kalır). (4) Ekrandaki ulaşılabilir alan oranı etiketi "Hesaplanmış"; limit "Simülasyon varsayımı". (5) Combined (kesişim/fark) bu maddede yapılmaz, ayrı iş.
- **Dokunulacak dosyalar:** yeni `site/src/features/compare/costRoute.js` (Dijkstra/A* 8 komşu, maliyet = mesafe × eğim çarpanı, limit üstü = engel), `route.js` (`buildRoute` yerine/yanında), `features/mission/useMove.js`, `features/compare/slopeTexture.js` (limit üstü zaten çiziliyor), `hud/MovePanel.jsx`, `i18n/tr.pages.js`.
- **Süre:** 3-4 sa. **Risk:** 111×111 ızgarada hız sorunu yok; asıl risk eğim çarpanı fonksiyonunun kaynaksız seçilmesi: maliyet yalnızca mesafe + limit engeli olsun, "enerji/çaba" modeli iddia edilmesin.
- **Claude Code'a komut:**
  ```
  docs/ROADMAP.md (b) maddesini uygula: DEM 90 m ızgarasında eğim limitini aşmayan hücrelerden en kısa rota (8 komşulu A*), limit dışı hücreler ulaşılamaz. Limit yalnızca parameters_sources.json'daki kaynaklı satırdan gelsin; astronot limitsizse hesap yapma. Uydurma maliyet modeli yok. Bitince npm run check, commit, push.
  ```

## (a) Arduino Web Serial adaptörü + "Donanım" paneli
- **Amaç:** Kullanıcı kendi Arduino'sunu tarayıcıdan bağlasın; bağlıysa canlı veri "Canlı donanım verisi (kullanıcı cihazı)" etiketiyle görünsün; bağlı değilse panelde **hiç değer** olmasın. Cihaz taslakları: `docs/arduino/`.
- **Kabul ölçütü:** (1) Chromium + https/localhost'ta "Bağlan" düğmesi (kullanıcı tıklaması) port seçtirir. (2) Panel yalnızca `source:"hardware"` mesajlarını gösterir; `mock` veya bağlantı yokken boş ("Cihaz bağlı değil"). (3) Hiçbir donanım değeri D'ye, kartlara veya rapora karışmaz; raporda ayrı, etiketli bölüm. (4) Bozuk satır `bad_message` hatası olarak gösterilir, çökme yok. (5) `docs/PROTOCOL.md` §8 uzantıları (`show_d`, `sensor`) `protocol.js` doğrulayıcısına eklenir ve `npm run check`te MockLink testiyle sınanır. (6) Gerçek cihazla deneme yapılmadıysa belgede "denenmedi" yazar.
- **Dokunulacak dosyalar:** `site/src/hardware/protocol.js` (yeni tipler), `WebSerialLink.js`, `index.js`, yeni `site/src/hud/HardwarePanel.jsx`, `pages/Compare.jsx` (panel "Gelişmiş" içinde), `features/mission/report.js` (ayrı bölüm), `scripts/check.mjs` (test), `i18n/tr.pages.js`, `docs/PROTOCOL.md`.
- **Süre:** 3-4 sa kod + cihaz denemesi için ayrı zaman. **Risk:** Web Serial yalnızca Chromium; Firefox/Safari'de panel "desteklenmiyor" demeli. Güvenlik: protokolde kimlik doğrulama yok; yalnızca kullanıcının kendi cihazı.
- **Claude Code'a komut:**
  ```
  docs/ROADMAP.md (a) ve docs/PROTOCOL.md §8'e göre: protocol.js'e show_d komutu ve sensor mesajı ekle, WebSerialLink'i bağla, Gelişmiş içinde Donanım paneli yap. Bağlı değilken hiç değer gösterme; etiket "Canlı donanım verisi (kullanıcı cihazı)"; donanım verisi D/kart/rapora girmesin. check.mjs'e MockLink testi ekle. Bitince npm run check, commit, push.
  ```

## (d) Astronot eğim limiti kaynağı arama
- **Amaç:** Astronot yürüyüş eğimi (P05) ve isteğe bağlı giysi (P06) için doğrulanabilir NASA (yoksa diğer ajans) kaynağı bulmak; bulunamazsa "kaynak bekliyor" kalır.
- **Kabul ölçütü:** Her aday kaynak için: değer, birim, bağlam (Ay/Mars, giysi var/yok), bağlantı, **birebir alıntı** ve doğrulama tarihi `parameters_sources.csv` satırında; sayfa açılıp okunmadan satır eklenmez ("arama özeti" yeterli değildir). Bulunursa `selectable_in_ui=yes`, "Simülasyon varsayımı" etiketi; bulunmazsa değişiklik yok ve STATUS'a "bulunamadı" yazılır.
- **Dokunulacak dosyalar:** `parameters_sources.csv`, `scripts/build_site_data.py` (yeniden üret), `site/public/data/parameters_sources.json`, gerekirse `features/units/` (astronot limiti okuma zaten var).
- **Süre:** 1-2 sa. **Risk:** Sayfa bot engeli (403) verebilir; taklit kimlik kullanma, elle doğrulama iste. Yanlış bağlam (ör. tıbbi/EVA kısıtı ile eğim sınırını karıştırma) riski: yalnızca açıkça "eğim" diyen kaynak.
- **Claude Code'a komut:**
  ```
  parameters_sources.csv P05/P06 için NASA (yoksa ESA/JAXA) kaynaklarını ara; yalnızca sayfayı açıp birebir alıntı bulabildiğin değeri ekle (değer, birim, link, alıntı, tarih). Bulamazsan hiçbir şey ekleme, STATUS.md'ye "bulunamadı" yaz. Bulunursa build_site_data.py çalıştır, check, commit, push.
  ```

## (c) Gölge modülü (Simülasyon varsayımı)
- **Amaç:** Verilen güneş yüksekliği/azimutu için DEM'den gölge haritası; iki taraf (Ay/Mars ve Dünya) aynı koşulla karşılaştırılsın.
- **Kabul ölçütü:** (1) Girdi: güneş yükseklik ve azimut kullanıcıdan; **varsayılan değer yok** veya "Simülasyon varsayımı" etiketli açık seçim (Shackleton için gerçek ışık koşulu iddia edilmez). (2) Hesap yalnızca yatay yükseklik açısı taraması (ufuk açısı) ile; atmosfer, saçılma, çok yüksek kutup ışığı dinamiği yok. (3) Çıktı "Hesaplanmış" gölge oranı; PSR (kalıcı gölge) **iddia edilmez** (LOLA 20 m + 90 m örnekleme yetersiz). (4) Sahnede gölge dokusu eğim dokusunun üstünde açılıp kapanır.
- **Dokunulacak dosyalar:** yeni `features/compare/shadow.js` (ufuk açısı taraması), `slopeTexture.js` veya yeni doku katmanı, `hud/Panels.jsx` ("Gelişmiş" içinde güneş kontrolü), `i18n/tr.pages.js`, `docs` (sınırlar).
- **Süre:** 3-4 sa. **Risk:** "Gölge = PSR" yanlış yorumu; 90 m ızgara ince ayrıntıyı kaybeder; kutupta güneş çok alçak, sayısal kenar durumları.
- **Claude Code'a komut:**
  ```
  docs/ROADMAP.md (c): DEM'den ufuk açısıyla gölge maskesi (güneş yükseklik/azimut kullanıcı girdisi, "Simülasyon varsayımı"), Gelişmiş içinde aç/kapa. PSR iddiası yok; sınırları arayüzde yaz. Bitince npm run check, commit, push.
  ```

## (e) Yeni referans veya bölge ekleme adımları
- **Amaç:** Bir sonraki referansı (ör. yeni Ay/Mars penceresi) veya Dünya bölgesini tekrarlanabilir adımlarla eklemek; bu madde belge + küçük doğrulama betiğidir.
- **Kabul ölçütü:** `docs/EKLEME.md` şunları adım adım içerir: (1) `data_inventory.csv` satırı (kapsam, çözünürlük, birim, tarih, lisans, boyut) **önce** ve doğrulanmadan ürün kullanılmaz; (2) tek karo ile küçük test; (3) Dünya bölgesi için `scripts/tile_list.py` kaydı (UTF-8!), referans için `scripts/build_references.py`; (4) `scripts/export_dem_windows.py`, `scripts/build_site_data.py`; (5) `npm run check` (JSON, DEM dizini) ve sayı denetimi (Python çıktısı = site verisi); (6) pozitif/negatif kontrolün yeniden çalıştırılması, ölçütün sonuca göre ayarlanmaması; (7) `README`/Yöntem sayfası güncellemesi. Örnek tek karo ile uçtan uca denenmiş olmalı.
- **Dokunulacak dosyalar:** `docs/EKLEME.md` (yeni), `data_inventory.csv`, `scripts/*`, `DEV.md` (bağlantı).
- **Süre:** 2-3 sa. **Risk:** Ortak ölçek ve ön işleme kuralı (farklı uydu verisi doğrudan karşılaştırılmaz); büyük indirmeler (>200 MB) ve `EARTHDATA_TOKEN` dosyaya yazılmamalı.
- **Claude Code'a komut:**
  ```
  docs/EKLEME.md yaz: yeni referans/bölge ekleme adımları (envanter önce, tek karo testi, scripts sırası, check, kontroller). Mevcut scripts/ ve data/ dosyalarından gerçek komutlarla; uydurma yol yok. Bitince check, commit, push.
  ```

## Notlar
- Sunum metinleri: `docs/SUNUM.md`; gösteri akışı: `docs/DEMO.md`; çevrimdışı paket: `docs/OFFLINE.md`.
- Kesme sırası (süre baskısında): Mars termal, astronot giysisi, duyarlılık testi, PDF dışa aktarma. Topografya + aday üretimi + Gap paneli her durumda teslim.