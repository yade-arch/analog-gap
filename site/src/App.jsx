import React, { useEffect, useMemo, useState } from "react";
import { PROFILES, SOURCES, Tag, Warn, fmt } from "./common.jsx";
import MapView from "./MapView.jsx";
import Card from "./Card.jsx";
import Method from "./Method.jsx";
import Compare from "./pages/Compare.jsx";
import Report from "./pages/Report.jsx";
import TopBar from "./components/TopBar.jsx";
import { DEFAULT_ROUTE } from "./config.js";

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
  useEffect(() => {
    Promise.all(["candidates_moon.geojson", "candidates_mars.geojson", "reference_moon.json", "reference_mars.json", "controls.json", "limitations.json", "validation.json",
      "thermal_earth.json", "thermal_moon.json", "regions.geojson", "data_inventory.json", "known_analogs.json", "exploratory_moon_sites.json", "parameters_sources.json"].map(get)).then((a) =>
      setD({ cm: a[0], cs: a[1], rm: a[2], rs: a[3], controls: a[4], lim: a[5], valid: a[6], tE: a[7], tM: a[8], regions: a[9], inv: a[10], known: a[11], expl: a[12], params: a[13] }));
  }, []);
  const cand = profile === "moon" ? D.cm : D.cs;
  const reference = profile === "moon" ? D.rm : D.rs;
  const [, page = DEFAULT_ROUTE, a1, a2] = hash.split("/");
  const sel = page === "card" ? a1 : null;
  useEffect(() => { if ((page === "card" || page === "compare" || page === "report") && a2 && a2 !== profile && PROFILES[a2]) setProfile(a2); }, [hash]);
  const go = (id) => { location.hash = `#/card/${id}/${profile}`; };
  const feature = useMemo(() => cand?.features.find((f) => f.properties.id === sel)?.properties, [cand, sel]);

  return (
    <>
      <TopBar page={page} profile={profile} setProfile={setProfile} reportId={(["compare", "card", "report"].includes(page) && a1) || cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0]?.id} />
      <main className={page === "compare" ? "full" : ""}>
        {!D.cm ? <p>Veri yükleniyor…</p> : (
          <>
            {page === "compare" && <Compare D={D} profile={profile} cand={cand} selId={a1} />}
            {page === "report" && <Report D={D} profile={profile} cand={cand} id={a1} />}
            {page === "map" && <MapPage cand={cand} profile={profile} D={D} onSelect={go} />}
            {page === "list" && <ListPage cand={cand} profile={profile} go={go} />}
            {page === "card" && (feature
              ? <Card p={feature} profile={profile} reference={reference} lim={D.lim} tE={D.tE} tM={D.tM} known={D.known} />
              : <div className="card">Bu pencere seçili profilin aday dosyasında yok (yalnızca bölge başına en iyi 250 aday dosyaya konur). <a href="#/list">Listeye dön</a></div>)}
            {page === "method" && <Method lim={D.lim} valid={D.valid} controls={D.controls} inventory={D.inv} expl={D.expl} />}
          </>
        )}
      </main>
      <footer>
        <div><strong>Veri ürünleri:</strong> {SOURCES}</div>
        <div>Yöntem ve sınırlamalar: <a href="#/method">Yöntem ve Doğrulama</a>. Hiçbir pencere Ay/Mars'ın tam karşılığı olarak sunulmaz; "daha az incelenmiş / katalogda yok" ifadesi kullanılır. Etiketler: <Tag kind="obs" /><Tag kind="der" /><Tag kind="int" /></div>
      </footer>
    </>
  );
}

function MapPage({ cand, profile, D, onSelect }) {
  const P = PROFILES[profile];
  return (
    <div>
      <div className="maprow">
        <MapView data={cand} regions={D.regions} onSelect={onSelect} selectedId={null} />
        <div>
          <div className="card">
            <h3>{P.name}</h3>
            <p className="muted">{P.sub}</p>
            <div className="legend"><span>yakın</span><span className="bar" /><span>uzak (D)</span></div>
            <p className="muted">Renk: Analog Mesafesi D <Tag kind="der" /> (tek yönlü sıralı palet; iyi/kötü anlamı yoktur).</p>
            <p>Gösterilen: bölge başına filtreyi geçen en iyi 250 pencere ({cand.features.length}). Toplam pencere: {cand.meta.n_windows_total}; filtreyi geçen: {cand.meta.n_pass_filter}.</p>
            <p className="muted">Kesikli çizgi: arama bölgesi sınırı. Bir pencereye tıklayınca Analog Card açılır.</p>
          </div>
          <Warn>Mesafe yalnızca topografik dağılım yakınlığıdır; termal, regolit, spektral, atmosfer, yerçekimi ve radyasyon karşılaştırılamaz. Bkz. Gap paneli.</Warn>
        </div>
      </div>
    </div>
  );
}

function ListPage({ cand, profile, go }) {
  const [reg, setReg] = useState("");
  const rows = cand.features.map((f) => f.properties).filter((p) => !reg || p.region === reg).sort((a, b) => a.rank - b.rank).slice(0, 200);
  const regions = [...new Set(cand.features.map((f) => f.properties.region))];
  return (
    <div className="card">
      <h2>Aday listesi — {PROFILES[profile].name}</h2>
      <p className="muted">D = ortalama(d_eğim, d_röleyf, d_pürüzlülük); düşük = daha yakın <Tag kind="der" />. Sıra, filtreyi geçen tüm {cand.meta.n_pass_filter} pencere içindedir. Aşağıda en iyi 200 (seçime göre).</p>
      <div className="filters">
        <label>Bölge:{" "}<select value={reg} onChange={(e) => setReg(e.target.value)}><option value="">Tümü</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></label>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th className="n">Sıra</th><th>Pencere</th><th>Bölge</th><th className="n">D</th><th className="n">d_eğim</th><th className="n">d_röleyf</th><th className="n">d_pürüz.</th><th className="n">Eğim P50 (°)</th><th className="n">Geçerli piksel %</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr className="click" key={p.id} onClick={() => go(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && go(p.id)}>
                <td className="n">{p.rank}</td><td>{p.id}</td><td>{p.region}</td><td className="n">{fmt(p.D, 3)}</td>
                <td className="n">{fmt(p.d.slope, 2)}</td><td className="n">{fmt(p.d.relief, 2)}</td><td className="n">{fmt(p.d.rough, 2)}</td>
                <td className="n">{fmt(p.derived_percentiles.slope.p50, 1)}</td><td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
