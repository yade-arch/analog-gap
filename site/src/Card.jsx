import React, { useState } from "react";
import { regionLabel } from "./i18n/terms.js";
import { PROFILES, VARS, Tag, Warn, Limitations, RangeBars, fmt } from "./common.jsx";

function hav(a, b, c, d) {
  const r = Math.PI / 180, dl = (c - a) * r, dn = (d - b) * r;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dn / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

function Thermal({ p, profile, tE, tM }) {
  const e = tE?.windows?.[p.id];
  const moonSites = tM?.windows ? Object.entries(tM.windows) : [];
  const medOf = (k) => {
    const v = moonSites.map(([, s]) => s[k]?.[1]).filter((x) => x != null).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : null;
  };
  return (
    <div>
      <h3>Temperature (not used in the distance or the filter)</h3>
      <p><Tag kind="obs" /><Tag kind="der" /> Earth: {tE?.product}, {tE?.year}, {tE?.n_composites} composites.</p>
      {e && e.dT_dn_K_median != null ? (
        <table>
          <tbody>
            <tr><td>dT_dn = LST_Day − LST_Night, yearly median <span className="muted">(stand-in for the daily range, two samples)</span></td><td className="n">{fmt(e.dT_dn_K_median, 1)} K (P10–P90: {e.dT_dn_K_p10_p90.join(" – ")})</td></tr>
            <tr><td>T_mean2 = (Day + Night)/2, yearly mean <span className="muted">(not a true daily mean)</span></td><td className="n">{fmt(e.T_mean2_K_median, 1)} K</td></tr>
            <tr><td>Median day / night view time</td><td className="n">{fmt(e.day_view_time_h_median, 1)} h / {fmt(e.night_view_time_h_median, 1)} h</td></tr>
            <tr><td>Valid 1 km cells / cells in window; median valid composites</td><td className="n">{e.n_cells_valid} / {e.n_cells_in_window}; {e.valid_composites_median_of_46}/46</td></tr>
          </tbody>
        </table>
      ) : <p><strong>Data missing</strong> — {e?.status || "no temperature calculation for this window"}.</p>}
      {profile === "moon" ? (
        <>
          <p><Tag kind="der" /> Moon reference: {tM?.product}. Derived from a model (not an observation).</p>
          <table>
            <thead><tr><th>Reference window</th><th className="n">temp_avg (2 cm below surface, yearly mean) P10/P50/P90 K</th><th className="n">temp_max (surface, yearly max) P10/P50/P90 K</th></tr></thead>
            <tbody>
              {moonSites.map(([id, s]) => (
                <tr key={id}><td>{id} {s.name}</td><td className="n">{s.temp_avg_K_p10_p50_p90?.join(" / ") ?? "Data missing"}</td><td className="n">{s.temp_max_K_p10_p50_p90?.join(" / ") ?? "Data missing"}</td></tr>
              ))}
            </tbody>
          </table>
          <p>Moon daily range (dT): <strong>Data missing</strong> (PCP not processed).</p>
          {e && e.T_mean2_K_median != null && medOf("temp_avg_K_p10_p50_p90") != null && (
            <Warn>
              Absolute difference (derived): Earth T_mean2 − Moon temp_avg (median of 3 sites' P50) = <strong>{fmt(e.T_mean2_K_median - medOf("temp_avg_K_p10_p50_p90"), 1)} K</strong>.
              <strong> Not the same quantity:</strong> surface LST (two samples) vs a modelled yearly mean 2 cm below the surface; a Moon day ≈ 29.5 Earth days and there is no atmosphere. This difference is not part of the terrain distance.
            </Warn>
          )}
        </>
      ) : (
        <p><strong>Mars temperature: data missing.</strong> The THEMIS mosaic is not calibrated and the quantitative TI product (R5) could not be verified. No zero or substitute value was made up.</p>
      )}
    </div>
  );
}

export function GapPanel({ p, profile, reference, lim, tE, tM }) {
  const loo = reference?.internal_spread_leave_one_out;
  return (
    <aside className="card gap-side" aria-label="Gap panel">
      <h2>Expose the Gap</h2>
      <p className="muted">What this comparison cannot tell you. Shown next to every result.</p>
      <h3>Not compared</h3>
      <table><tbody>
        {[["What the rocks are made of", "not checked"], ["Air", "not checked"], ["How strong gravity pulls", "not checked"], ["Space radiation", "not checked"], ["Dust and soil", "no data"],
          ["Hot and cold", profile === "mars" ? "no Mars data" : "shown, but not in the number"]].map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}
      </tbody></table>
      <details className="sci"><summary>More numbers (for scientists)</summary>
      <h3>Distance per property d_k <Tag kind="der" /></h3>
      <table><tbody>
        {Object.keys(VARS).map((k) => <tr key={k}><td>{VARS[k][0]}</td><td className="n">{fmt(p.d[k], 3)}</td></tr>)}
      </tbody></table>
      <p className="muted">d = 1 means the candidate's spread is shifted by as much as the width of the reference's middle half (IQR).</p>
      {loo && (
        <>
          <h3>Terrain distance within the reference itself (baseline; technical name: D) <Tag kind="der" /></h3>
          <table><tbody>{Object.entries(loo).map(([w, v]) => <tr key={w}><td>{w}</td><td className="n">{fmt(v.D, 2)}</td></tr>)}</tbody></table>
        </>
      )}
      <Thermal p={p} profile={profile} tE={tE} tM={tM} />
      <h3>Known limitations</h3>
      <Limitations lim={lim} profile={profile} />
      </details>
    </aside>
  );
}

const KID = { slope: "How steep", relief: "How tall the bumps are", rough: "How bumpy" };

export default function Card({ p, profile, reference, lim, tE, tM, known }) {
  const [tab, setTab] = useState("char");
  const prof = PROFILES[profile];
  const near = (known || []).filter((k) => k.lat).map((k) => ({ ...k, km: hav(p.center_lat, p.center_lon, +k.lat, +k.lon) })).sort((a, b) => a.km - b.km)[0];
  const tabs = [["char", "Properties"], ["cmp", "Compare"], ["ev", "Evidence"], ["nov", "In a catalog?"]];
  return (
    <div>
      <div className="card">
        <h2><span className="tag-body earth">EARTH (candidate)</span> {regionLabel(p.region)} <span className="muted small">· window code {p.id}</span></h2>
        <div className="muted">{regionLabel(p.region)} · centre {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}° · 10 × 10 km · target: {prof.name}</div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "baseline", marginTop: 8 }}>
          <div><div className="muted">Terrain distance (technical name: D; 0 = identical, lower = more similar)</div><div className="big">{fmt(p.D, 3)}</div></div>
          <div><div className="muted">Rank (among {PROFILES[profile].name} candidates that passed the filter)</div><div className="big">{p.rank ?? "—"}</div></div>
        </div>
        <p><a className="btn-accent" href={`#/compare/${p.id}/${profile}`}>Compare with the reference</a></p>
        <p className="muted">No similarity percentage or confidence score is produced. This window is not "a copy of the Moon/Mars"; it only shows how close the landform patterns are.</p>
      </div>
      <div className="grid2">
        <div>
          <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          {tab === "char" && (
            <div className="card">
              <h3>What the ground is like here</h3>
              <p>We used NASA height maps of this place to measure three things. <Tag kind="der" /></p>
              <table>
                <thead><tr><th>What we measured</th><th className="n">Low</th><th className="n">Usual</th><th className="n">High</th></tr></thead>
                <tbody>
                  {Object.keys(VARS).map((k) => (
                    <tr key={k}><td>{KID[k]} ({VARS[k][1]})</td><td className="n">{fmt(p.derived_percentiles[k].p10, 2)}</td><td className="n">{fmt(p.derived_percentiles[k].p50, 2)}</td><td className="n">{fmt(p.derived_percentiles[k].p90, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">We only compare the shape of the ground. Air, cold, soil and rocks are not compared (see the box on the right).</p>
            </div>
          )}
          {tab === "cmp" && (
            <div className="card">
              <h3>Compare: typical range of candidate and reference <span className="muted small">(technical name: Compare)</span></h3>
              <p><Tag kind="der" />Bar: P10–P90; dark line: P50. Reference: {reference?.label}.</p>
              <table>
                <thead><tr><th>Property</th><th className="n">O_k (overlap)</th><th className="n">d_k</th></tr></thead>
                <tbody>{Object.keys(VARS).map((k) => <tr key={k}><td>{VARS[k][0]}</td><td className="n">{fmt(p.O[k], 3)}</td><td className="n">{fmt(p.d[k], 3)}</td></tr>)}</tbody>
              </table>
              {Object.keys(VARS).map((k) => reference?.variables?.[k] && (
                <div key={k}><strong>{VARS[k][0]} ({VARS[k][1]})</strong>
                  <RangeBars cand={p.derived_percentiles[k]} reference={reference.variables[k]} unit={VARS[k][1]} />
                </div>
              ))}
              <pre className="formula">{"d_k = W1(F_cand,k , F_ref,k) / IQR(F_ref,k)\nD = (d_slope + d_relief + d_roughness) / 3     (equal weights, fixed)\nFilter: O_k >= 0.5 for every k; O_k = |[c10,c90] ∩ [r10,r90]| / (r90 − r10)"}</pre>
            </div>
          )}
          {tab === "ev" && (
            <div className="card">
              <h3>Evidence: coverage and reliability kept separate <span className="muted small">(technical name: Evidence Coverage / Reliability)</span></h3>
              <div className="grid2">
                <div>
                  <h3>Evidence coverage</h3>
                  <table><tbody>
                    <tr><td>Valid pixel share</td><td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)} %</td></tr>
                    <tr><td>Share of pixels from SRTM (NUM)</td><td className="n">{fmt(p.evidence_coverage.nasadem_srtm_fraction * 100, 1)} %</td></tr>
                    <tr><td>MODIS: valid composites (median)</td><td className="n">{tE?.windows?.[p.id]?.valid_composites_median_of_46 ?? "Data missing"} / 46</td></tr>
                  </tbody></table>
                </div>
                <div>
                  <h3>Reliability</h3>
                  <table><tbody>
                    <tr><td>NASADEM fill/interpolation share (NUM)</td><td className="n">{fmt(p.evidence_reliability.nasadem_fill_or_interp_fraction * 100, 1)} %</td></tr>
                    <tr><td>Resampling</td><td className="n">1″ → 30 m (area average)</td></tr>
                  </tbody></table>
                  <p className="muted">{p.evidence_reliability.note}</p>
                </div>
              </div>
              <p className="muted">No single "confidence score" is produced; the two measures are not combined.</p>
            </div>
          )}
          {tab === "nov" && (
            <div className="card">
              <h3>In a catalog? Distance to known analogs <span className="muted small">(technical name: Novelty)</span></h3>
              <p><Tag kind="der" />{near ? <>Nearest known analog with coordinates: <strong>{near.name}</strong>, {fmt(near.km, 0)} km.</> : "Data missing"}</p>
              <Warn>The catalog is very small (only 6 rows with coordinates). Read this window as "not in this short catalog", not as "unexplored"; other studies may have looked at it.</Warn>
            </div>
          )}
        </div>
        <GapPanel p={p} profile={profile} reference={reference} lim={lim} tE={tE} tM={tM} />
      </div>
    </div>
  );
}
