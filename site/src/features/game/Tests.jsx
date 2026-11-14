import React from "react";
import { t } from "../../i18n/index.js";
import { fmt, Tag, Warn } from "../../common.jsx";
import { earthThermal, roverLimit, slopeBand, targetThermal } from "./data.js";
import { Lbl, Missing, N, Strips, StripLegend, tf } from "./ui.jsx";

const pc3 = (a) => (a ? { p10: a[0], p50: a[1], p90: a[2] } : null);

/** (a) Aşırı sıcaklık: Dünya MODIS LST penceresi + hedef (Ay: Diviner PRP; Mars: Veri eksik). */
export function ThermalTest({ p, D, profile }) {
  const th = earthThermal(D.tE, p.id), tt = targetThermal(D.tM, profile);
  const e = th.ok ? { p10: th.w.T_mean2_K_median, p50: th.w.T_mean2_K_median, p90: th.w.T_mean2_K_median } : null;
  const rows = [{ label: t("game.earth") + " T_mean2", pc: e }, ...(tt || []).map((w) => ({ label: `${w.id} ${t("game.th.max")}`, pc: pc3(w.max) }))];
  return (
    <>
      <p>{t("game.earth")}: {th.ok ? <>dT_dn <N v={th.w.dT_dn_K_median} u="K" /> (P10–P90 <N v={th.w.dT_dn_K_p10_p90?.[0]} />–<N v={th.w.dT_dn_K_p10_p90?.[1]} u="K" />), T_mean2 <N v={th.w.T_mean2_K_median} u="K" /> <Lbl k="real" /> <Tag kind="obs" /></> : <Missing />}</p>
      {tt ? (
        <>
          <Strips rows={rows} unit="K" />
          <StripLegend rows={rows} unit="K" />
          <Warn>{t("game.warn.lstprp")}</Warn>
          <p className="g-result">{t("game.test.thermal.moon")} <Tag kind="int" /></p>
        </>
      ) : (
        <p className="g-result">{t("game.target")}: <Missing /> — {t("game.test.thermal.mars")} <Tag kind="int" /></p>
      )}
      <p className="muted">{D.tE?.product}{tt ? " · " + D.tM?.product : ""}</p>
    </>
  );
}

/** (b) Arazi/eğim: rover eğim limiti (yalnızca parameters_sources.json, selectable_in_ui=yes) ile eğim yüzdelikleri. */
export function TerrainTest({ p, D, profile, target }) {
  const lim = roverLimit(D.params, profile), c = p.derived_percentiles?.slope, r = target?.variables?.slope;
  const rows = [{ label: t("game.earth"), pc: c }, { label: t("game.target"), pc: r }];
  return (
    <>
      {lim ? <p>{t("game.limit")}: <strong>{lim.num}°</strong> ({lim.applies_to}) <Lbl k="sim" /> · <a href={lim.source_url} target="_blank" rel="noreferrer">{lim.source_title}</a> <span className="muted">{lim.notes}</span></p> : <p>{t("game.limit")}: <Missing /></p>}
      <Strips rows={rows} limit={lim?.num} unit="°" />
      <StripLegend rows={rows} unit="°" />
      {lim && rows.map((x) => (
        <p key={x.label} className="g-result">{x.label}: {x.pc ? t("game.band." + slopeBand(x.pc, lim.num)) : <Missing />} <Lbl k="calc" /></p>
      ))}
      <p className="muted">{t("game.band.note")}</p>
    </>
  );
}

/** (c) Yüzey durumu: pürüzlülük ve röleyf; toz/regolit kapsam dışı. */
export function SurfaceTest({ p, D, target }) {
  const vars = [["rough", "m"], ["relief", "m"]];
  const l02 = D.lim?.items?.find((i) => i.id.startsWith("L02"));
  return (
    <>
      {vars.map(([k, u]) => {
        const rows = [{ label: t("game.earth"), pc: p.derived_percentiles?.[k] }, { label: t("game.target"), pc: target?.variables?.[k] }];
        const cp = rows[0].pc?.p50, rp = rows[1].pc?.p50;
        return (
          <div key={k}>
            <h5>{t("game.var." + k)} <Tag kind="der" /></h5>
            <Strips rows={rows} unit={u} />
            <StripLegend rows={rows} unit={u} />
            <p className="g-result">{cp === undefined || rp === undefined ? <Missing /> : t(cp > rp ? "game.surf.more." + k : "game.surf.less." + k)} <Lbl k="calc" /></p>
          </div>
        );
      })}
      <p>{t("game.fill")}: <N v={p.evidence_reliability?.nasadem_fill_or_interp_fraction * 100} d={1} u="%" /> <Lbl k="real" /></p>
      {l02 && <Warn><strong>{l02.title}.</strong></Warn>}
      <p>{t("game.unk.dust")}: <span className="g-missing">{t("game.outscope")}</span></p>
      <p className="muted">{tf("game.src.dem", { ref: target?.dem || "" })} · {fmt(p.evidence_coverage?.nasadem_srtm_fraction * 100, 0)}% SRTM</p>
    </>
  );
}
