// Web Serial taşıma katmanı (İSKELET): satır sonlu JSON (NDJSON). Chromium tabanlı tarayıcı, güvenli bağlam (https/localhost) ve
// kullanıcı hareketi (düğme tıklaması) gerekir. Gerçek donanımla DENENMEDİ.
import RoverLink from "./RoverLink.js";
import { LineSplitter } from "./protocol.js";

export const serialSupported = () => typeof navigator !== "undefined" && "serial" in navigator;

export default class WebSerialLink extends RoverLink {
  /** opts: { baudRate = 115200, filters = [] (usbVendorId/usbProductId) } */
  async _open() {
    if (!serialSupported()) throw new Error("Web Serial bu tarayıcıda yok");
    this.port = await navigator.serial.requestPort({ filters: this.opts.filters || [] });   // kullanıcı seçer; izin tarayıcıdadır
    await this.port.open({ baudRate: this.opts.baudRate || 115200 });
    this.writer = this.port.writable.getWriter(); this.enc = new TextEncoder();
    this._readLoop();
  }
  async _readLoop() {
    const dec = new TextDecoder(), split = new LineSplitter(); this.reader = this.port.readable.getReader();
    try {
      for (;;) { const { value, done } = await this.reader.read(); if (done) break; split.feed(dec.decode(value, { stream: true })).forEach((l) => this._onLine(l)); }
    } catch (e) { this._emit("error", { code: "serial_read", message: e.message }); }
    finally { this.reader.releaseLock(); }
  }
  _write(line) { this.writer.write(this.enc.encode(line)); }
  async _close() {
    try { await this.reader?.cancel(); } catch { /* zaten kapalı */ }
    try { this.writer?.releaseLock(); await this.port?.close(); } catch { /* zaten kapalı */ }
  }
}
