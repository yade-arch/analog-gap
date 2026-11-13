// Rover bağlantısı için ortak taban sınıf: komut/ack eşleme, olaylar, satır ayrıştırma. Alt sınıflar yalnızca taşıma katmanını yazar:
//   async _open(), async _close(), _write(line)  ve gelen her satır için this._onLine(line).
import { decode, encode } from "./protocol.js";

export const LINK_STATES = ["closed", "opening", "open", "error"];

export default class RoverLink {
  /** opts.ackTimeoutMs: ack bekleme süresi (varsayılan 3000). */
  constructor(opts = {}) { this.opts = opts; this.state = "closed"; this._h = {}; this._pending = new Map(); this._id = 0; }

  /** Olaylar: "state" (durum), "hello", "telemetry", "error" ({code,message}). Aboneliği kaldıran işlev döner. */
  on(evt, fn) { (this._h[evt] ||= new Set()).add(fn); return () => this._h[evt].delete(fn); }
  _emit(evt, data) { (this._h[evt] || []).forEach((f) => { try { f(data); } catch { /* dinleyici hatası bağlantıyı düşürmez */ } }); }
  _set(state, detail) { this.state = state; this._emit("state", { state, detail }); }

  async open() {
    if (this.state === "open" || this.state === "opening") return;
    this._set("opening");
    try { await this._open(); this._set("open"); } catch (e) { this._set("error", e.message); throw e; }
  }
  async close() {
    this._pending.forEach((p) => { clearTimeout(p.timer); p.reject(new Error("bağlantı kapandı")); }); this._pending.clear();
    try { await this._close(); } finally { this._set("closed"); }
  }

  /** Komut gönder; ack gelince çözülür, ok=false veya zaman aşımında reddedilir. */
  send(cmd, args) {
    if (this.state !== "open") return Promise.reject(new Error("bağlantı açık değil"));
    const id = this._id++, ms = this.opts.ackTimeoutMs ?? 3000;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this._pending.delete(id); reject(new Error(`ack zaman aşımı (${cmd})`)); }, ms);
      this._pending.set(id, { resolve, reject, timer });
      try { this._write(encode({ type: "cmd", id, cmd, ...(args ? { args } : {}) })); } catch (e) { clearTimeout(timer); this._pending.delete(id); reject(e); }
    });
  }

  _onLine(line) {
    const r = decode(line);
    if (!r.ok) { this._emit("error", { code: "bad_message", message: r.error }); return; }
    const m = r.msg;
    if (m.type === "ack") {
      const p = this._pending.get(m.id); if (!p) return;
      clearTimeout(p.timer); this._pending.delete(m.id);
      m.ok ? p.resolve(m) : p.reject(new Error(m.message || "komut reddedildi"));
    } else if (m.type === "telemetry" || m.type === "hello") this._emit(m.type, m);
    else if (m.type === "error") this._emit("error", { code: m.code, message: m.message });
    // "cmd" rover'dan gelmez; yok sayılır.
  }

  async _open() { throw new Error("_open uygulanmadı"); }
  async _close() {}
  _write() { throw new Error("_write uygulanmadı"); }
}
