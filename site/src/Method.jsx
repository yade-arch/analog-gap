import React from "react";
import { regionLabel } from "./i18n/terms.js";
import { Tag, Warn, Limitations, fmt } from "./common.jsx";
import PageIntro, { Term } from "./components/PageIntro.jsx";
import CopyPre from "./components/CopyPre.jsx";

const STEPS = ["Data", "Preparation", "Properties", "Comparability", "Comparison", "Result"];
const STEP_D = ["NASA elevation data: Earth NASADEM, Moon LOLA, Mars CTX", "all put on the same 30 m grid", "slope, height difference, surface roughness", "places whose ranges do not overlap are removed", "difference in spread → terrain distance", "ranked list + missing topics"];
const Sec = ({ title, kid, children }) => (
  <details className="msec"><summary><h2>{title}</h2></summary><div className="msec-body">
    {kid && <p className="kid-line">{kid}</p>}
    {kid ? <details className="sci"><summary>Details for scientists</summary>{children}</details> : children}
  </div></details>
);
const FORMULA = `Technical names: D = terrain distance, d_k = distance per property (slope / height difference / surface roughness), O_k = overlap, P10/P50/P90 = typical value and range, W1 = Wasserstein distance, IQR = interquartile range (width of the middle half).
Properties (landform only): slope, local relief (11×11, 330 m, max−min), roughness (11×11 RMS of z − mean_5x5(z))
Filter:  O_k = |[c10,c90] ∩ [r10,r90]| / (r90 − r10)  >= 0.5  for every k, and valid pixels >= 90%
d_k   =  W1(F_cand,k , F_ref,k) / IQR(F_ref,k)     (scipy wasserstein_distance, 20 000-pixel subsample, seed = 42)
D     =  (d_slope + d_relief + d_roughness) / 3     equal weights; cannot be changed by the user
Rank: D from small to large (lower = closer). No similarity % or confidence score is produced.`;

export default function Method({ lim, valid, controls, inventory, expl }) {
  const pc = controls?.positive_control;
  const vb = pc?.two_views?.view_B_no_match_reported_separately;
  const va = pc?.two_views?.view_A_no_match_counted_as_last_group;
  const neg = controls?.negative_control;
  return (
    <div>
      <PageIntro purpose="Shows how close less-studied land windows on Earth come to the Moon/Mars references in landform, and where this comparison stops." how="Open the In short box first, then any section you are interested in; every section starts closed." />
      <div className="card brief kid">
        <h2>How it works</h2>
        <ol className="kid-steps">
          <li><b>1</b><span><strong>Pick a place.</strong> Choose any spot on Earth. We look at a square of land 10 km wide.</span></li>
          <li><b>2</b><span><strong>Measure the ground.</strong> NASA height maps tell us three things: how steep it is (<Term k="slope" />), how high the bumps are (<Term k="relief" />) and how rocky and bumpy it feels (<Term k="rough" />).</span></li>
          <li><b>3</b><span><strong>Do the same on the Moon or Mars.</strong> We measure the land around Shackleton crater (Moon) or Jezero crater (Mars) the same way.</span></li>
          <li><b>4</b><span><strong>Get one number.</strong> The <Term k="D" /> says how different the two grounds are. 0 means the same, a small number means very alike, a big number means very different.</span></li>
        </ol>
        <p className="muted small">It is not a percentage and not a score of "good" or "bad". It only compares the shape of the land, not air, cold or soil. Data names and versions are in the sections below.</p>
      </div>
      <Warn><strong>Honest note:</strong> the positive-control target was <strong>not met</strong> (the median percentile of known analogs did not reach ≤ 20%). Details: Validation section. So we do not claim the method is "validated".</Warn>
      <ol className="flow" aria-label="Method steps">
        {STEPS.map((s, i) => <li key={s}><strong>{s}</strong><span>{STEP_D[i]}</span></li>)}
      </ol>

      <Sec title="Same size squares everywhere" kid="All maps are cut into the same small 30 m squares, so the Moon, Mars and Earth are measured with the same ruler.">
        <p><Tag kind="der" />All elevation models are averaged onto a 30 m equal-area local projection; slope uses Horn 3×3 on the 30 m grid (effective baseline ≈ 60 m); window 10 × 10 km (333 × 333 pixels), step 5 km. No product is sharpened; fine Moon and Mars detail is lost at this scale.</p>
        <p>Distortion note: one LAEA grid per region was used (not centred on each window); scale error ≈ 0.08% at ≈ 500 km.</p>
      </Sec>
      <Sec title="What we measure and how" kid="For every little square we check how steep it is, how big the bumps are and how rough it feels. Then we compare these numbers with the Moon or Mars and turn the difference into one number.">
        <CopyPre text={FORMULA} />
        <p>Sensitivity analysis (window 5/20 km, grid 90 m, threshold 0.25/0.75, dropping a property): <strong>not done</strong> (cut list, time). Thresholds were not tuned to these results.</p>
      </Sec>
      <Sec title="Which places make the list" kid="A place only makes the list if its ground is at least a bit like the Moon or Mars ground. Then places are sorted: the smallest terrain distance comes first.">
        <p>O_k: how much the candidate's P10–P90 range overlaps the reference's P10–P90 range; a window is removed unless this is ≥ 0.5 for every property and valid pixels are ≥ 90%. <Term k="d_slope">d_k</Term>: W1/IQR per property. <Term k="D">D</Term>: the equal-weight average of the three d_k. Weights are fixed.</p>
      </Sec>
      <Sec title="Why temperature is kept apart" kid="Hot and cold are shown, but they do not change the terrain distance, because the Moon and Mars are much colder than any place on Earth.">
        <p>Temperature is <strong>not used</strong> in the distance or the filter: Earth LST (surface, two samples), Moon Diviner PRP (2 cm below the surface, model) and Mars THEMIS (not calibrated) are not the same quantities; they are only shown, with product names, in Properties and the Gap panel. Mars temperature: data missing.</p>
      </Sec>
      <Sec title="Where the places come from" kid="We looked at four big areas on Earth and cut them into 10 km squares, then compared each square with the Moon or Mars area.">
        <p>Candidates are scanned in: Southwestern USA, Atacama, Island of Hawaiʻi, Western/Central Anatolia. Places anywhere else on Earth can be analysed on demand from the map. Known analogs are not used to make candidates; they are only for the positive control and the "known" label. Reference targets: Moon = around Shackleton (LOLA, 3 ROI windows), Mars = around Jezero (CTX DTM, R2).</p>
      </Sec>
      <Sec title="Did we check our work?" kid="We tested if places that scientists already use as Moon or Mars practice sites end up near the top. They did not always, so we say honestly that the method is not proven yet.">
        <h3>Pozitif kontrol <Tag kind="der" /></h3>
        <Warn><strong>Target not met.</strong> Success target: median percentile of known analogs ≤ 20%. The result below is reported as it is; parameters and thresholds were not tuned to it. n = 5 tested (of 13 rows; 7 rows have no coordinates, Salda falls outside a valid window because of the water mask). The regions are unbalanced (US-SW 4, HAW 1, ANA 1, ATA 0).</Warn>
        {pc && (
          <>
            <table>
              <thead><tr><th>View</th><th>Result</th></tr></thead>
              <tbody>
                <tr><td><strong>A.</strong> An analog without D is counted in the "last group"</td><td>n = {va?.n}; median percentile {va?.median_percentile} (target ≤ 20) · Mann–Whitney one-sided p = {pc.mann_whitney?.["p_one_sided_(analog_lower_D_percentile)"]}</td></tr>
                <tr><td><strong>B.</strong> Those without D kept apart: "no match (O_k &lt; 0.25)"</td><td>{vb?.n_no_match_O_lt_0_25 ?? vb?.["n_no_match_O_lt_0.25"]} no match ({vb?.no_match_rows?.join("; ")}); matched {vb?.n_matched_D_available}: {Object.entries(vb?.matched_percentiles || {}).map(([k, v]) => `${k}: %${v}`).join("; ")}; median of matched only {vb?.median_percentile_matched_only}</td></tr>
              </tbody>
            </table>
            <p className="muted">{vb?.note}</p>
            <table>
              <thead><tr><th>Analog</th><th>Region / target</th><th className="n">D</th><th className="n">Percentile (A)</th><th>Status (B)</th></tr></thead>
              <tbody>
                {pc.rows.map((r) => (
                  <tr key={r.id}><td>{r.id} {r.name}</td><td>{r.region ? regionLabel(r.region) : "—"} {r.profile ? "· " + r.profile.split(" (")[0] : ""}</td><td className="n">{fmt(r.D, 3)}</td><td className="n">{r.percentile_in_region ?? "—"}</td><td>{r.match_status || r.status}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="muted">{pc.WARNING}</p>
          </>
        )}
        <h3>Negatif kontrol <Tag kind="der" /></h3>
        <p>200 random windows per region (seed = 42). Flat windows (slope P90 &lt; 2°, n = {neg?.flat_windows_slope_p90_lt_2deg?.moon?.n_flat_windows}): with D for the Moon target {neg?.flat_windows_slope_p90_lt_2deg?.moon?.n_with_D}; last quarter/unranked {neg?.flat_windows_slope_p90_lt_2deg?.moon?.["n_in_last_quarter_(percentile>=75)"]}. Windows overlap by 50%, so p-values may be optimistic.</p>
        <table>
          <thead><tr><th>Region</th><th>Target</th><th className="n">With D / 200</th><th className="n">Passed filter</th><th>D P10 / P50 / P90</th></tr></thead>
          <tbody>
            {neg && Object.entries(neg.per_region).flatMap(([reg, o]) => Object.entries(o).map(([pf, v]) => (
              <tr key={reg + pf}><td>{regionLabel(reg)}</td><td>{pf === "moon" ? "Moon" : "Mars"}</td><td className="n">{v.n_with_D}</td><td className="n">{v.n_pass_filter}</td><td>{v["D_percentiles_(P10,P50,P90)"]?.join(" / ") ?? "Veri eksik"}</td></tr>
            )))}
          </tbody>
        </table>
        <h3>Validation notes (validation.json)</h3>
        {valid?.positive_control?.limitations?.map((t, i) => <Warn key={i}>{t}</Warn>)}
        <p className="muted">{valid?.positive_control?.interpretation_rule}</p>
      </Sec>

      {expl && (
        <Sec title="Extra check: each Moon spot alone" kid="We also compared Earth with each of the three Moon spots one by one, to see if the results change.">
          <Warn><strong>Exploratory (post-hoc).</strong> This was done after the main results, using Site01, Site04 and Site07 separately instead of the pooled Moon reference. It does <strong>not change</strong> the main ranking, thresholds or the positive-control result, and should not be read as a hypothesis test.</Warn>
          {expl.sites && Object.entries(expl.sites).map(([s, v]) => (
            <div key={s}>
              <h3>{s}</h3>
              <p>Reference P10/P50/P90: {Object.entries(v.reference).map(([k, r]) => `${k} ${r.join("/")}`).join(" · ")}. Windows passing the filter: {v.n_pass_filter} (with D: {v.n_with_D}).</p>
              <table>
                <thead><tr><th>Analog</th><th>Status</th><th className="n">D</th><th className="n">Percentile</th></tr></thead>
                <tbody>{v.analogs.map((a) => <tr key={a.id}><td>{a.id} {a.name}</td><td>{a.status}</td><td className="n">{fmt(a.D, 3)}</td><td className="n">{a.percentile ?? "—"}</td></tr>)}</tbody>
              </table>
              <p className="muted">Median percentile (A, unmatched = last group): {v.median_A ?? "—"} · matched only: {v.median_B ?? "—"} (n = {v.n_matched}).</p>
            </div>
          ))}
          <p className="muted">{expl.note}</p>
        </Sec>
      )}

      <Sec title="What this cannot tell you" kid="It only compares the shape of the ground. It cannot say anything about air, cold, dust, radiation or what the rocks are made of.">
        <Limitations lim={lim} />
      </Sec>

      <Sec title="Where the data comes from" kid="A list of every map and measurement we used, mostly from NASA, with where to download it.">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>ID</th><th>Body</th><th>Product</th><th>Version</th><th>Resolution</th><th>Units</th><th>License</th><th>Status</th></tr></thead>
            <tbody>
              {inventory?.map((r) => (
                <tr key={r.id}><td>{r.id}</td><td>{r.body}</td><td>{r.product}<div className="muted">{r.short_name}</div></td><td>{r.version}</td><td>{r.resolution}</td><td>{r.units_and_encoding}</td><td>{r.license_or_use}</td><td>{r.verification_status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><a href="data/data_inventory.csv">data_inventory.csv indir</a></p>
      </Sec>
    </div>
  );
}
