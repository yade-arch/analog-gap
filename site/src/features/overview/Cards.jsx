import React, { useState } from "react";
import { t } from "../../i18n/index.js";
import { regionLabel, tipOf } from "../../i18n/terms.js";
import { fmt, D_STOPS } from "../../common.jsx";

const TEX = { moon: "moon_lroc_color_2048.jpg", mars: "mars_viking_clr_2048.jpg", earth: "earth_bmng_200412_2048.jpg" };
const base = import.meta.env.BASE_URL + "data/tex/";

/** Collapsible place card (reference or Earth candidate). Details open with the chevron. */
export function PlaceCard({ body, title, sub, chips, details, children }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={"ov-card" + (open ? " open" : "")}>
      <div className="ov-orb" style={{ backgroundImage: `url(${base + TEX[body]})` }} aria-hidden="true" />
      <div className="ov-card-b">
        <h2>{title}</h2>
        {sub && <p className="ov-sub">{sub}</p>}
        <div className="ov-chips">{chips.map(([k, v]) => v && <span key={k} title={k}>{v}</span>)}</div>
        {children}
        {open && <dl className="ov-det">{details.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v ?? t("ui.noData")}</dd></React.Fragment>)}</dl>}
      </div>
      <button className="ov-chev" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t(open ? "ov.less" : "ov.more")}>⌄</button>
    </section>
  );
}

/** Terrain distance D in the centre: big number + one-way colour bar (0 = identical, lower = more similar). */
export function DistanceCard({ D }) {
  const max = 1.2, has = D !== null && D !== undefined;
  return (
    <section className="ov-dist" title={tipOf("D")}>
      <h2>{t("gauge.title")}</h2>
      <strong>{has ? fmt(D, 3) : "—"}</strong>
      <div className="ov-bar" style={{ background: `linear-gradient(90deg, ${D_STOPS.map(([v, c]) => `${c} ${(v / max) * 100}%`).join(", ")})` }}>
        {has && <i style={{ left: `${Math.min(100, (D / max) * 100)}%` }} />}
      </div>
      <div className="ov-bar-l"><span>{t("ov.moreSim")}</span><span>{t("ov.lessSim")}</span></div>
      <p className="ov-sub">{has ? t("gauge.hint") : t("gauge.nodata")}</p>
    </section>
  );
}

/** Earth candidate picker: top candidates by rank (all shown candidates have an elevation window). */
export function CandPicker({ list, value, onPick }) {
  return (
    <label className="ov-pick">
      <span>{t("ov.pick")}</span>
      <select value={value} onChange={(e) => onPick(e.target.value)}>
        {!list.some((p) => p.id === value) && <option value="">—</option>}
        {list.map((p) => <option key={p.id} value={p.id}>#{p.rank} · {regionLabel(p.region)} · D {fmt(p.D, 3)}</option>)}
      </select>
      <a href="#/map">{t("ov.onMap")}</a>
    </label>
  );
}
