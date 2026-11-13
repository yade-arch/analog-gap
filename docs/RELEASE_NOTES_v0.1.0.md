# ANALOG GAP v0.1.0 (2026-11-13)

İlk sürüm: NASA Space Apps Challenge 2026. Canlı: https://yade-arch.github.io/analog-gap/

## İçerik
- Ana sayfa, Görev (Karşılaştırma), Harita, Aday listesi, Analog Card, Yöntem ve Doğrulama, yazdırılabilir rapor + JSON.
- Dünya penceresi (NASADEM 30 m, 10×10 km) ile Ay (LOLA, Shackleton çevresi) / Mars (CTX DTM, Jezero) referansının yan yana 3B karşılaştırması; 6 istasyon; rover/astronot birimleri; Otomatik görev.
- Mesafe: D = ortalama(d_eğim, d_röleyf, d_pürüz.), d_k = W1 / IQR(referans); düşük = yakın. Yüzde veya güven puanı yoktur.
- Çevrimdışı paket (`npm run offline`, `docs/OFFLINE.md`), sunum metinleri (`docs/SUNUM.md`, `docs/DEMO.md`), yol haritası (`docs/ROADMAP.md`), Arduino taslakları (`docs/arduino/`, denenmedi).

## Bilinen sınırlar (özet; ayrıntı README ve Yöntem sayfası)
- **Pozitif kontrol ölçütü sağlanmadı** (medyan yüzdelik 74,5; ölçüt ≤ 20; n = 5). Yöntem "doğrulandı" denmez.
- Ay referansı 3 pencere; Mars referansı tek bölge. Mars termal "Veri eksik"; spektral kapsam dışı. Duyarlılık analizi yapılmadı.
- Astronot eğim limiti/giysi parametresi için kaynak bulunamadı (tarama yok). Rota düz çizgi; hız ve süreler Simülasyon varsayımıdır.
- `site/src/hardware` ve `docs/arduino` gerçek donanımla denenmedi.
- DOI: bekliyor (Zenodo bağlantısı kullanıcı tarafından yapılacak).

Lisans: kod ve belgeler MIT; veri ürünleri kendi koşullarında (README).