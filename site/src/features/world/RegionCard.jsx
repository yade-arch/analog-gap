import React from "react";
import { Tag, fmt } from "../../common.jsx";
import { Term } from "../../components/PageIntro.jsx";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { REF_NAME } from "./known.js";

const med = (a) => { const s = a.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };

/** Bölge kartı: yalnızca mevcut dosyalardan özet (uydurma yok). cand: seçili hedefin tüm adayları; tE: thermal_earth.json. */
export default function RegionCard({ code, regions, cand, target, tE, known, onSelect }) {
  if (code === "ALL") return <div className="card"><p className="muted">{t("rc.pick")}</p></div>;
  const f = regions?.features.find((x) => x.properties.code === code)?.properties;
  const ps = cand.features.map((x) => x.properties).filter((p) => p.region === code).sort((a, b) => a.rank - b.rank);
  const tw = ps.map((p) => tE?.windows?.[p.id]).filter((w) => w && w.dT_dn_K_median != null);
  const kn = (known || []).filter((k) => k.region === code);
  const v = (k) => med(ps.map((p) => p.derived_percentiles[k]?.p50));
  return (
    <div className="card side-earth">
      <div><span className="tag-body earth">{t("side.earth")} ({t("side.cand")})</span> <strong>{regionLabel(code)}</strong></div>
      <p className="muted small">{t("rc.dataName")}: {f?.name || t("list.nodata")} · {t("rc.tiles")}: {f?.n_tiles ?? t("list.nodata")}</p>
      <p><strong>{t("rc.geo")}:</strong> {t("rc.geoNone")}</p>
      <h4>{t("rc.topo")} <Tag kind="der" /></h4>
      <p className="muted small">{t("rc.topoNote").replace("{n}", ps.length)}</p>
      <ul>
        <li><Term k="slope" />: {fmt(v("slope"), 1)} °</li>
        <li><Term k="relief" />: {fmt(v("relief"), 1)} m</li>
        <li><Term k="rough" />: {fmt(v("rough"), 2)} m</li>
      </ul>
      <h4>{t("rc.thermal")}</h4>
      {tw.length
        ? <p><Tag kind="der" /> {t("rc.dT")}: {fmt(med(tw.map((w) => w.dT_dn_K_median)), 1)} K · {t("rc.Tmean")}: {fmt(med(tw.map((w) => w.T_mean2_K_median)), 1)} K <span className="muted small">({t("rc.thermalSrc").replace("{n}", tw.length)})</span></p>
        : <p>{t("rc.thermalNone")}</p>}
      <p className="muted small">{t("rc.thermal." + target)}</p>
      <h4>{t("rc.best").replace("{ref}", `${t("side." + target)} · ${REF_NAME[target]}`)}</h4>
      <ol>{ps.slice(0, 3).map((p) => <li key={p.id}><button className="linkish" onClick={() => onSelect(p.id)}>{p.id}</button> · <Term k="D" /> {fmt(p.D, 3)}</li>)}</ol>
      <p><strong>{t("rc.known")}:</strong> {kn.length ? kn.map((k) => k.name).join(", ") : t("list.notInCatalog")}</p>
    </div>
  );
}
