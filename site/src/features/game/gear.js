// Analog field testing (2-player mode): 6 suits, 6 rover modules, hazard zones at the 3 beacons, Earth tests, survival check.
// GAME RULES (not NASA engineering data). Real inputs: beacon slope/height from the DEM, the sourced rover slope limit,
// Moon temperatures from LRO Diviner (thermal_moon.json). Mars has no temperature data here, so no thermal zone is made up.
import { SUIT_LOOK } from "./engine/voxel.js";

export const SUITS6 = {
  gold: { cover: ["hot"], look: { body: 0xd8b04a, trim: 0xfff1b0, dark: 0x6b5520, visor: 0xffcc33, light: 0xfff2a0 } },
  cryo: { cover: ["cold"], weak: ["hot"], look: { body: 0x2c55b8, trim: 0xe8f0ff, dark: 0x14285a, visor: 0x7fe0ff, light: 0x7fe0ff } },
  orange: { cover: [], fragile: true, look: { body: 0xf07a1a, trim: 0x2a2a2a, dark: 0x7a3a08, visor: 0x222222, light: 0xffb060 } },
  lead: { cover: ["hot", "boulder"], look: { body: 0x6c7078, trim: 0x3a3d44, dark: 0x2a2c30, visor: 0x111111, light: 0x9fe870 } },
  silver: { cover: ["dust"], look: { body: 0xc9ced6, trim: 0x8f96a3, dark: 0x5a606b, visor: 0x30343a, light: 0xd8f0ff } },
  carbon: { cover: ["cold", "hot"], partial: true, look: { body: 0x1a1a1c, trim: 0xf2f2f2, dark: 0x0c0c0e, visor: 0x2a2a2a, light: 0xffffff } },
};
export const MODS6 = {
  mesh: { cover: ["steep", "dust"], color: 0xb8c2d0 }, crawler: { cover: ["boulder"], color: 0x3a3a3a }, solar: { cover: [], weak: ["boulder"], color: 0x2a62d8 },
  tanks: { cover: [], color: 0xd0d6dc }, cage: { cover: ["boulder"], color: 0x8a8f96 }, lidar: { cover: ["dust"], color: 0x37e0ff },
};
Object.entries(SUITS6).forEach(([k, s]) => { SUIT_LOOK[k] = s.look; });   // 3D astronaut colours for each suit

/** Zones from the real beacon heights/slopes: lowest = shadow basin (Moon) / dust plain (Mars), highest = sunlit ridge (Moon) / boulder field (Mars),
 *  middle = boulder field (Moon) / dust plain (Mars). A beacon on ground steeper than the sourced rover limit adds "steep" (real slope). */
export function zonesOf(pts, limit, profile) {
  const ok = pts.filter((p) => p && Number.isFinite(p.h)); if (!ok.length) return [];
  const byH = [...ok].sort((a, b) => a.h - b.h), moon = profile === "moon";
  const type = (p) => (p === byH[0] ? (moon ? "cold" : "dust") : p === byH[byH.length - 1] ? (moon ? "hot" : "boulder") : moon ? "boulder" : "dust");
  return ok.map((p) => { const steep = !!limit && p.slope > limit; return { i: p.i, type: type(p), steep, slope: p.slope, hz: [type(p), ...(steep ? ["steep"] : [])] }; });
}

/** Stress (0–100) for one zone and one gear combo. 100 in any channel = failure (with the reason key). */
export function testGear(zone, suit, mod) {
  const S = SUITS6[suit], M = MODS6[mod], st = { thermal: 0, traction: 0, hull: 0 }; let why = null;
  for (const h of zone?.hz || []) {
    const ch = h === "cold" || h === "hot" ? "thermal" : h === "boulder" ? "hull" : "traction";
    let v = 100;
    if (ch === "thermal") v = S.weak?.includes(h) ? 100 : S.cover.includes(h) ? (S.partial ? 75 : 30) : 100;
    if (ch === "traction") v = M.cover.includes(h) || S.cover.includes(h) ? 30 : 100;
    if (ch === "hull") v = M.weak?.includes(h) ? 100 : M.cover.includes(h) || S.cover.includes(h) ? (S.fragile && mod !== "cage" ? 100 : 30) : 100;
    st[ch] = Math.max(st[ch], v);
    if (v >= 100 && !why) why = h;
  }
  return { ...st, ok: !why, why };
}

/** Earth log -> badge per item: "ok" if verified in a passed test, "bad" if it only failed, null if never tested. */
export function badges(log) {
  const b = {};
  for (const e of log) for (const k of [e.suit, e.mod]) { const v = e.ok ? "ok" : "bad"; b[k] = !b[k] || b[k] === v ? v : "mix"; }
  return b;
}

/** Left player's survival over all Moon/Mars zones with the chosen gear: number of zones the gear fails. */
export const failsOn = (zones, suit, mod) => zones.filter((z) => !testGear(z, suit, mod).ok);
export const FAIL_MIN = 20;   // game rule: each failing zone costs 20 min of oxygen/time
