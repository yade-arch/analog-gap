// Donanımsız geliştirme/test için döngü-içi sahte rover. Aynı protokolü konuşur; telemetri source:"mock" taşır ve GERÇEK ÖLÇÜM DEĞİLDİR.
// Hız yalnızca gösterim varsayımıdır (gerçek performans değildir).
import RoverLink from "./RoverLink.js";
import { decode, encode } from "./protocol.js";

export default class MockLink extends RoverLink {
  /** opts: { speedKmPerS = 1.6, tickMs = 50, start = {x_km:0, z_km:0} } */
  constructor(opts = {}) {
    super(opts);
    this.pos = { ...(opts.start || { x_km: 0, z_km: 0 }) }; this.heading = 0; this.rs = "idle"; this.goal = null; this.timer = 0; this.t0 = 0;
  }
  async _open() { this.t0 = Date.now(); queueMicrotask(() => this._reply({ type: "hello", name: "MockLink", source: "mock" })); }
  async _close() { clearInterval(this.timer); this.timer = 0; this.rs = "idle"; this.goal = null; }
  _reply(m) { this._onLine(encode(m).trim()); }
  _tele() { this._reply({ type: "telemetry", t_ms: Date.now() - this.t0, pos: { ...this.pos }, heading_deg: this.heading, state: this.rs, source: "mock" }); }

  // Rover tarafı: gelen satırı çözer, protokole göre yanıtlar.
  _write(line) {
    const r = decode(line.trim());
    queueMicrotask(() => {
      if (!r.ok) return this._reply({ type: "error", code: "bad_message", message: r.error });
      const { id, cmd, args } = r.msg;
      if (cmd === "goto") { this.goal = { ...args.target }; this.rs = "moving"; this._run(); }
      else if (cmd === "stop") { clearInterval(this.timer); this.timer = 0; this.goal = null; this.rs = "stopped"; this._tele(); }
      this._reply({ type: "ack", id, ok: true });
    });
  }
  _run() {
    clearInterval(this.timer); const tick = this.opts.tickMs ?? 50, v = this.opts.speedKmPerS ?? 1.6;
    this.timer = setInterval(() => {
      const dx = this.goal.x_km - this.pos.x_km, dz = this.goal.z_km - this.pos.z_km, d = Math.hypot(dx, dz), step = (v * tick) / 1000;
      this.heading = (Math.atan2(dz, dx) * 180) / Math.PI;
      if (d <= step) { this.pos = { ...this.goal }; this.goal = null; this.rs = "idle"; clearInterval(this.timer); this.timer = 0; }
      else this.pos = { x_km: this.pos.x_km + (dx / d) * step, z_km: this.pos.z_km + (dz / d) * step };
      this._tele();
    }, tick);
  }
}
