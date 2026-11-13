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

// Ağır paketler (three.js, MapLibre) yalnızca ilgili sayfada indirilir.
const MapPage = lazy(() => import("./pages/MapPage.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
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
  const [profile, setProfile] = useState("moon");
  const [D, setD] = useState({});
  const [dem, setDem] = useState(null);
  useEffect(() => { loadDemIndex().then((i) => setDem(i.windows)).catch(() => setDem({})); }, []);
  useEffect(() => {
    Promise.all(["candidates_moon.geojson", "candidates_mars.geojson", "reference_moon.json", "reference_mars.json", "controls.json", "limitations.json", "validation.json",
      "thermal_earth.json", "thermal_moon.json", "regions.geojson", "data_inventory.json", "known_analogs.json", "exploratory_moon_sites.json", "parameters_sources.json"].map(get)).then((a) =>
      setD({ cm: a[0], cs: a[1], rm: a[2], rs: a[3], controls: a[4], lim: a[5], valid: a[6], tE: a[7], tM: a[8], regions: a[9], inv: a[10], known: a[11], expl: a[12], params: a[13] }));
  }, []);
  const cand = profile === "moon" ? D.cm : D.cs;
  const reference = profile === "moon" ? D.rm : D.rs;
  const [, page = DEFAULT_ROUTE, a1, a2] = hash.split("/");
  useEffect(() => { document.documentElement.dataset.page = page; }, [page]);
  const sel = page === "card" ? a1 : null;
  useEffect(() => { if ((page === "card" || page === "compare" || page === "report") && a2 && a2 !== profile && PROFILES[a2]) setProfile(a2); }, [hash]);
  const go = (id) => { location.hash = `#/card/${id}/${profile}`; };
  const feature = useMemo(() => cand?.features.find((f) => f.properties.id === sel)?.properties, [cand, sel]);

  return (
    <>
      <TopBar page={page} profile={profile} setProfile={setProfile} reportId={(["compare", "card", "report"].includes(page) && a1) || cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0]?.id} />
      <main className={page === "compare" ? "full" : ""}>
        {!D.cm ? <p>Veri yükleniyor…</p> : (
          <Suspense fallback={<p>Sayfa yükleniyor…</p>}>
            {page === "compare" && <Compare D={D} profile={profile} cand={cand} selId={a1} />}
            {page === "report" && <Report D={D} profile={profile} cand={cand} id={a1} />}
            {page === "map" && <MapPage cand={cand} profile={profile} D={D} onSelect={go} />}
            {page === "home" && <Home cand={cand} profile={profile} />}
            {page === "list" && <ListPage cand={cand} profile={profile} hasDem={dem ? (id) => id in dem : null} />}
            {page === "card" && (feature
              ? <Card p={feature} profile={profile} reference={reference} lim={D.lim} tE={D.tE} tM={D.tM} known={D.known} />
              : <div className="card">Bu pencere seçili profilin aday dosyasında yok (yalnızca bölge başına en iyi 250 aday dosyaya konur). <a href="#/list">Listeye dön</a></div>)}
            {page === "method" && <Method lim={D.lim} valid={D.valid} controls={D.controls} inventory={D.inv} expl={D.expl} />}
          </Suspense>
        )}
      </main>
      <footer>
        <div><strong>Veri ürünleri:</strong> {SOURCES}</div>
        <div>Yöntem ve sınırlamalar: <a href="#/method">Yöntem ve Doğrulama</a>. Hiçbir pencere Ay/Mars'ın tam karşılığı olarak sunulmaz; "daha az incelenmiş / katalogda yok" ifadesi kullanılır. Etiketler: <Tag kind="obs" /><Tag kind="der" /><Tag kind="int" /></div>
      </footer>
    </>
  );
}
