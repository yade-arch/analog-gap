// ANALOG GAP: MPU6050 eğim ölçer taslağı. docs/PROTOCOL.md §8 ile uyumlu, v0 TASLAK, gerçek cihazla denenmedi.
// Sensör yoksa/okunamıyorsa HİÇBİR değer göndermez: yalnızca bir kez error "sensor_missing" yollar.
// Kütüphaneler: Adafruit MPU6050 + Adafruit Unified Sensor + ArduinoJson 7.x (Library Manager).
// Eğim, ivmeölçerden STATİK hesaplanır (cihaz hareketsizken anlamlı); titreşim/ivmelenmede güvenilmezdir.
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

Adafruit_MPU6050 mpu;
bool sensorOk = false;
unsigned long lastSend = 0, lastTry = 0;
const unsigned long PERIOD_MS = 500;             // sensör mesaj aralığı
char line[160];
uint8_t len = 0;

void sendHello() { Serial.println(F("{\"v\":0,\"type\":\"hello\",\"name\":\"ANALOG-GAP MPU6050 egim\",\"source\":\"hardware\"}")); }
void sendAck(long id, bool ok, const char* msg = nullptr) {
  JsonDocument d; d["v"] = 0; d["type"] = "ack"; d["id"] = id; d["ok"] = ok; if (msg) d["message"] = msg;
  serializeJson(d, Serial); Serial.println();
}
void sendError(const char* code, const char* msg) {
  JsonDocument d; d["v"] = 0; d["type"] = "error"; d["code"] = code; d["message"] = msg;
  serializeJson(d, Serial); Serial.println();
}
bool initSensor() { return mpu.begin(0x68); }     // AD0 GND: 0x68; AD0 3.3V: 0x69

void handle(const char* text) {
  JsonDocument d;
  if (deserializeJson(d, text)) { sendError("bad_message", "JSON ayrışmadı"); return; }
  if (d["v"] != 0 || d["type"] != "cmd" || !d["id"].is<long>() || !d["cmd"].is<const char*>()) { sendError("bad_message", "v/type/id/cmd gecersiz"); return; }
  long id = d["id"]; const char* cmd = d["cmd"];
  if (!strcmp(cmd, "hello")) { sendHello(); sendAck(id, true); }
  else if (!strcmp(cmd, "ping")) sendAck(id, true);
  else sendAck(id, false, "bu cihaz yalnizca hello/ping destekler");
}

void setup() {
  Serial.begin(115200);
  sendHello();
  sensorOk = initSensor();
  if (!sensorOk) sendError("sensor_missing", "MPU6050 bulunamadi; deger gonderilmiyor");
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') { line[len] = 0; if (len) handle(line); len = 0; }
    else if (c != '\r') { if (len < sizeof(line) - 1) line[len++] = c; else { len = 0; sendError("bad_message", "satir cok uzun"); } }
  }
  unsigned long now = millis();
  if (!sensorOk) {                                 // 5 sn'de bir yeniden dene; başarısızsa sessiz kal (değer yok)
    if (now - lastTry > 5000) { lastTry = now; sensorOk = initSensor(); }
    return;
  }
  if (now - lastSend < PERIOD_MS) return;
  lastSend = now;
  sensors_event_t a, g, t;
  if (!mpu.getEvent(&a, &g, &t)) { sensorOk = false; sendError("sensor_missing", "MPU6050 okunamadi; deger gonderilmiyor"); return; }
  float ax = a.acceleration.x, ay = a.acceleration.y, az = a.acceleration.z;
  float pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
  float roll = atan2(ay, az) * 180.0 / PI;
  JsonDocument d; d["v"] = 0; d["type"] = "sensor"; d["sensor"] = "MPU6050"; d["t_ms"] = now;
  d["pitch_deg"] = serialized(String(pitch, 1)); d["roll_deg"] = serialized(String(roll, 1)); d["source"] = "hardware";
  serializeJson(d, Serial); Serial.println();
}