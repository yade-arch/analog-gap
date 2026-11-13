// ANALOG GAP: fiziksel D göstergesi (SENSÖRSÜZ). docs/PROTOCOL.md §8 ile uyumlu, v0 TASLAK, gerçek cihazla denenmedi.
// Ana bilgisayar satır başına bir JSON gönderir:  {"v":0,"type":"cmd","id":3,"cmd":"show_d","args":{"d":0.1596}}
// Cihaz yalnızca hello, ack ve error gönderir; hiçbir ölçüm değeri üretmez (sensör yok).
// Kütüphane: ArduinoJson 7.x (Library Manager). İsteğe bağlı: Servo (Arduino'nun kendi kütüphanesi).
#include <ArduinoJson.h>
#include <Servo.h>

const uint8_t LED_PINS[] = {2, 3, 4, 5, 6};      // 5 LED, her biri 220 ohm direnç üzerinden GND'ye
const uint8_t N_LED = sizeof(LED_PINS);
const uint8_t SERVO_PIN = 9;                      // isteğe bağlı servo (sinyal); kullanmazsanız USE_SERVO = false
const bool USE_SERVO = true;
const float D_SCALE_MAX = 1.2;                    // site/src/config.js dScaleMax ile aynı olmalı
Servo needle;
char line[256];
uint8_t len = 0;

void sendHello() { Serial.println(F("{\"v\":0,\"type\":\"hello\",\"name\":\"ANALOG-GAP D gostergesi\",\"source\":\"hardware\"}")); }
void sendAck(long id, bool ok, const char* msg = nullptr) {
  JsonDocument d; d["v"] = 0; d["type"] = "ack"; d["id"] = id; d["ok"] = ok; if (msg) d["message"] = msg;
  serializeJson(d, Serial); Serial.println();
}
void sendError(const char* code, const char* msg) {
  JsonDocument d; d["v"] = 0; d["type"] = "error"; d["code"] = code; d["message"] = msg;
  serializeJson(d, Serial); Serial.println();
}
void clearDisplay() { for (uint8_t i = 0; i < N_LED; i++) digitalWrite(LED_PINS[i], LOW); if (USE_SERVO) needle.write(0); }
void showD(float dv) {                            // D büyüdükçe daha çok LED yanar (büyüklük göstergesi; iyi/kötü anlamı yok)
  float f = constrain(dv / D_SCALE_MAX, 0.0, 1.0);
  uint8_t on = (uint8_t)(f * N_LED + 0.5);
  for (uint8_t i = 0; i < N_LED; i++) digitalWrite(LED_PINS[i], i < on ? HIGH : LOW);
  if (USE_SERVO) needle.write((int)(f * 180.0));
}

void handle(const char* text) {
  JsonDocument d;
  if (deserializeJson(d, text)) { sendError("bad_message", "JSON ayrışmadı"); return; }
  if (d["v"] != 0 || d["type"] != "cmd" || !d["id"].is<long>() || !d["cmd"].is<const char*>()) { sendError("bad_message", "v/type/id/cmd gecersiz"); return; }
  long id = d["id"]; const char* cmd = d["cmd"];
  if (!strcmp(cmd, "hello")) { sendHello(); sendAck(id, true); }
  else if (!strcmp(cmd, "ping")) sendAck(id, true);
  else if (!strcmp(cmd, "stop")) { clearDisplay(); sendAck(id, true); }
  else if (!strcmp(cmd, "show_d")) {
    JsonVariant v = d["args"]["d"];
    if (!v.is<float>() || v.as<float>() < 0) { clearDisplay(); sendAck(id, false, "d sayi olmali (>=0)"); }
    else { showD(v.as<float>()); sendAck(id, true); }
  } else sendAck(id, false, "bilinmeyen cmd");
}

void setup() {
  for (uint8_t i = 0; i < N_LED; i++) pinMode(LED_PINS[i], OUTPUT);
  if (USE_SERVO) needle.attach(SERVO_PIN);
  clearDisplay();                                  // değer gelene kadar hiçbir şey göstermez
  Serial.begin(115200);
  sendHello();
}
void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') { line[len] = 0; if (len) handle(line); len = 0; }
    else if (c != '\r') { if (len < sizeof(line) - 1) line[len++] = c; else { len = 0; sendError("bad_message", "satir cok uzun"); } }
  }
}