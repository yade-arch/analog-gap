import React, { useState } from "react";
import { PROFILES, Tag, fmt } from "../common.jsx";
import PageIntro, { Term, Glossary } from "../components/PageIntro.jsx";
import { t } from "../i18n/index.js";

const fill = (s, o) => Object.entries(o).reduce((a, [k, v]) => a.replace(`{${k}}`, v), s);

export default function ListPage({ cand, profile, hasDem }) {
  const [reg, setReg] = useState(""), [more, setMore] = useState(false);
  const all = cand.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank);
  const rows = all.filter((p) => !reg || p.region === reg).slice(0, 200);
  const regions = [...new Set(all.map((p) => p.region))];
  const go = (id) => { location.hash = `#/compare/${id}/${profile}`; };
  return (
    <div>
      <PageIntro purpose={t("list.purpose")} how={t("list.how")} />
      <div className="top3" aria-label={t("list.top3")}>
        {all.slice(0, 3).map((p) => (
          <div className="card cand" key={p.id}>
            <div className="muted">#{p.rank} · {p.region}</div>
            <div className="big">{fmt(p.D, 3)}</div>
            <div className="muted"><Term k="D">D</Term> · {p.id} <Tag kind="der" /></div>
            <button className="btn-accent" onClick={() => go(p.id)}>{t("list.compare")}</button>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{PROFILES[profile].name} <span className="muted">· {t(`profile.${profile}.tr`)}</span></h2>
        <p className="muted">{fill(t("list.count"), { total: cand.meta.n_windows_total, pass: cand.meta.n_pass_filter, shown: rows.length })}</p>
        <p className="muted">{t("list.rowHint")}</p>
        <div className="filters">
          <label>Bölge:{" "}<select value={reg} onChange={(e) => setReg(e.target.value)}><option value="">Tümü</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label><input type="checkbox" checked={more} onChange={(e) => setMore(e.target.checked)} /> {t("list.details")}</label>
        </div>
        <table>
          <thead><tr>
            <th className="n">Sıra</th>{more && <th>Pencere</th>}<th>Bölge</th><th className="n"><Term k="D">D</Term></th>
            {more && <><th className="n"><Term k="d_slope">d_eğim</Term></th><th className="n"><Term k="d_relief">d_röleyf</Term></th><th className="n"><Term k="d_rough">d_pürüz.</Term></th><th className="n"><Term k="valid">Geçerli piksel %</Term></th></>}
            <th className="n"><Term k="slope50">Eğim P50 (°)</Term></th><th />
          </tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr className="click" key={p.id} onClick={() => go(p.id)}>
                <td className="n">{p.rank}</td>{more && <td>{p.id}</td>}<td>{p.region}</td><td className="n">{fmt(p.D, 3)}</td>
                {more && <><td className="n">{fmt(p.d.slope, 2)}</td><td className="n">{fmt(p.d.relief, 2)}</td><td className="n">{fmt(p.d.rough, 2)}</td><td className="n">{fmt(p.evidence_coverage.valid_pixel_fraction * 100, 1)}</td></>}
                <td className="n">{fmt(p.derived_percentiles.slope.p50, 1)}</td>
                <td><button onClick={(e) => { e.stopPropagation(); go(p.id); }}>{t("list.compare")}</button>{hasDem && !hasDem(p.id) && <span className="muted"> · {t("list.noDem")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Glossary />
    </div>
  );
}
