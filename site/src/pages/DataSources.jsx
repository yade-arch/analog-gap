import React from "react";
import { t } from "../i18n/index.js";
import { POWER_URL } from "../features/planet/power.js";
import "../features/ui/glass.css";

// One place for every data source, grouped by what it is used for. Products in data_inventory.json are shown
// from that file (name, version, resolution, provider, role, check status, access, licence); the three web
// services that are not in the inventory (climate, satellite pictures, place names) are described here.
// NASA data and other providers are marked apart. AWS Terrain Tiles is never called NASADEM.
const GROUPS = [
  ["earthDem", ["E1", "E2", "E3"]],
  ["moonDem", ["M1", "M2", "M3"]],
  ["marsDem", ["R2", "R3", "R1"]],
  ["quick", ["E8"]],
  ["earthT", ["E4", "E5"]],
  ["moonT", ["M4", "M5"]],
  ["marsT", ["R4", "R5"]],
  ["climate", [], [{ name: "NASA POWER climate averages (API v2.10, 2001–2025)", res: "MERRA-2 grid 0.5° × 0.625°; sunlight from CERES SYN1deg 1°", by: "NASA Langley Research Center", url: POWER_URL, nasa: true }]],
  ["pictures", [], [{ name: "NASA GIBS: Blue Marble shaded relief and bathymetry", res: "map tiles, about 55 km wide pictures around a place", by: "NASA EOSDIS GIBS", url: "https://nasa-gibs.github.io/gibs-api-docs/", nasa: true },
    { name: "NASA Blue Marble Next Generation (December 2004) globe picture", res: "5400 × 2700 pixels", by: "NASA Earth Observatory", url: "https://visibleearth.nasa.gov/collection/1484/blue-marble", nasa: true }]],
  ["names", [], [{ name: "OpenStreetMap Nominatim place search", res: "place names only, no measurements", by: "© OpenStreetMap contributors (ODbL)", url: "https://nominatim.openstreetmap.org/", nasa: false }]],
  ["minerals", ["X1"]],
];
const isNasa = (r) => !/AWS|OpenStreetMap|Mapzen/i.test(r.provider || "");

function Row({ name, res, by, nasa, children }) {
  return (
    <li className="ds-row">
      <div className="ds-main">
        <b>{name}</b>
        <span className={"ds-who" + (nasa ? "" : " other")}>{t(nasa ? "ds.nasa" : "ds.other")}</span>
      </div>
      <div className="muted small">{res}{res && by ? " · " : ""}{by}</div>
      {children}
    </li>
  );
}

export default function DataSources({ inventory }) {
  const inv = Object.fromEntries((inventory || []).map((r) => [r.id, r]));
  return (
    <div className="glass ds">
      <section className="g-card">
        <h2 className="g-h">{t("ds.title")}</h2>
        <p>{t("ds.intro")}</p>
        <ul className="ds-key">
          <li><span className="tag obs">{t("ds.k.obs")}</span> {t("ds.k.obsD")}</li>
          <li><span className="tag der">{t("ds.k.der")}</span> {t("ds.k.derD")}</li>
          <li><span className="ds-approx">{t("rs.approx")}</span> {t("ds.k.apxD")}</li>
          <li><b>{t("list.nodata")}</b>: {t("ds.k.missD")}</li>
        </ul>
      </section>
      {GROUPS.map(([g, ids, extra = []]) => (
        <section className="g-card" key={g} aria-labelledby={"ds-" + g}>
          <h3 id={"ds-" + g}>{t("ds.g." + g)}</h3>
          <p className="muted small">{t("ds.g." + g + ".d")}</p>
          <ul className="ds-list">
            {ids.map((id) => inv[id]).filter(Boolean).map((r) => (
              <Row key={r.id} name={`${r.product}${r.version && r.version !== "—" ? " · " + r.version : ""}`} res={r.resolution !== "—" ? r.resolution : ""} by={r.provider !== "—" ? r.provider : ""} nasa={isNasa(r)}>
                <p className="small ds-role">{r.role_in_pipeline}</p>
                <details className="small">
                  <summary>{t("ds.more")}</summary>
                  <dl className="ds-dl">
                    <dt>{t("ds.f.id")}</dt><dd>{r.id}{r.short_name ? " · " + r.short_name : ""}</dd>
                    <dt>{t("ds.f.status")}</dt><dd>{r.verification_status}{r.verified_on ? " (" + r.verified_on + ")" : ""}</dd>
                    {r.units_and_encoding && <><dt>{t("ds.f.units")}</dt><dd>{r.units_and_encoding}</dd></>}
                    {r.temporal_coverage && <><dt>{t("ds.f.time")}</dt><dd>{r.temporal_coverage}</dd></>}
                    {r.license_or_use && <><dt>{t("ds.f.lic")}</dt><dd>{r.license_or_use}</dd></>}
                    {r.doi_or_citation && <><dt>{t("ds.f.cite")}</dt><dd>{r.doi_or_citation}</dd></>}
                    {r.access_path && <><dt>{t("ds.f.access")}</dt><dd className="ds-break">{r.access_path}</dd></>}
                    {r.notes && <><dt>{t("ds.f.notes")}</dt><dd>{r.notes}</dd></>}
                  </dl>
                </details>
              </Row>
            ))}
            {extra.map((x) => (
              <Row key={x.name} {...x}><p className="small"><a href={x.url} target="_blank" rel="noreferrer">{t("ds.open")}</a></p></Row>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
