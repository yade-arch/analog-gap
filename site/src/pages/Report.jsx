import React, { useEffect, useMemo, useState } from "react";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import { SETTINGS } from "../config.js";
import { PROFILES, SOURCES, Tag, fmt } from "../common.jsx";
import { GapPanel } from "../Card.jsx";
import { UNITS, slopeLimit } from "../features/units/index.js";
import { VARIABLES, stationResult } from "../features/variables/index.js";
import { loadDem } from "../features/compare/demLoader.js";
import { exceedFraction } from "../features/compare/stats.js";
import { buildReport } from "../features/mission/report.js";
import { StationTable } from "../hud/StationCard.jsx";

/** Otomatik ANALOG GAP Report (yazdırılabilir). Ekrandaki istasyon kartlarıyla aynı hesap (stationResult). Rover limiti kullanılır. */
export default function Report({ D, profile, cand, id }) {
  const p = cand.features.find((f) => f.properties.id === id)?.properties;
  const refId = SETTINGS.references[profile][0];
  const [dem, setDem] = useState({ ref: null, cand: null, done: false });
  useEffect(() => {
    let live = true; setDem({ ref: null, cand: null, done: false });
    Promise.all([loadDem(refId).catch(() => null), loadDem(id).catch(() => null)]).then(([a, b]) => live && setDem({ ref: a, cand: b, done: true }));
    return () => { live = false; };
  }, [id, refId]);
  const reference = profile === "moon" ? D.rm : D.rs;
  const lim = slopeLimit(UNITS[0], profile, D.params);
  const ctx = useMemo(() => ({ p, profile, reference, tE: D.tE, tM: D.tM, lim, stats: { ref: exceedFraction(dem.ref, lim?.value), cand: exceedFraction(dem.cand, lim?.value) } }), [p, profile, dem, lim?.value]);
  const report = useMemo(() => (p ? buildReport({ p, profile, ctx }) : null), [p, profile, ctx]);
  if (!p) return <div className="card">Bu pencere seçili profilin aday dosyasında yok. <a href="#/list">Listeye dön</a></div>;

  const body = profile === "moon" ? t("side.moon") : t("side.mars");
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    a.download = `analog_gap_report_${p.id}_${profile}.json`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="report">
      <div className="card">
        <h2>ANALOG GAP Report — {p.id}</h2>
        <div className="muted">{PROFILES[profile].name} · {regionLabel(p.region)} · merkez {fmt(p.center_lat, 3)}°, {fmt(p.center_lon, 3)}° · 10 × 10 km · {new Date().toISOString().slice(0, 10)}</div>
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", alignItems: "baseline", marginTop: 8 }}>
          <div><div className="muted">Arazi uzaklığı (teknik ad: D; 0 = aynı, düşük = daha benzer) <Tag kind="der" /></div><div className="big">{fmt(p.D, 3)}</div></div>
          <div><div className="muted">Sıra (filtreyi geçen adaylar içinde)</div><div className="big">{p.rank ?? "—"}</div></div>
        </div>
        <p className="muted">D = ortalama(d_eğim, d_röleyf, d_pürüzlülük), eşit ağırlık, değiştirilemez; d_k = W1 / IQR(referans). Benzerlik yüzdesi veya güven puanı üretilmez. Pencere "{body} karşılığı" değildir. Gap paneli yanda.</p>
        <p className="noprint"><button onClick={() => window.print()} disabled={!dem.done}>Yazdır / PDF</button>{" "}<button onClick={download} disabled={!dem.done}>JSON indir</button>{!dem.done && <span className="muted"> DEM penceresi yükleniyor…</span>}{" "}<a href={`#/compare/${p.id}/${profile}`}>Karşılaştırmaya dön</a></p>
      </div>
      <div className="grid2">
        <div>
          {VARIABLES.map((v) => {
            const res = stationResult(v, profile, ctx);
            return (
              <div className="card" key={v.id}>
                <h3>{t(v.titleKey)} <span className="muted">· {t("station." + res.status)}</span></h3>
                {res.summary && <p>{res.summary}</p>}
                <StationTable res={res} refTitle={`${body} (referans)`} candTitle={`${t("side.earth")} (${t("side.cand")}) · ${p.id}`} />
                {res.note && res.rows.length > 0 && <p className="muted">{res.note}</p>}
              </div>
            );
          })}
          <div className="card">
            <h3>Etiketler</h3>
            <p><Tag kind="obs" /> {p.labels?.observed}. <Tag kind="der" /> {p.labels?.derived}. <Tag kind="int" /> {p.labels?.interpretation}.</p>
            <p><span className="tag real">{t("tag.real")}</span><span className="tag calc">{t("tag.calc")}</span><span className="tag sim">{t("tag.sim")}</span> Görev simülasyonu etiketleri. Eğim limiti{lim ? `: ${lim.value}° (${lim.id}, ${lim.source})` : ": kaynak bekliyor"}. Gerçek performans tahmini değildir.</p>
            <p className="muted"><strong>Veri ürünleri:</strong> {SOURCES}</p>
          </div>
        </div>
        <GapPanel p={p} profile={profile} reference={reference} lim={D.lim} tE={D.tE} tM={D.tM} />
      </div>
    </div>
  );
}