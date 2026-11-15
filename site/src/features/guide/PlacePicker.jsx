// Earth place chooser for Story Mode and Time Machine: catalog candidate, saved place, or any coordinates (not limited to catalogs).
import React, { useState } from "react";
import { t } from "../../i18n/index.js";
import { fmt } from "../../common.jsx";
import { listDiscovered } from "../planet/discovered.js";

/** onPick({ kind: "cand", id, lat, lon, label } | { kind: "point", lat, lon, label }) */
export default function PlacePicker({ cand, onPick, value }) {
  const top = [...(cand?.features || [])].map((f) => f.properties).filter((p) => p.D != null).sort((a, b) => a.D - b.D).slice(0, 30);
  const saved = listDiscovered(), [lat, setLat] = useState(""), [lon, setLon] = useState(""), [err, setErr] = useState(false);
  const go = (e) => { e.preventDefault(); const a = +lat, b = +lon;
    if (lat === "" || lon === "" || !(Math.abs(a) <= 90 && Math.abs(b) <= 180)) { setErr(true); return; }
    setErr(false); onPick({ kind: "point", lat: a, lon: b, label: `${fmt(a, 3)}, ${fmt(b, 3)}` }); };
  const pickSel = (v) => {
    const [k, id] = v.split(":"); if (!id) return;
    if (k === "c") { const p = top.find((x) => x.id === id); onPick({ kind: "cand", id, lat: p.center_lat, lon: p.center_lon, label: id }); }
    else { const s = saved.find((x) => x.key === id); onPick({ kind: "point", lat: s.lat, lon: s.lon, label: s.name || s.key }); }
  };
  return (
    <div className="pp">
      <label>{t("gd.pick.list")}
        <select value={value || ""} onChange={(e) => pickSel(e.target.value)}>
          <option value="">{t("gd.pick.choose")}</option>
          <optgroup label={t("gd.pick.cand")}>{top.map((p) => <option key={p.id} value={"c:" + p.id}>{p.id} · D {fmt(p.D, 3)}</option>)}</optgroup>
          {saved.length > 0 && <optgroup label={t("gd.pick.saved")}>{saved.map((s) => <option key={s.key} value={"s:" + s.key}>{s.name || s.key}</option>)}</optgroup>}
        </select>
      </label>
      <form onSubmit={go} className="pp-coord">
        <input inputMode="decimal" placeholder={t("game.rs.lat")} aria-label={t("game.rs.lat")} value={lat} onChange={(e) => setLat(e.target.value)} />
        <input inputMode="decimal" placeholder={t("game.rs.lon")} aria-label={t("game.rs.lon")} value={lon} onChange={(e) => setLon(e.target.value)} />
        <button className="g-btn2">{t("gd.pick.go")}</button>
      </form>
      {err && <p className="small">{t("game.rs.coordErr")}</p>}
    </div>
  );
}
