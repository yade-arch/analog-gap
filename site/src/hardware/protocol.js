// ANALOG GAP rover bağlantı protokolü v0 (TASLAK). Ayrıntı: docs/PROTOCOL.md. Tarayıcıya özgü kod içermez (Node'da test edilir).
export const PROTO_VERSION = 0;
export const CMDS = ["hello", "ping", "goto", "stop"];
export const STATES = ["idle", "moving", "stopped", "fault"];
export const SOURCES = ["mock", "hardware"];

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const isPt = (p) => p && isNum(p.x_km) && isNum(p.z_km);

/** Ayrıştırılmış nesneyi doğrular -> { ok: true, msg } | { ok: false, error }. Bilinmeyen alanlar yok sayılır, zorunlu alanlar denetlenir. */
export function validate(m) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return { ok: false, error: "nesne değil" };
  if (m.v !== PROTO_VERSION) return { ok: false, error: `desteklenmeyen sürüm: ${m.v}` };
  switch (m.type) {
    case "cmd":
      if (!Number.isInteger(m.id) || m.id < 0) return { ok: false, error: "cmd.id tamsayı olmalı" };
      if (!CMDS.includes(m.cmd)) return { ok: false, error: `bilinmeyen cmd: ${m.cmd}` };
      if (m.cmd === "goto" && !isPt(m.args && m.args.target)) return { ok: false, error: "goto: args.target {x_km,z_km} gerekli" };
      return { ok: true, msg: m };
    case "ack":
      if (!Number.isInteger(m.id) || typeof m.ok !== "boolean") return { ok: false, error: "ack: id ve ok gerekli" };
      return { ok: true, msg: m };
    case "error":
      if (typeof m.code !== "string" || typeof m.message !== "string") return { ok: false, error: "error: code ve message gerekli" };
      return { ok: true, msg: m };
    case "hello":
      if (typeof m.name !== "string" || !SOURCES.includes(m.source)) return { ok: false, error: "hello: name ve source gerekli" };
      return { ok: true, msg: m };
    case "telemetry":
      if (!isNum(m.t_ms) || !isPt(m.pos) || !STATES.includes(m.state) || !SOURCES.includes(m.source)) return { ok: false, error: "telemetry: t_ms, pos, state, source gerekli" };
      if (m.heading_deg !== undefined && !isNum(m.heading_deg)) return { ok: false, error: "telemetry.heading_deg sayı olmalı" };
      return { ok: true, msg: m };
    default:
      return { ok: false, error: `bilinmeyen type: ${m.type}` };
  }
}

export const encode = (m) => JSON.stringify({ v: PROTO_VERSION, ...m }) + "\n";

export function decode(line) {
  let o; try { o = JSON.parse(line); } catch { return { ok: false, error: "JSON değil" }; }
  return validate(o);
}

/** Akış parçalarını satırlara böler (seri port parçalı gelir). */
export class LineSplitter {
  constructor(max = 8192) { this.buf = ""; this.max = max; }
  feed(chunk) {
    this.buf += chunk; const out = [];
    let i; while ((i = this.buf.indexOf("\n")) >= 0) { const l = this.buf.slice(0, i).trim(); this.buf = this.buf.slice(i + 1); if (l) out.push(l); }
    if (this.buf.length > this.max) this.buf = "";          // satır sonu gelmeyen bozuk akış belleği doldurmasın
    return out;
  }
}
