// Rover bağlantı kaydı. Şu an arayüze BAĞLI DEĞİL (iskelet); kullanım: const l = createLink("mock"); await l.open(); await l.send("goto", { target: { x_km: 1, z_km: 2 } }).
import MockLink from "./MockLink.js";
import WebSerialLink, { serialSupported } from "./WebSerialLink.js";
import WebSocketLink from "./WebSocketLink.js";

export const LINKS = { mock: MockLink, serial: WebSerialLink, websocket: WebSocketLink };

/** Hangi taşıma bu ortamda kullanılabilir. */
export const availability = () => ({ mock: true, serial: serialSupported(), websocket: typeof WebSocket !== "undefined" });

export function createLink(kind, opts) {
  const C = LINKS[kind]; if (!C) throw new Error("bilinmeyen bağlantı türü: " + kind);
  return new C(opts);
}
export { default as RoverLink } from "./RoverLink.js";
