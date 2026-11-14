import React, { useMemo, useState } from "react";
import { fmt, Tag } from "../../common.jsx";
import { t } from "../../i18n/index.js";
import GlobeView from "../../components/GlobeView.jsx";
import { refMarkers } from "./markers.js";

/** Hedef gövde (Ay/Mars) küresi: yalnızca veride koordinatı olan referans pencereleri işaretlenir; Mars R2'nin koordinatı yok. */
export default function TargetPanel({ reference, profile }) {
  const markers = useMemo(() => refMarkers(reference), [reference]);
  const [pick, setPick] = useState(null);
  const w = reference?.windows?.find((x) => x.id === pick);
  return (
    <section className="card home-target">
      <h3>{t("home.globe.target.t." + profile)} <Tag kind="obs" /></h3>
      <GlobeView body={profile} markers={markers} selectedId={pick} onPick={(m) => m.id && setPick(m.id)} compact />
      <p className="muted">{t("home.globe.target.d." + profile)}</p>
      {!markers.length && <p><strong>{fmt(null)}</strong>: {t("home.globe.nocoord." + profile)}</p>}
      {w && (
        <p>
          <strong>{w.id}</strong> · {w.name} · {fmt(w.lat, 4)}°, {fmt(w.lon_E, 3)}° E
          {w.source && <> · <a href={w.source} target="_blank" rel="noreferrer">{t("home.globe.src")}</a></>}
        </p>
      )}
      <p className="muted small">{reference?.dem}{reference?.coverage_km ? ` · ${reference.coverage_km.join(" × ")} km` : ""}</p>
    </section>
  );
}
