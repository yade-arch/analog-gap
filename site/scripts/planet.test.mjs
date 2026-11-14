// Gezegen çekirdeği birim testleri (check.mjs çağırır): coords gidiş-dönüş, kutuplar, ±180°, picking, registry, provider hata yalıtımı.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export async function planetTests(imp) {
  const { toXYZ, toLatLon, pick, normLon, surfaceKm } = await imp("features/planet/coords.js");
  const { bodyList, getBody, BODIES } = await imp("features/planet/registry.js");
  const { queryAll } = await imp("features/planet/providers.js");
  let n = 0;
  for (let lat = -89.5; lat <= 89.5; lat += 7.3) for (let lon = -179.9; lon < 180; lon += 11.7) {
    const p = toLatLon(...toXYZ(lat, lon));
    assert.ok(Math.abs(p.lat - lat) < 1e-6 && Math.abs(normLon(p.lon - lon)) < 1e-6, `gidiş-dönüş ${lat},${lon}`); n++;
  }
  assert.ok(Math.abs(toLatLon(...toXYZ(90, 0)).lat - 90) < 1e-6 && Math.abs(toLatLon(...toXYZ(-90, 0)).lat + 90) < 1e-6, "kutuplar");
  assert.ok(Math.abs(Math.abs(normLon(toLatLon(...toXYZ(0, 180)).lon)) - 180) < 1e-6, "±180°");
  assert.equal(normLon(190), -170); assert.equal(normLon(-180), -180);
  // Picking: +x ekseninden merkeze bakan ışın (0°,0°)'a, +y'den bakan kuzey kutbuna düşer; ıskalayan ışın null.
  const a = pick([3, 0, 0], [-1, 0, 0]); assert.ok(Math.abs(a.lat) < 1e-9 && Math.abs(a.lon) < 1e-9, "pick ekvator");
  const t = toXYZ(35, -111, 1), o = t.map((x) => x * 4), q = pick(o, t.map((x) => -x));
  assert.ok(Math.abs(q.lat - 35) < 1e-6 && Math.abs(q.lon + 111) < 1e-6, "pick rastgele nokta");
  assert.ok(Math.abs(pick([0, 5, 0], [0, -1, 0]).lat - 90) < 1e-6, "pick kutup");
  assert.equal(pick([3, 3, 0], [1, 0, 0]), null, "pick ıska");
  assert.ok(Math.abs(surfaceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }, 6378) - 111.3) < 0.1, "haversine");
  // Registry: yalnızca 3 cisim açık; kapalılar getBody ile null.
  assert.deepEqual(bodyList().filter((b) => b.enabled).map((b) => b.id), ["earth", "moon", "mars"]);
  assert.equal(getBody("venus"), null); assert.equal(BODIES.mars.moons, 2);
  // Provider: hata veren adapter diğerini durdurmaz; Mars noktası "Veri yok" + neden.
  const bad = { id: "bad", bodies: ["mars"], query: async () => { throw new Error("CORS"); } };
  const { localScan } = await imp("features/planet/localScan.js");
  const r = await queryAll("mars", 18, 77, {}, [bad, localScan]);
  assert.equal(r.results[0].error, "CORS"); assert.equal(r.results[1].found, false); assert.ok(r.results[1].missingReason);
  const e = await queryAll("earth", 0, 0, { cand: { features: [] }, regions: { features: [] } });
  assert.equal(e.results[0].found, false);
  // Gerçek veri: en iyi Ay-profil adayının merkezi -> aynı pencere ve dosyadaki D; Ay Site04 merkezi -> bulunur.
  const rd = (f) => JSON.parse(readFileSync(new URL("../public/data/" + f, import.meta.url), "utf8"));
  const cand = rd("candidates_moon.geojson"), best = cand.features.map((f) => f.properties).sort((x, y) => x.rank - y.rank)[0];
  const er = (await queryAll("earth", best.center_lat, best.center_lon, { cand, regions: rd("regions.geojson") })).results[0];
  assert.ok(er.found && er.place.windowId === best.id && er.variables.find((x) => x.id === "D").value === best.D, "localScan Dünya");
  const rm = rd("reference_moon.json"), s4 = rm.windows[0];
  assert.ok((await queryAll("moon", s4.lat, s4.lon_E, { rm })).results[0].found, "localScan Ay");
  return `${n} gidiş-dönüş + picking + registry + provider`;
}
