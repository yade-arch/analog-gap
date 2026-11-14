// Oyuncu kontrollü rover (Dünya analog arazisi). Model: mevcut şematik model (features/compare/unitModels), gerçek araç modeli değil.
// Kurallar: yükseklik yalnızca DEM'den; veri boşluğuna girilmez; yerel eğim kaynaklı limiti aşıyorsa (parameters_sources.json)
// daha dik yöne ilerlenmez. Hız bir gösterim değeridir (Simülasyon varsayımı).
import { MODELS } from "../../compare/unitModels.js";

export const ROVER_SCALE = 0.35;
const VMAX = 0.9, TURN = 1.9;                         // km/sn ve rad/sn: ekran gösterimi, gerçek performans değil

export function createRover(tv, limitDeg) {
  const obj = MODELS.rover(); obj.scale.setScalar(ROVER_SCALE);
  const s = { x: tv.start?.x ?? 0, z: tv.start?.z ?? 0, heading: 0, v: 0 };
  let blocked = null;
  const place = () => {
    const y = tv.height(s.x, s.z);
    obj.position.set(s.x, Number.isNaN(y) ? obj.position.y : y, s.z);
    obj.rotation.y = s.heading;
  };
  place(); tv.add(obj); tv.follow(obj);

  return {
    obj,
    get pos() { return { x: s.x, z: s.z }; },
    /** keys: Set ("w","a","s","d"); -> engel olayı ("steep" | "nodata" | null) */
    update(dt, keys) {
      const thr = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0), turn = (keys.has("a") ? 1 : 0) - (keys.has("d") ? 1 : 0);
      s.heading += turn * TURN * dt * (thr < 0 ? -1 : 1);
      s.v += (thr * VMAX - s.v) * Math.min(1, dt * 3);
      blocked = null;
      if (Math.abs(s.v) > 0.01) {
        const nx = s.x + Math.cos(s.heading) * s.v * dt, nz = s.z - Math.sin(s.heading) * s.v * dt;
        const ny = tv.height(nx, nz), slope = tv.slopeAt(nx, nz), here = tv.slopeAt(s.x, s.z);
        if (Number.isNaN(ny)) blocked = "nodata";
        else if (limitDeg && slope > limitDeg && !(slope < here)) blocked = "steep";
        if (blocked) s.v = 0; else { s.x = nx; s.z = nz; }
      }
      obj.userData.tick?.(dt, Math.abs(s.v) > 0.05);
      place();
      return blocked;
    },
    near(p, r = 0.6) { return p && Math.hypot(p.x - s.x, p.z - s.z) < r; },
  };
}
