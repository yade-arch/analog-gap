import React from "react";
import GlobeView from "../components/GlobeView.jsx";
import PlaceSearch from "../features/ui/PlaceSearch.jsx";
import { TargetSwitch } from "../features/world/WorldBar.jsx";
import { listDiscovered } from "../features/planet/discovered.js";
import { pointId } from "../features/planet/pointAnalysis.js";
import { fmt } from "../common.jsx";
import { t } from "../i18n/index.js";
import "../features/ui/glass.css";
import "./start.css";

const PHOTO = import.meta.env.BASE_URL + "data/tex/earth_bmng_200412_5400.jpg";   // NASA Blue Marble (same file as Explore)
const ll = (x) => `${fmt(Math.abs(x.lat), 2)}° ${x.lat >= 0 ? "N" : "S"}, ${fmt(Math.abs(x.lon), 2)}° ${x.lon >= 0 ? "E" : "W"}`;

// Opening screen: the Earth globe first. Click it or search to open that spot in Explore.
export default function Start({ profile, setProfile }) {
  const open = (p) => {
    const q = new URLSearchParams({ t: profile, lat: (+p.lat).toFixed(5), lon: (+p.lon).toFixed(5) });
    if (p.name) q.set("name", p.name);
    location.hash = "#/map?" + q.toString();
  };
  const recent = listDiscovered().slice(0, 4);
  return (
    <div className="start">
      <section className="start-panel g-card" aria-labelledby="start-h">
        <h2 id="start-h">{t("start.title")}</h2>
        <p>{t("start.intro")}</p>
        <div className="start-step">
          <span className="muted small">{t("start.target")}</span>
          <TargetSwitch target={profile} setTarget={setProfile} />
        </div>
        <PlaceSearch onPick={open} />
        <a className="g-btn primary start-go" href={"#/map?t=" + profile}>{t("start.find")}</a>
        {recent.length > 0 && (
          <div className="start-recent">
            <h3>{t("start.recent")}</h3>
            <ul>{recent.map((x) => (
              <li key={x.key}><a href={`#/compare/${pointId(x.lat, x.lon)}/${profile}`}>{x.name ? x.name.split(",").slice(0, 2).join(",") : ll(x)}</a></li>
            ))}</ul>
          </div>
        )}
      </section>
      <div className="start-globe darkstage">
        <p className="start-tip">{t("start.tip")}</p>
        <GlobeView body="earth" markers={[]} photo={PHOTO} onPick={(x) => x.lat != null && open(x)} />
      </div>
    </div>
  );
}
