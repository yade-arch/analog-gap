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
      <h3>Termal (puana ve filtreye girmez)</h3>
      <p><Tag kind="obs" /><Tag kind="der" /> Dünya: {tE?.product}, {tE?.year}, {tE?.n_composites} kompozit.</p>
      {e && e.dT_dn_K_median != null ? (
        <table>
          <tbody>
            <tr><td>dT_dn = LST_Day − LST_Night, yıllık medyan <span className="muted">(günlük aralık vekili, iki örnek)</span></td><td className="n">{fmt(e.dT_dn_K_median, 1)} K (P10–P90: {e.dT_dn_K_p10_p90.join(" – ")})</td></tr>
            <tr><td>T_mean2 = (Day + Night)/2, yıllık ortalama <span className="muted">(gerçek günlük ortalama değil)</span></td><td className="n">{fmt(e.T_mean2_K_median, 1)} K</td></tr>
            <tr><td>Day / Night view time medyanı</td><td className="n">{fmt(e.day_view_time_h_median, 1)} h / {fmt(e.night_view_time_h_median, 1)} h</td></tr>
            <tr><td>Geçerli 1 km hücre / pencere içi hücre; medyan geçerli kompozit</td><td className="n">{e.n_cells_valid} / {e.n_cells_in_window}; {e.valid_composites_median_of_46}/46</td></tr>
          </tbody>
        </table>
      ) : <p><strong>Veri eksik</strong> — {e?.status || "bu pencere için termal hesap yok"}.</p>}
      {profile === "moon" ? (
        <>
          <p><Tag kind="der" /> Ay referansı: {tM?.product}. Modelden türetilmiş (gözlem değil).</p>
          <table>
            <thead><tr><th>Referans pencere</th><th className="n">temp_avg (2 cm derinlik, yıllık ort.) P10/P50/P90 K</th><th className="n">temp_max (yüzey, yıllık maks.) P10/P50/P90 K</th></tr></thead>
            <tbody>
              {moonSites.map(([id, s]) => (
                <tr key={id}><td>{id} {s.name}</td><td className="n">{s.temp_avg_K_p10_p50_p90?.join(" / ") ?? "Veri eksik"}</td><td className="n">{s.temp_max_K_p10_p50_p90?.join(" / ") ?? "Veri eksik"}</td></tr>
              ))}
            </tbody>
          </table>
          <p>Ay günlük aralığı (dT): <strong>Veri eksik</strong> (PCP işlenmedi).</p>
          {e && e.T_mean2_K_median != null && medOf("temp_avg_K_p10_p50_p90") != null && (
            <Warn>
              Mutlak fark (Derived): Dünya T_mean2 − Ay temp_avg (3 saha P50 medyanı) = <strong>{fmt(e.T_mean2_K_median - medOf("temp_avg_K_p10_p50_p90"), 1)} K</strong>.
              <strong> Nicelikler eşdeğer değil:</strong> yüzey LST (iki örnek) ile 2 cm derinlikte model yıllık ortalama; Ay günü ≈ 29,5 Dünya günü, atmosfer yok. Bu fark benzerlik puanına girmez.
            </Warn>
          )}
        </>
      ) : (
        <p><strong>Mars termal: Veri eksik.</strong> THEMIS mozaiği kalibre değil; nicel TI ürünü (R5) doğrulanamadı. Sıfır veya eşdeğer değer üretilmedi.</p>
      )}
    </div>
  );
}

export function GapPanel({ p, profile, reference, lim, tE, tM }) {
  const loo = reference?.internal_spread_leave_one_out;
  return (
    <aside className="card" aria-label="Gap paneli">
      <h2>Expose the Gap</h2>
      <p className="muted">Bu panel, benzerlik sonucunun her zaman yanında görünür.</p>
      <h3>Hesaplanamayan / kapsam dışı değişkenler</h3>
      <table><tbody>
        {[["Spektral / mineraloji", "kapsam dışı"], ["Atmosfer", "kapsam dışı"], ["Yerçekimi", "kapsam dışı"], ["Radyasyon", "kapsam dışı"], ["Regolit özellikleri", "veri yok"],
          ["Termal", profile === "mars" ? "Mars: veri eksik" : "puana girmez, aşağıda"]].map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}
      </tbody></table>
      <h3>Boyut bazlı uzaklık d_k <Tag kind="der" /></h3>
      <table><tbody>
        {Object.keys(VARS).map((k) => <tr key={k}><td>{VARS[k][0]}</td><td className="n">{fmt(p.d[k], 3)}</td></tr>)}
      </tbody></table>
      <p className="muted">d = 1: aday dağılımı, referansın çeyrekler arası genişliği kadar kaymış demektir.</p>
      {loo && (
        <>
          <h3>Referansın kendi içindeki arazi uzaklığı (taban çizgisi; teknik ad: D) <Tag kind="der" /></h3>
          <table><tbody>{Object.entries(loo).map(([w, v]) => <tr key={w}><td>{w}</td><td className="n">{fmt(v.D, 2)}</td></tr>)}</tbody></table>
        </>
      )}
      <Thermal p={p} profile={profile} tE={tE} tM={tM} />
      <h3>Sabit sınırlamalar</h3>
      <Limitations lim={lim} profile={profile} />
    </aside>
  );
}

export default function Card({ p, profile, reference, lim, tE, tM, known }) {
  const [tab, setTab] = useState("char");
  const prof = PROFILES[profile];
  const near = (known || []).filter((k) => k.lat).map((k) => ({ ...k, km: hav(p.center_lat, p.center_lon, +k.lat, +k.lon) })).sort((a, b) => a.km - b.km)[0];
  const tabs = [["char", "Özellikler"], ["cmp", "Karşılaştır"], ["ev", "Kanıt"], ["nov", "Katalogda mı?"]];
  return (
    <div>
      <div className="card">
        <h2><span className="tag-body earth">DÜNYA (aday)</span> {regionLabel(p.region)} <span className="muted small">· pencere kodu {p.id}</span></h2>
        <div className="muted">{regionLabel(p.region)} · merkez {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}° · 10 × 10 km · profil: {prof.name}</div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "baseline", marginTop: 8 }}>
          <div><div className="muted">Arazi uzaklığı (teknik ad: D; 0 = aynı, düşük = daha benzer)</div><div className="big">{fmt(p.D, 3)}</div></div>
          <div><div className="muted">Sıra (filtreyi geçen {PROFILES[profile].name} adayları içinde)</div><div className="big">{p.rank ?? "—"}</div></div>
        </div>
        <p><a className="btn-accent" href={`#/compare/${p.id}/${profile}`}>Karşılaştırma Görevi başlat</a></p>
        <p className="muted">Benzerlik yüzdesi veya güven puanı üretilmez. Bu pencere "Ay/Mars'ın karşılığı" değildir; yalnızca topografik dağılım yakınlığıdır.</p>
      </div>
      <div className="grid2">
        <div>
          <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
          {tab === "char" && (
            <div className="card">
              <h3>Özellikler: arazi şekli <span className="muted small">(teknik ad: Characterize; 30 m, Horn 3×3 eğim)</span></h3>
              <p><Tag kind="obs" />NASADEM yüksekliği &nbsp; <Tag kind="der" />eğim, röleyf, pürüzlülük (P10 / P50 / P90)</p>
              <table>
                <thead><tr><th>Değişken</th><th className="n">Düşük uç (P10)</th><th className="n">Tipik (P50)</th><th className="n">Yüksek uç (P90)</th></tr></thead>
                <tbody>
                  {Object.keys(VARS).map((k) => (
                    <tr key={k}><td>{VARS[k][0]} ({VARS[k][1]})</td><td className="n">{fmt(p.derived_percentiles[k].p10, 2)}</td><td className="n">{fmt(p.derived_percentiles[k].p50, 2)}</td><td className="n">{fmt(p.derived_percentiles[k].p90, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p><Tag kind="int" />{p.labels.interpretation}</p>
            </div>
          )}
          {tab === "cmp" && (
            <div className="card">
              <h3>Karşılaştır: aday ve referansın tipik aralığı <span className="muted small">(teknik ad: Compare)</span></h3>
              <p><Tag kind="der" />Çubuk: P10–P90; siyah çizgi: P50. Referans: {reference?.label}.</p>
              <table>
                <thead><tr><th>Değişken</th><th className="n">O_k (örtüşme)</th><th className="n">d_k</th></tr></thead>
                <tbody>{Object.keys(VARS).map((k) => <tr key={k}><td>{VARS[k][0]}</td><td className="n">{fmt(p.O[k], 3)}</td><td className="n">{fmt(p.d[k], 3)}</td></tr>)}</tbody>
              </table>
              {Object.keys(VARS).map((k) => reference?.variables?.[k] && (
                <div key={k}><strong>{VARS[k][0]} ({VARS[k][1]})</strong>
                  <RangeBars cand={p.derived_percentiles[k]} reference={reference.variables[k]} unit={VARS[k][1]} />
                </div>
              ))}
              <pre className="formula">{"d_k = W1(F_aday,k , F_ref,k) / IQR(F_ref,k)\nD = (d_eğim + d_röleyf + d_pürüzlülük) / 3     (eşit ağırlık, değiştirilemez)\nFiltre: O_k >= 0.5 her k için; O_k = |[c10,c90] ∩ [r10,r90]| / (r90 − r10)"}</pre>
            </div>
          )}
          {tab === "ev" && (
            <div className="card">
              <h3>Kanıt: kapsam ve güvenilirlik ayrı <span className="muted small">(teknik ad: Evidence Coverage / Reliability)</span></h3>
              <div className="grid2">
                <div>
                  <h3>Kanıt kapsamı</h3>
                  <table><tbody>
                    <tr><td>Geçerli piksel oranı</td><td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)} %</td></tr>
                    <tr><td>SRTM kökenli piksel oranı (NUM)</td><td className="n">{fmt(p.evidence_coverage.nasadem_srtm_fraction * 100, 1)} %</td></tr>
                    <tr><td>MODIS: geçerli kompozit (medyan)</td><td className="n">{tE?.windows?.[p.id]?.valid_composites_median_of_46 ?? "Veri eksik"} / 46</td></tr>
                  </tbody></table>
                </div>
                <div>
                  <h3>Güvenilirlik</h3>
                  <table><tbody>
                    <tr><td>NASADEM dolgu/interpolasyon oranı (NUM)</td><td className="n">{fmt(p.evidence_reliability.nasadem_fill_or_interp_fraction * 100, 1)} %</td></tr>
                    <tr><td>Yeniden örnekleme</td><td className="n">1″ → 30 m (alan ortalaması)</td></tr>
                  </tbody></table>
                  <p className="muted">{p.evidence_reliability.note}</p>
                </div>
              </div>
              <p className="muted">Tek bir "güven puanı" üretilmez; iki ölçüt birleştirilmez.</p>
            </div>
          )}
          {tab === "nov" && (
            <div className="card">
              <h3>Katalogda mı? Bilinen analoglara uzaklık <span className="muted small">(teknik ad: Novelty)</span></h3>
              <p><Tag kind="der" />{near ? <>Koordinatı olan en yakın bilinen analog: <strong>{near.name}</strong>, {fmt(near.km, 0)} km.</> : "Veri eksik"}</p>
              <Warn>Katalog çok küçük (yalnızca 6 koordinatlı satır). Bu pencere "keşfedilmemiş" değil, "bu kısa katalogda yok" olarak okunmalıdır; başka çalışmalarca incelenmiş olabilir.</Warn>
            </div>
          )}
        </div>
        <GapPanel p={p} profile={profile} reference={reference} lim={lim} tE={tE} tM={tM} />
      </div>
    </div>
  );
}
