// Oyuncu kontrollü rover. Yükseklik yalnızca DEM'den; veri boşluğuna girilmez. Yerel eğim kaynaklı limiti
// (parameters_sources.json) aşarsa güçlendirici olmadan dik yöne gidilmez; güçlendirici yakıt harcar ve sağlamlığı azaltır.
// Pil/yakıt/sağlamlık/hız oyun mekaniğidir (Simülasyon varsayımı), gerçek rover performansı değildir.
import { rover as roverModel } from "./voxel.js";

export const ROVER_SCALE = 0.32;
export const KEYMAPS = {
  solo: { up: ["w", "arrowup"], down: ["s", "arrowdown"], left: ["a", "arrowleft"], right: ["d", "arrowright"], boost: ["shift", " "] },
  p1: { up: ["w"], down: ["s"], left: ["a"], right: ["d"], boost: ["shift"] },
  p2: { up: ["arrowup"], down: ["arrowdown"], left: ["arrowleft"], right: ["arrowright"], boost: ["enter", "0"] },
};
const VMAX = 0.7, BOOST = 1.6, TURN = 1.9;              // km/sn (ekran), rad/sn

export function createRover(tv, limitDeg, map = KEYMAPS.solo, accent) {
  const obj = roverModel(accent); obj.scale.setScalar(ROVER_SCALE);
  const s = { x: tv.start?.x ?? 0, z: tv.start?.z ?? 0, heading: 0, v: 0, battery: 100, fuel: 100, health: 100 };
  const place = () => {
    const y = tv.height(s.x, s.z);
    obj.position.set(s.x, Number.isNaN(y) ? obj.position.y : y, s.z); obj.rotation.y = s.heading;
  };
  place(); tv.add(obj);

  /** Command mode: turn the queue's first goal into virtual key presses. avoid: probe ahead and steer around ground steeper than the limit. */
  function autoKeys(a) {
    const out = new Set(), g = a.queue?.[0];
    if (a.stop || !g) return out;
    if (Math.hypot(g.x - s.x, g.z - s.z) < 0.3) { a.queue.shift(); a.reached?.(g); return out; }
    let want = Math.atan2(-(g.z - s.z), g.x - s.x);
    if (a.avoid && limitDeg) {
      const steepAt = (h) => [0.35, 0.7].some((r) => tv.slopeAt(s.x + Math.cos(h) * r, s.z - Math.sin(h) * r) > limitDeg);
      if (a.detour && performance.now() < a.detour.until) want += a.detour.off;
      else if (steepAt(want)) {
        const off = [0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6].find((o) => !steepAt(want + o));
        if (off !== undefined) { a.detour = { off, until: performance.now() + 900 }; want += off; }
      }
    }
    const diff = Math.atan2(Math.sin(want - s.heading), Math.cos(want - s.heading));
    if (diff > 0.06) out.add("a"); else if (diff < -0.06) out.add("d");
    if (Math.abs(diff) < 1.1) out.add("w");
    return out;
  }

  return {
    obj, stats: s,
    /** keys: Set -> engel olayı ("steep" | "nodata" | null). ctl (rescue): { auto: komut kuyruğu | null, mods: { speed, drain, wear } } */
    update(dt, keys, ctl) {
      if (ctl?.auto) keys = autoKeys(ctl.auto);
      const m = ctl?.mods || {};
      const on = (a) => a.some((k) => keys.has(k));
      const thr = (on(map.up) ? 1 : 0) - (on(map.down) ? 1 : 0), turn = (on(map.left) ? 1 : 0) - (on(map.right) ? 1 : 0);
      const boost = on(map.boost) && s.fuel > 0;
      s.heading += turn * TURN * dt * (thr < 0 ? -1 : 1);
      const vmax = (m.speed ?? 1) * (boost ? BOOST : VMAX) * (s.battery > 0 ? 1 : 0.4) * (0.5 + s.health / 200);
      s.v += (thr * vmax - s.v) * Math.min(1, dt * 3);
      let blocked = null;
      if (Math.abs(s.v) > 0.01) {
        const nx = s.x + Math.cos(s.heading) * s.v * dt, nz = s.z - Math.sin(s.heading) * s.v * dt;
        const ny = tv.height(nx, nz), slope = tv.slopeAt(nx, nz), here = tv.slopeAt(s.x, s.z);
        const steep = limitDeg && slope > limitDeg && !(slope < here);
        if (Number.isNaN(ny)) blocked = "nodata";
        if (blocked) s.v = 0;
        else {
          if (steep && !boost) { s.v = Math.sign(s.v) * Math.min(Math.abs(s.v), vmax * 0.45); blocked = "steep"; }   // too steep: capped crawl (warning), Shift climbs faster
          const k = steep && !boost ? 0.6 : 1, mx = s.x + (nx - s.x) * k, mz = s.z + (nz - s.z) * k;
          const d = Math.hypot(mx - s.x, mz - s.z); s.x = mx; s.z = mz;
          if (steep && !boost) s.health = Math.max(0, s.health - d * 2 * (m.wear ?? 1));
          s.battery = Math.max(0, s.battery - d * 1.5 * (m.drain ?? 1));
          if (boost) { s.fuel = Math.max(0, s.fuel - d * 6); if (steep) s.health = Math.max(0, s.health - d * 4 * (m.wear ?? 1)); }
        }
      }
      obj.userData.tick?.(dt, Math.abs(s.v) > 0.05, s.v);
      place();
      return blocked;
    },
    near(p, r = 0.6) { return p && Math.hypot(p.x - s.x, p.z - s.z) < r; },
    dist(p) { return Math.hypot(p.x - s.x, p.z - s.z); },
  };
}
