# ANALOG GAP rover bağlantı protokolü (v0, TASLAK)

> **Durum:** Bu protokol bu projede tasarlanmıştır; bir NASA, ESA veya donanım standardı **değildir**. Yalnızca `MockLink` ile
> (döngü-içi, `npm run check` içinde) sınandı. `WebSerialLink` ve `WebSocketLink` **gerçek donanım veya sunucuyla denenmedi**.
> Arayüz (`site/src/pages`, `hud`) bu katmanı **şu an kullanmaz**; sahne hareketi `features/mission/useMove.js` ile ekranda simüle edilir.

Kod: `site/src/hardware/` (`protocol.js` doğrulayıcı, `RoverLink.js` taban, `MockLink.js`, `WebSerialLink.js`, `WebSocketLink.js`, `index.js`).

## 1. Taşıma
| Taşıma | Çerçeveleme | Not |
|---|---|---|
| Web Serial | **NDJSON**: her mesaj tek satır JSON, `\n` ile biter (UTF-8, en çok 8192 bayt/satır) | Chromium tabanlı tarayıcı, güvenli bağlam (https veya localhost), kullanıcı hareketi (düğme tıklaması) şart. Port seçimini kullanıcı yapar. Varsayılan 115200 baud, 8N1. |
| WebSocket | Her **metin** çerçevesi bir JSON mesajı (satır sonu isteğe bağlı) | https sayfasından yalnızca `wss://`; `ws://` yalnızca yerel geliştirme. İkili çerçeve yok sayılır. |
| Mock | Bellek içi, aynı satırlar | Donanım gerekmez. |

## 2. Ortak alanlar
Her mesajda `v` (tamsayı, protokol sürümü, şimdilik `0`) ve `type` bulunur. Sürüm uyuşmazsa mesaj reddedilir (`bad_message`).
Bilinmeyen ek alanlar yok sayılır; zorunlu alan eksikse mesaj reddedilir.

**Koordinat çerçevesi:** pencere yerel çerçevesi, **km**; başlangıç noktası 10×10 km pencerenin merkezi, `x` ızgara sütunu yönünde (sahnede sağ), `z` ızgara satırı yönünde (sahnede öne/güney). Yönler harita projeksiyonuna bağlıdır; coğrafi kuzeye hizalı **değildir**. Yükseklik protokolde yoktur (yüzeyi arayüz DEM'den örnekler).
**Açı:** `heading_deg`, +x ekseninden +z yönüne derece.
**Zaman:** `t_ms`, bağlantı açıldığından beri milisaniye (rover saati; UTC değil).

## 3. Ana bilgisayar → rover
```json
{"v":0,"type":"cmd","id":7,"cmd":"goto","args":{"target":{"x_km":1.5,"z_km":-2.0}}}
```
| `cmd` | `args` | Anlam |
|---|---|---|
| `hello` | yok | Rover kendini tanıtır (`hello` mesajı + `ack`). |
| `ping` | yok | Yalnızca `ack`. |
| `goto` | `target: {x_km, z_km}` | Hedefe düz gidiş başlat. Rota planlaması rover'ın işidir; protokol rotayı taşımaz. |
| `stop` | yok | Hareketi durdur (`state: "stopped"`). |

`id`: ana bilgisayarın verdiği negatif olmayan tamsayı; her komuta **bir** `ack` döner.

## 4. Rover → ana bilgisayar
```json
{"v":0,"type":"ack","id":7,"ok":true}
{"v":0,"type":"ack","id":7,"ok":false,"message":"hedef pencere dışında"}
{"v":0,"type":"error","code":"bad_message","message":"cmd.id tamsayı olmalı"}
{"v":0,"type":"hello","name":"MockLink","source":"mock"}
{"v":0,"type":"telemetry","t_ms":1200,"pos":{"x_km":0.4,"z_km":-0.9},"heading_deg":-66.0,"state":"moving","source":"mock"}
```
- `ack.ok=false` komutu reddeder; `message` isteğe bağlı açıklamadır. Ana bilgisayar 3 sn (ayarlanabilir) içinde `ack` görmezse zaman aşımı sayar.
- `error`: komuta bağlı olmayan hata (`code` makine okur, `message` insan okur). Tanımlı kod: `bad_message`.
- `telemetry.state`: `idle | moving | stopped | fault`. `heading_deg` isteğe bağlı.
- `source`: **`mock` veya `hardware`**. Arayüz `mock` telemetrisini asla "Gerçek ölçüm" diye etiketlemez (proje kuralı 4); yalnızca `hardware` kaynaklı değer Gerçek ölçüm olabilir ve o da hangi sensörden geldiği belgelenmeden sayısal sonuç olarak sunulmaz.

## 5. Durum makinesi (bağlantı)
`closed → opening → open → closed`, hata durumunda `error`. `RoverLink` olayları: `state`, `hello`, `telemetry`, `error`.

## 6. Güvenlik ve sınırlar
- Web Serial/WebSocket izni kullanıcıdandır; protokol kimlik doğrulama içermez. Ağ üzerinden kullanımda `wss://` ve sunucu tarafı doğrulama gerekir.
- Hız, ivme ve eğim limiti denetimi rover/sunucu tarafındadır; bu protokol güvenlik denetimi sağlamaz. Eğim limitleri arayüzde yalnızca `parameters_sources.csv` kaynaklı satırlardan gelir.
- Gösterim hızı (`MockLink.speedKmPerS`) bir **Simülasyon varsayımıdır**; gerçek performans değildir.

## 7. Sürümleme
Geriye uyumsuz değişiklikte `v` artırılır. v0 kararlı değildir; alanlar değişebilir.
