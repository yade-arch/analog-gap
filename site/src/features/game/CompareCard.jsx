import React from "react";
import { t } from "../../i18n/index.js";
import { fmt, Tag, Warn } from "../../common.jsx";
import { GAME } from "./rules.js";
import { compareRows, earthThermal, nearestKnown, targetThermal } from "./data.js";
import { Lbl, Missing, N, tf } from "./ui.jsx";

const UNITS = { slope: "°", relief: "m", rough: "m" };

/** Seçilen Dünya penceresi ile hedef referansın yan yana benzerlik + FARK tablosu. */
export default function CompareCard({ p, target: ref, D, profile }) {
  const rows = compareRows(p, ref), th = earthThermal(D.tE, p.id), tt = targetThermal(D.tM, profile), near = nearestKnown(D.known, p);
  return (
    <div className="card g-cmp">
      <h3>{p.id} <span className="muted">· {p.region} · {fmt(p.center_lat, 3)}, {fmt(p.center_lon, 3)}</span></h3>
      <p>{t("game.D")}: <strong><N v={p.D} d={3} /></strong> <Tag kind="der" /> <span className="muted">{t("game.D.note")}</span></p>
      <table className="g-table">
        <thead><tr><th>{t("game.var")}</th><th>{t("game.earth")} P50 / P90</th><th>{t("game.target")} P50 / P90</th><th>d_k</th><th>{t("game.verdict")}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td>{t("game.var." + r.k)}</td>
              <td><N v={r.cand?.p50} u={UNITS[r.k]} /> / <N v={r.cand?.p90} u={UNITS[r.k]} /></td>
              <td><N v={r.ref?.p50} u={UNITS[r.k]} /> / <N v={r.ref?.p90} u={UNITS[r.k]} /></td>
              <td><N v={r.d} d={3} /></td>
              <td className={r.similar === null ? "" : r.similar ? "g-sim" : "g-diff"}>{r.similar === null ? <Missing /> : t(r.similar ? "game.similar" : "game.different")}</td>
            </tr>
          ))}
          <tr>
            <td>{t("game.thermal")}</td>
            <td>{th.ok ? <>dT_dn <N v={th.w.dT_dn_K_median} u="K" /> · T_mean2 <N v={th.w.T_mean2_K_median} u="K" /></> : <Missing />}</td>
            <td>{tt ? <>{t("game.th.max")} P50 <N v={tt[0].max?.[1]} u="K" /> ({tt[0].id})</> : <Missing />}</td>
            <td>—</td>
            <td className="g-diff">{t("game.notequiv")}</td>
          </tr>
          {["gravity", "atmosphere", "radiation", "regolith"].map((k) => (
            <tr key={k}><td>{t("game.gap." + k)}</td><td colSpan="3" className="muted">{t("game.outscope")}</td><td className="g-diff">{t("game.different")}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="muted">{tf("game.rule.similar", { v: GAME.similarD })} <Lbl k="sim" /></p>
      {tt && th.ok && <Warn>{t("game.warn.lstprp")}</Warn>}
      <p>{t("game.coverage")}: <N v={p.evidence_coverage?.valid_pixel_fraction * 100} d={0} u="%" /> · {t("game.novel")}: {near ? <>{fmt(near.km, 0)} km</> : <Missing />} <Lbl k="calc" /></p>
      <p className="muted">{t("game.src.earth")} · {D.tE?.product}</p>
    </div>
  );
}
