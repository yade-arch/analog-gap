// Earth-to-Space Rescue: pure logic. Real values come from data files (candidates, on-demand point analysis,
// reference JSON, thermal JSON, parameters_sources.json). Thresholds and costs are game rules (rules.js RESCUE).
import { earthThermal, roverLimit, refOf, candOf, dCut } from "./data.js";
import { GAME, RESCUE } from "./rules.js";
import { pointId } from "../planet/pointAnalysis.js";
import { TILE_URL } from "../planet/terrainTiles.js";

export const VARS = [["slope", "°", 1], ["relief", "m", 0], ["rough", "m", 2]];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const letter = (i) => LETTERS[i % 26] + (i >= 26 ? Math.floor(i / 26) : "");

/** Investigated site from a catalog candidate (NASADEM pipeline values; MODIS temperature when present). */
export function siteFromCand(p, D, i) {
  const th = earthThermal(D.tE, p.id);
  return { key: p.id, letter: letter(i), kind: "cand", status: "ok", id: p.id, name: p.id, region: p.region, center_lat: p.center_lat, center_lon: p.center_lon,
    vars: p.derived_percentiles || {}, approx: false, elev: null, thermal: th.ok ? th.w : null, D: p.D ?? null, d: p.d || {}, valid: p.evidence_coverage?.valid_pixel_fraction ?? null,
    source: "NASADEM (NASA, 30 m) · SPACE SYNC scan", tempSource: th.ok ? "MODIS MYD11A2 v061 land surface temperature (NASA)" : null };
}

/** Pending site for any clicked/typed point (filled by fillPoint when the on-demand analysis returns). */
export function sitePoint(lat, lon, i) {
  return { key: pointId(lat, lon), letter: letter(i), kind: "point", status: "load", id: pointId(lat, lon), name: null, center_lat: lat, center_lon: lon,
    vars: {}, approx: true, elev: null, thermal: null, D: null, d: {}, valid: null, source: "Terrain Tiles (AWS Open Data; mostly NASA SRTM 30 m), resampled to 30 m", tempSource: null };
}

export function fillPoint(s, r, profile) {
  if (r.missing || !VARS.some(([k]) => r.P?.[k])) return { ...s, status: "nodata" };   // sea / polar / no land pixels: no values, never zeros
  const sc = r.scores?.[profile] || {};
  return { ...s, status: "ok", dem: r.dem || null, vars: r.P || {}, elev: r.z || null, D: sc.D ?? null, d: sc.d || {}, valid: r.valid ?? null, outsideSRTM: !!r.outsideSRTM, noDreason: sc.reason || null };
}

/** Ground truth of the target (real reference values) and the sourced rover limit. */
export function truthOf(D, profile) {
  const ref = refOf(D, profile), lim = roverLimit(D.params, profile);
  const v = ref?.variables || {};
  const steep = lim && v.slope ? v.slope.p90 >= lim.num : null;
  const th = profile === "moon" ? D.tM?.windows?.[Object.keys(D.tM?.windows || {})[0]] : null;
  return { ref, v, lim, steep, label: ref?.label, thermal: th || null };
}

/** What the Earth place says about the ground, compared with the real target (used for the report and the result). */
export function assess(site, truth) {
  const sl = site?.vars?.slope, lim = truth.lim?.num;
  const siteSteep = sl && lim ? sl.p90 >= lim : null;
  const slopeOK = siteSteep === null || truth.steep === null ? null : siteSteep === truth.steep;
  const dr = site?.d?.rough, roughOK = dr == null ? null : dr <= GAME.similarD;
  const missing = VARS.filter(([k]) => !site?.vars?.[k]).map(([k]) => k);
  if (!site?.thermal) missing.push("temp");
  return { siteSteep, slopeOK, roughOK, missing, quality: slopeOK === false ? "wrong" : slopeOK === null ? "incomplete" : roughOK === false || missing.length > 1 ? "partial" : "good" };
}

/** Recommendation the data suggests (null = not enough data). */
export function suggest(a) {
  if (a.siteSteep === null) return null;
  return a.siteSteep ? { suit: "suit1", route: "safe", equip: "wheels" } : { suit: "suit2", route: "direct", equip: "battery" };
}

/** Choices that fit the real target ground. */
export function bestFor(truth) {
  if (truth.steep === null) return { suit: "suit1", route: "safe", equip: "wheels" };
  return truth.steep ? { suit: "suit1", route: "safe", equip: "wheels" } : { suit: "suit2", route: "direct", equip: "battery" };
}

/** A clearly better catalog place for decision 3, or null. */
export function betterSite(D, profile, site) {
  const best = (candOf(D, profile)?.features || []).map((f) => f.properties).filter((p) => p.D != null).sort((a, b) => a.D - b.D)[0];
  if (!best || best.id === site?.id) return null;
  return site?.D == null || best.D < site.D * RESCUE.betterD ? best : null;
}

/** Final evaluation: tier + actual reasons (keys with values), from what really happened in the game. */
export function evaluate(st) {
  const { end, collected, need, site, surveyed = 3, truth, load, sent, rover, suitDur, decisions, D, profile, upgraded } = st;
  const a = assess(upgraded || site, truth), best = bestFor(truth), r = [];
  const tier = end === "base" && collected >= need ? "success" : end === "base" && collected > 0 ? "partial" : "failure";
  if (end === "timeout") r.push({ k: "time" });
  if (end === "suit") r.push({ k: "suitFailed" });
  if (end === "rover") r.push({ k: "roverBroken" });
  if (end === "base" && collected === 0) r.push({ k: "noneCollected" });
  if (end === "base" && collected > 0 && collected < need) r.push({ k: "notAll", n: collected, of: need });
  if (end === "base" && collected >= need && need < 3) r.push({ k: "planCut", n: need });
  if (surveyed < 3) r.push({ k: "surveyShort", n: surveyed });
  if (a.slopeOK === false) r.push({ k: "infoWrong", site: a.siteSteep ? "steep" : "gentle", real: truth.steep ? "steep" : "gentle" });
  if (a.slopeOK === null) r.push({ k: "infoIncomplete" });
  if (a.roughOK === false) r.push({ k: "roughDiff" });
  const cut = dCut(candOf(D, profile));
  if (site?.D != null && cut != null && site.D > cut) r.push({ k: "siteWeak" });
  if (sent && load.suit !== best.suit) r.push({ k: "wrongSuit", suit: load.suit, real: truth.steep ? "steep" : "gentle" });
  if (load.route !== best.route) r.push({ k: "wrongRoute", route: load.route, real: truth.steep ? "steep" : "gentle" });
  if (load.equip !== best.equip && load.equip !== "backup") r.push({ k: "wrongEquip", equip: load.equip });
  if (rover && rover.health < 70) r.push({ k: "roverDamaged", h: Math.round(rover.health) });
  if (suitDur < RESCUE.suitLow) r.push({ k: "suitWorn", v: Math.round(suitDur) });
  if (tier === "success" && !r.some((x) => /wrong|info/.test(x.k))) r.unshift({ k: "allGood" });
  return { tier, reasons: r, a, best, decisions };
}

export const tileSource = TILE_URL;
