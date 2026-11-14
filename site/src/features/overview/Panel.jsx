import React, { useState } from "react";
import { t } from "../../i18n/index.js";
import { tipOf } from "../../i18n/terms.js";
import { fmt, Tag } from "../../common.jsx";
import { LAYERS } from "./layers.js";
import ProfileChart from "./ProfileChart.jsx";

const MODES = [["3d", "◆"], ["2d", "▦"], ["profile", "∿"]];

function Box({ title, children, cls = "" }) {
  return <section className={"ov-box " + cls}><h3>{title}</h3>{children}</section>;
}

/** Collapsible bottom panel: layers, view mode, profile, statistics, actions. Every button does something real. */
export default function Panel({ layer, setLayer, mode, setMode, profile, stats, actions, open, setOpen }) {
  const [msg, setMsg] = useState("");
  const share = async () => {
    const url = location.href;
    try { if (navigator.share) await navigator.share({ title: "ANALOG GAP", url }); else { await navigator.clipboard.writeText(url); setMsg(t("ov.copied")); } } catch { /* cancelled */ }
  };
  return (
    <div className={"ov-panel" + (open ? "" : " shut")}>
      <button className="ov-tab" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={t(open ? "ov.hide" : "ov.show")}>{open ? "⌄" : "⌃"}</button>
      {open && (
        <div className="ov-grid">
          <Box title={t("ov.layers")}>
            {LAYERS.map((k) => (
              <label key={k} className="ov-radio" title={t("ov.layer." + k + ".d")}>
                <input type="radio" name="ov-layer" checked={layer === k} onChange={() => setLayer(k)} />
                <span>{t("ov.layer." + k)}</span><i className={"ov-sw ov-sw-" + k} />
              </label>
            ))}
          </Box>
          <Box title={t("ov.mode")}>
            <div className="ov-modes">{MODES.map(([k, ic]) => <button key={k} className={mode === k ? "on" : ""} aria-pressed={mode === k} onClick={() => setMode(k)}><b>{ic}</b>{t("ov.mode." + k)}</button>)}</div>
          </Box>
          <Box title={t("ov.prof")} cls="ov-wide"><ProfileChart {...profile} /></Box>
          <Box title={<>{t("ov.stats")} <Tag kind="der" /></>}>
            <ul className="ov-stats">{stats.map(([k, v, tip]) => <li key={k} title={tip}><span>{k}</span><b>{v ?? t("ui.noData")}</b></li>)}</ul>
          </Box>
          <Box title={t("ov.actions")}>
            <div className="ov-acts">
              <button onClick={() => setMode("profile")}><b>∿</b>{t("ov.act.cut")}</button>
              <a href={actions.report}><b>▤</b>{t("ov.act.report")}</a>
              <button onClick={actions.download}><b>⤓</b>{t("ov.act.download")}</button>
              <button onClick={share}><b>⇪</b>{t("ov.act.share")}</button>
              <a href="#/method"><b>ⓘ</b>{t("ov.act.method")}</a>
              <a href="#/game"><b>▶</b>{t("ov.act.game")}</a>
            </div>
            {msg && <p className="ov-sub">{msg}</p>}
          </Box>
        </div>
      )}
    </div>
  );
}

export const statRows = (ref, cand, mr, mc, names) => [
  [t("ov.st.range") + " (" + names[0] + ")", mr ? fmt(mr.z_max - mr.z_min, 0) + " m" : null, tipOf("relief")],
  [t("ov.st.range") + " (" + names[1] + ")", mc ? fmt(mc.z_max - mc.z_min, 0) + " m" : null, tipOf("relief")],
  [t("ov.st.slope") + " (" + names[0] + ")", ref?.variables?.slope?.p50 != null ? fmt(ref.variables.slope.p50, 1) + "°" : null, tipOf("slope")],
  [t("ov.st.slope") + " (" + names[1] + ")", cand?.derived_percentiles?.slope?.p50 != null ? fmt(cand.derived_percentiles.slope.p50, 1) + "°" : null, tipOf("slope")],
];
