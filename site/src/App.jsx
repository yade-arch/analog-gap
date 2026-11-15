import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { PROFILES, SOURCES, Tag } from "./common.jsx";
import ListPage from "./pages/ListPage.jsx";
import Home from "./pages/Home.jsx";
import { loadDemIndex } from "./features/compare/demLoader.js";
import Card from "./Card.jsx";
import Method from "./Method.jsx";
import Report from "./pages/Report.jsx";
import TopBar from "./components/TopBar.jsx";
import { DEFAULT_ROUTE } from "./config.js";
import { useWorld, byRegion } from "./features/world/state.js";
import WorldBar from "./features/world/WorldBar.jsx";

// Ağır paketler (three.js, MapLibre) yalnızca ilgili sayfada indirilir.
const MapPage = lazy(() => import("./pages/MapPage.jsx"));
const Overview = lazy(() => import("./pages/Overview.jsx"));
const Game = lazy(() => import("./pages/Game.jsx"));
const Start = lazy(() => import("./pages/Cover.jsx"));   // home cover (3D planets); old Start.jsx kept
const DataSources = lazy(() => import("./pages/DataSources.jsx"));
const Story = lazy(() => import("./pages/Story.jsx"));
const TimeMachine = lazy(() => import("./pages/TimeMachine.jsx"));
const base = import.meta.env.BASE_URL;
const get = (n) => fetch(base + "data/" + n).then((r) => (r.ok ? r.json() : null)).catch(() => null);

function useHash() {
  const [h, setH] = useState(location.hash || "#/" + DEFAULT_ROUTE);
  useEffect(() => {
    const f = () => setH(location.hash || "#/" + DEFAULT_ROUTE);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return h;
}

export default function App() {
  const hash = useHash();
  useEffect(() => {                                   // üst gezinme yüksekliği -> --hdr (ana ekran kalan yüksekliği doldurur)
    const el = document.querySelector("header.top"); if (!el) return;
    const set = () => document.documentElement.style.setProperty("--hdr", el.offsetHeight + "px");
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, []);
  const [D, setD] = useState({});
  const [dem, setDem] = useState(null);
  useEffect(() => { loadDemIndex().then((i) => setDem(i.windows)).catch(() => setDem({})); }, []);
  useEffect(() => {
    Promise.all(["candidates_moon.geojson", "candidates_mars.geojson", "reference_moon.json", "reference_mars.json", "controls.json", "limitations.json", "validation.json",
      "thermal_earth.json", "thermal_moon.json", "regions.geojson", "data_inventory.json", "known_analogs.json", "exploratory_moon_sites.json", "parameters_sources.json"].map(get)).then((a) =>
      setD({ cm: a[0], cs: a[1], rm: a[2], rs: a[3], controls: a[4], lim: a[5], valid: a[6], tE: a[7], tM: a[8], regions: a[9], inv: a[10], known: a[11], expl: a[12], params: a[13] }));
  }, []);
  const [, page = DEFAULT_ROUTE, a1, a2] = hash.split("?")[0].split("/");
  const { target: profile, setTarget: setProfile, region, setRegion } = useWorld(hash, page, a2);
  const cand = profile === "moon" ? D.cm : D.cs;
  const candR = useMemo(() => byRegion(cand, region), [cand, region]);
  const reference = profile === "moon" ? D.rm : D.rs;
  useEffect(() => { document.documentElement.dataset.page = page; }, [page]);
  const sel = page === "card" ? a1 : null;
  const [foot, setFoot] = useState(false);
  useEffect(() => { if (!foot) return undefined; const f = (e) => { if (!e.target.closest?.(".data-pop")) setFoot(false); }; addEventListener("pointerdown", f); return () => removeEventListener("pointerdown", f); }, [foot]);   // footer data/method text: closed by default
  const go = (id) => { location.hash = `#/card/${id}/${profile}`; };
  const feature = useMemo(() => cand?.features.find((f) => f.properties.id === sel)?.properties, [cand, sel]);

  return (
    <>
      {page !== "start" && <TopBar page={page} profile={profile} setProfile={setProfile} reportId={(["compare", "card", "report"].includes(page) && a1) || cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0]?.id} />}
      <main>
        {D.cm && page !== "compare" && page !== "mission" && page !== "home" && page !== "start" && <WorldBar page={page} target={profile} region={region} setRegion={setRegion} candId={(["card", "report"].includes(page) && a1) || candR?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0]?.id} />}
        {!D.cm ? <p>Loading data…</p> : (
          <Suspense fallback={<p>Loading page…</p>}>
            {(page === "compare" || page === "mission") && <Overview D={D} profile={profile} cand={cand} reference={reference} selId={a1} />}
            {page === "report" && <Report D={D} profile={profile} cand={cand} id={a1} />}
            {page === "map" && <MapPage cand={candR} candAll={cand} region={region} setRegion={setRegion} profile={profile} D={D} onSelect={go} />}
            {page === "home" && <Overview D={D} profile={profile} cand={cand} reference={reference} selId={a1} />}
            {page === "about" && <Home cand={cand} profile={profile} D={D} />}
            {page === "list" && <ListPage cand={cand} region={region} setRegion={setRegion} profile={profile} reference={reference} known={D.known} tE={D.tE} tM={D.tM} hasDem={dem ? (id) => id in dem : null} />}
            {page === "card" && (feature
              ? <Card p={feature} profile={profile} reference={reference} lim={D.lim} tE={D.tE} tM={D.tM} known={D.known} />
              : <div className="card">This window is not in the candidate file for the chosen target (the file holds only the best 250 candidates per region). <a href="#/list">Back to the list</a></div>)}
            {page === "game" && <Game D={D} profile={profile} setProfile={setProfile} />}
            {page === "start" && <Start profile={profile} setProfile={setProfile} />}
            {page === "story" && <Story D={D} profile={profile} setProfile={setProfile} cand={cand} />}
            {page === "time" && <TimeMachine D={D} profile={profile} setProfile={setProfile} cand={cand} />}
            {page === "data" && <DataSources inventory={D.inv} />}
            {page === "method" && <Method lim={D.lim} valid={D.valid} controls={D.controls} inventory={D.inv} expl={D.expl} />}
          </Suspense>
        )}
      </main>
      <footer className="data-pop" data-open={foot || undefined}>
        <button type="button" className="foot-tog" aria-expanded={foot} onClick={() => setFoot(!foot)}>ⓘ Data</button>
        {foot && <div className="foot-body"><button type="button" className="foot-x" aria-label="Close" onClick={() => setFoot(false)}>✕</button>
        <div><strong>Data products:</strong> {SOURCES} · <a href="#/data">All data sources</a></div>
        <div>Method and limits: <a href="#/method">Method & Validation</a>. No window is presented as an exact copy of the Moon/Mars; we say "less studied / not in catalog". Labels: <Tag kind="obs" /><Tag kind="der" /><Tag kind="int" /></div>
        </div>}
      </footer>
    </>
  );
}
