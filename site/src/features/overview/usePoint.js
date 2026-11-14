import { useEffect, useState } from "react";
import { analysePoint, parsePointId, pointCand } from "../planet/pointAnalysis.js";
import { SOURCE } from "../planet/terrainTiles.js";

/** Comparison screen with an on-demand point ("@lat,lon" in the address) as the Earth side.
 *  -> null (not a point) | { loading } | { error } | { p, dem, r }. Uses the same cached analysis as the map panel. */
export function usePoint(selId, profile, D) {
  const ll = parsePointId(selId), [st, setSt] = useState(null);
  useEffect(() => {
    if (!ll || !D.rm) { setSt(null); return undefined; }
    let live = true; setSt({ loading: true });
    analysePoint(ll.lat, ll.lon, { moon: D.rm, mars: D.rs }).then((r) => {
      if (!live) return;
      if (r.missing || !r.dem) { setSt({ error: true }); return; }
      const dem = { ...r.dem, meta: { ...r.dem.meta, product: `${SOURCE}, zoom ${r.zoom} -> 30 m -> 90 m display grid (approximate)` } };
      setSt({ p: pointCand(r, profile), dem, r });
    }).catch(() => live && setSt({ error: true }));
    return () => { live = false; };
  }, [selId, profile, D.rm, D.rs]);
  return ll ? st || { loading: true } : null;
}
