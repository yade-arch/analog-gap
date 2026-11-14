import React, { useMemo, useState } from "react";
import { t } from "../../i18n/index.js";
import { fmt, Tag } from "../../common.jsx";
import GlobeView from "../../components/GlobeView.jsx";
import { refMarkers, refOf, targetThermal } from "./data.js";
import { Missing, N } from "./ui.jsx";

/** Aşama 1: hedef gövde küresi; işaretçi = referans pencere (yalnızca veride koordinatı olanlar). Basınca bilgi kartı. */
export default function TargetGlobe({ D, profile }) {
  const ref = refOf(D, profile), markers = useMemo(() => refMarkers(ref), [ref]);
  const [pick, setPick] = useState(null);
  const w = ref?.windows?.find((x) => x.id === pick);
  const th = targetThermal(D.tM, profile)?.find((x) => x.id === pick);
  return (
    <div className="g-grid2 g-globe-row">
      <GlobeView body={profile} markers={markers} selectedId={pick} onPick={(m) => m.id && setPick(m.id)} />
      <div className="card">
        <h3>{t("game.globe.ref")} <Tag kind="obs" /></h3>
        {!markers.length && <p><Missing /> — {t("game.globe.nocoord." + profile)}</p>}
        {w ? (
          <>
            <p><strong>{w.id}</strong> · {w.name}</p>
            <p>{fmt(w.lat, 4)}°, {fmt(w.lon_E, 3)}° E · {ref.grid_m} m × {ref.window_px} px</p>
            {th && <p>{t("game.th.avg")} P50 <N v={th.avg?.[1]} u="K" /> · {t("game.th.max")} P50 <N v={th.max?.[1]} u="K" /></p>}
            {w.source && <p className="muted"><a href={w.source} target="_blank" rel="noreferrer">{t("game.globe.src")}</a></p>}
          </>
        ) : markers.length ? <p className="muted">{t("game.globe.pick")}</p> : (
          <p className="muted">{ref?.label}{ref?.coverage_km ? ` · ${ref.coverage_km.join(" × ")} km` : ""}</p>
        )}
        <p className="muted">{ref?.dem}</p>
      </div>
    </div>
  );
}
