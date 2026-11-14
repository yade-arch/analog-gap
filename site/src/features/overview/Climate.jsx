import React, { useEffect, useState } from "react";
import { t } from "../../i18n/index.js";
import { fmt, Tag } from "../../common.jsx";
import { fetchPower, POWER_URL, worldviewUrl } from "../planet/power.js";

const SHOW = [["t2m", 1], ["tRange", 1], ["rain", 0], ["sun", 1]];

/** Earth climate at the candidate (NASA POWER climate normal, ~50 km grid cell average — not a point measurement). */
export function ClimateBox({ lat, lon }) {
  const [st, setSt] = useState({ load: true });
  useEffect(() => {
    let live = true; setSt({ load: true });
    fetchPower(lat, lon).then((r) => live && setSt({ r })).catch(() => live && setSt({ err: true }));
    return () => { live = false; };
  }, [lat, lon]);
  const v = (id) => st.r?.variables?.find((x) => x.id === id);
  return (
    <section className="ov-box">
      <h3>{t("ov.climate")} <Tag kind="obs" /></h3>
      {st.load && <p className="ov-sub">{t("ui.loading")}</p>}
      {st.err && <p className="ov-sub">{t("ui.powerErr")}</p>}
      {st.r && (
        <>
          <ul className="ov-stats">{SHOW.map(([id, d]) => { const x = v(id); return <li key={id} title={t("ui.pw." + id + ".m")}><span>{t("ui.pw." + id)}</span><b>{x?.value == null ? t("ui.noData") : `${fmt(x.value, d)} ${x.unit}`}</b></li>; })}</ul>
          <p className="ov-sub">{t("ov.climateNote").replace("{range}", st.r.range || "")}</p>
        </>
      )}
    </section>
  );
}

/** Links to the real NASA/USGS data sources used on this screen. */
export function LinksBox({ lat, lon, profile }) {
  const L = [["NASA POWER", POWER_URL], ["NASADEM (LP DAAC)", "https://lpdaac.usgs.gov/products/nasadem_hgtv001/"],
    profile === "moon" ? ["LOLA (NASA PDS)", "https://pds-geosciences.wustl.edu/missions/lro/lola.htm"] : ["Mars 2020 CTX DTM (USGS)", "https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_context_camera_orthorectified_image_mosaic"],
    ["NASA Worldview", worldviewUrl(lat, lon, 1)], ["Earthdata", "https://www.earthdata.nasa.gov/"]];
  return (
    <section className="ov-box">
      <h3>{t("ov.links")}</h3>
      <ul className="ov-links">{L.map(([k, u]) => <li key={k}><a href={u} target="_blank" rel="noreferrer">{k} ↗</a></li>)}</ul>
    </section>
  );
}
