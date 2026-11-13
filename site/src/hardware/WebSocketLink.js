// WebSocket taşıma katmanı (İSKELET): her metin çerçevesi bir JSON mesajı (satır sonu gerekmez). Gerçek sunucu/donanımla DENENMEDİ.
// https sayfasından yalnızca wss:// açılabilir (tarayıcı karışık içeriği engeller); ws:// yalnızca yerel geliştirmede.
import RoverLink from "./RoverLink.js";

export default class WebSocketLink extends RoverLink {
  /** opts: { url: "ws://localhost:8765" } */
  _open() {
    const url = this.opts.url || "";
    if (!/^wss?:\/\//.test(url)) return Promise.reject(new Error("url ws:// veya wss:// ile başlamalı"));
    if (url.startsWith("ws://") && typeof location !== "undefined" && location.protocol === "https:") return Promise.reject(new Error("https sayfasında ws:// kullanılamaz; wss:// gerekli"));
    return new Promise((resolve, reject) => {
      const ws = (this.ws = new WebSocket(url));
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("WebSocket açılamadı"));
      ws.onmessage = (e) => typeof e.data === "string" && e.data.split("\n").forEach((l) => l.trim() && this._onLine(l.trim()));
      ws.onclose = () => { if (this.state === "open") this._set("closed", "sunucu kapattı"); };
    });
  }
  _write(line) { this.ws.send(line.trim()); }
  async _close() { this.ws?.close(); }
}
