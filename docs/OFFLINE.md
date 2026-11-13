# ANALOG GAP: çevrimdışı (internetsiz) kopya

İnternet bağlantısı olmayan bir bilgisayarda siteyi göstermek için.

## Hazır paket nerede?
`offline/analog-gap-offline/` klasörü ve `offline/analog-gap-offline.zip` (depo kökünde; boyut ~10 MB). Klasör `.gitignore` içindedir, depoya konmaz; yeniden üretmek için:

```bash
cd site
npm install
npm run offline
```

## Paketi çalıştırma (hedef bilgisayar)
1. Zip'i açın (veya klasörü kopyalayın).
2. `baslat.bat` dosyasına çift tıklayın. Tarayıcı `http://127.0.0.1:4180/` adresini açar.
   - **Node.js 20+** varsa `serve.mjs` (bağımlılıksız küçük sunucu) kullanılır.
   - Node yoksa **Python 3** ile `python -m http.server` kullanılır.
   - İkisi de yoksa birini kurmak gerekir (kurulum dosyasını önceden taşıyın).
3. Kapatmak için açılan konsol penceresinde `Ctrl+C`.

Elle: `node serve.mjs 4180` veya `python -m http.server 4180 --bind 127.0.0.1 --directory site`.

## Neden dosyaya çift tıklayarak açılmıyor?
Vite'ın modül betikleri ve veri dosyalarının (`fetch`) yüklenmesi `file://` adreslerinde tarayıcılarca engellenir. Bu yüzden yerel (yalnızca bu bilgisayardan erişilen, `127.0.0.1`) küçük bir sunucu gerekir.

## Çevrimdışı derlemede farklar
- **Dış istek yoktur:** yazı tipi, CDN, analitik yok. Harita altlığı olarak NASA GIBS uydu görüntüsü **kullanılmaz**; yalnızca paketle gelen Natural Earth 1:110m kara/kıyı çizgisi (kamu malı) gösterilir.
- Veri ve bilimsel içerik çevrimiçi sürümle aynıdır (`site/data/*`: aday dosyaları, DEM pencereleri, yöntem, envanter).
- Yöntem sayfasındaki dış kaynak bağlantıları (NASA PDS vb.) çevrimdışıyken açılmaz; bunlar yalnızca atıf içindir.
- 3B sahne için WebGL'li tarayıcı gerekir (yoksa 2D eğim görünümü açılır).

## Doğrulama notu
Çevrimdışı paket üretildiğinde yerel sunucudan açılıp tüm sayfalarda dış alan adına istek yapılmadığı denenmiştir (bkz. `STATUS.md`).
