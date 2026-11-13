# docs/arduino: kullanıcı cihazı taslakları

> **Durum: TASLAK, hiçbiri gerçek cihazla denenmedi** (bu ortamda donanım yok; derleme de denenmedi). Arayüz bu cihazlara şu an bağlı değildir (`docs/ROADMAP.md` (a)). Mesajlar `docs/PROTOCOL.md` v0 ve §8 uzantılarıyla birebir aynıdır: NDJSON (satır başına bir JSON, `\n`), 115200 baud, 8N1, `"v":0`, cihaz kaynağı `"source":"hardware"`.
> **Kural:** sensör yoksa hiçbir değer gönderilmez. Bu cihazlardan gelen veri siteye eklenirse "Canlı donanım verisi (kullanıcı cihazı)" etiketiyle ayrı gösterilir; D, kart ve raporun bilimsel sayılarına karışmaz.

Ortak: Arduino IDE 2.x, kart **Arduino Uno / Nano (ATmega328P)** varsayımıyla (diğer kartlarda pin ve I²C pinleri değişir). Kütüphane: **ArduinoJson 7.x** (Araçlar → Kütüphaneleri Yönet).

## (i) `d_gostergesi/`: sensörsüz fiziksel D göstergesi
Sitedeki D değerini 5 LED'lik sıra (ve isteğe bağlı servo ibresi) olarak gösterir. Sensör yoktur; cihaz yalnızca `hello`, `ack`, `error` gönderir.

| Parça | Bağlantı |
|---|---|
| LED 1-5 anot (+) | D2, D3, D4, D5, D6 (her biri 220 Ω dirençle) |
| LED 1-5 katot (−) | GND |
| Servo (isteğe bağlı) sinyal | D9; kırmızı → 5 V (güç yetmezse harici 5 V, GND ortak); kahverengi → GND |
| USB | Bilgisayara (seri port) |

Ek kütüphane: yok (Servo Arduino ile gelir; servo yoksa `USE_SERVO = false`).
Yükleme: `d_gostergesi.ino` dosyasını aç → kart/port seç → Yükle. Seri monitörde 115200 baud, satır sonu "Yeni satır": açılışta `{"v":0,"type":"hello",...,"source":"hardware"}` görünür.
Deneme (seri monitörden gönder): `{"v":0,"type":"cmd","id":1,"cmd":"show_d","args":{"d":0.1596}}` → `ack ok:true`; 0,1596/1,2 oranı ≈ %13 → 1 LED yanar (ölçek `D_SCALE_MAX = 1.2`, sitedeki `dScaleMax` ile aynı olmalı). Geçersiz `d` → `ack ok:false` ve gösterge söner. Değer gelene kadar hiçbir LED yanmaz.
Yorum: D "düşük = referansa yakın"dır; çok LED = büyük D (uzak). LED sayısı iyi/kötü anlamı taşımaz; tek renk LED önerilir.

## (ii) `mpu6050_egim/`: MPU6050 eğim ölçer taslağı
İvmeölçerden **statik** pitch/roll (derece) yollar. Hareket/titreşim sırasında değerler güvenilmezdir; kalibrasyon yapılmamıştır; ölçüm doğruluğu iddia edilmez.

| MPU6050 modülü | Arduino Uno/Nano |
|---|---|
| VCC | 3,3 V (5 V yalnızca modülde regülatör olduğu doğrulanmışsa) |
| GND | GND |
| SDA | A4 |
| SCL | A5 |
| AD0 | GND (adres 0x68; 3,3 V'a bağlanırsa 0x69, kodda değiştir) |
| INT | bağlanmaz |

Kütüphaneler: **Adafruit MPU6050**, **Adafruit Unified Sensor**, **Adafruit BusIO** (bağımlılık olarak gelir), **ArduinoJson 7.x**.
Yükleme: `mpu6050_egim.ino` → kart/port → Yükle → seri monitör 115200. Sensör bağlıysa 500 ms'de bir:
`{"v":0,"type":"sensor","sensor":"MPU6050","t_ms":5200,"pitch_deg":3.4,"roll_deg":-1.2,"source":"hardware"}`
**Sensör yoksa** (kablo çıkık, adres yanlış): hiçbir `sensor` satırı çıkmaz; yalnızca bir `{"type":"error","code":"sensor_missing",...}` görülür, her 5 sn'de yeniden denenir.

## Güvenlik ve sınırlar
- Protokolde kimlik doğrulama yok; yalnızca kendi cihazınızı kendi bilgisayarınıza bağlayın. Web Serial'de port seçimi her zaman kullanıcıdadır.
- Pitch/roll formülü: `pitch = atan2(−ax, √(ay²+az²))`, `roll = atan2(ay, az)`; eksen yönleri modülün montajına bağlıdır.
- Bu taslaklar yeni hata kodunu (`sensor_missing`) ve yeni türleri (`show_d`, `sensor`) kullanır; `site/src/hardware/protocol.js` bunları henüz tanımaz (ROADMAP (a)).