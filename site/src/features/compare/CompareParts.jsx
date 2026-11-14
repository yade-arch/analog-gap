import React, { useMemo } from "react";
import { t } from "../../i18n/index.js";
import { SETTINGS } from "../../config.js";
import { fmt } from "../../common.jsx";
import { elevRange, reliefRamp } from "./reliefTexture.js";

/** Sol panel üstü: Ay/Mars referansı (ad, ürün, pencere, yükseklik aralığı, referans seçici). */
export function RefPanel({ title, meta, refId, refs, onRef, err }) {
  return (
    <section className="hud-panel cmp-info">
      <h4>{t("side.ref")}</h4>
      <b>{title}</b>
      <small>{meta?.product}</small>
      <small>10×10 km{meta ? ` · ${t("cmp.elev")} ${fmt(meta.z_min, 0)}–${fmt(meta.z_max, 0)} m` : ""}</small>
      {refs.length > 1 && <select aria-label={t("cmp.ref")} value={refId} onChange={(e) => onRef(e.target.value)}>{refs.map((r) => <option key={r}>{r}</option>)}</select>}
      {err && <small className="err">{t("cmp.err")}: {err}</small>}
    </section>
  );
}

/** Sağ panel üstü: Dünya adayı (ürün, yükseklik aralığı, aday seçici, DEM durumu). */
export function CandPanel({ cid, meta, list, hasDem, onPick, R }) {
  return (
    <section className="hud-panel cmp-info">
      <h4>{t("side.cand")}</h4>
      <b>{t("side.earth")} · {cid || "—"}</b>
      <small>{meta?.product || "NASADEM_HGT v001 (NASA LP DAAC), 30 m"}</small>
      <small>10×10 km{meta ? ` · ${t("cmp.elev")} ${fmt(meta.z_min, 0)}–${fmt(meta.z_max, 0)} m` : ""}</small>
      <select aria-label={t("cmp.cand")} value={cid || ""} onChange={(e) => onPick(e.target.value)}>
        {!hasDem && cid && <option value={cid}>{cid} (DEM yok)</option>}
        {list.map((p) => <option key={p.id} value={p.id}>#{p.rank} · {p.id}</option>)}
      </select>
      {cid && !hasDem && <small className="err">{t("cmp.nodem")}</small>}
      {R.err && <small className="err">{t("cmp.err")}: {R.err}</small>}
      {hasDem && !R.dem && !R.err && <small>{t("cmp.loading")}</small>}
    </section>
  );
}

const seg = (items, cur, set, label) => (
  <div className="seg" role="group" aria-label={label}>
    {items.map(([v, txt]) => <button key={v} type="button" aria-pressed={cur === v} onClick={() => set(v)}>{txt}</button>)}
  </div>
);

/** Sahne araç çubuğu: Görünüm | Eğim, dikey abartı, sol/sağ takas. */
export function SceneBar({ view, onView, exag, onExag, onSwap }) {
  return (
    <div className="scene-bar">
      {seg([["relief", t("view.relief")], ["slope", t("view.slope")]], view, onView, t("view.label"))}
      <span className="scene-bar-l">{t("exag.label")}</span>
      {seg(SETTINGS.exaggerations.map((x) => [x, "×" + x]), exag, onExag, t("exag.label"))}
      <button type="button" className="swap" onClick={onSwap}>{t("view.swap")}</button>
    </div>
  );
}

/** Yükselti görünümü lejantı: her yarım için rampa + gerçek en düşük/en yüksek (m) + "görsel" notu. */
export function ReliefLegend({ dems, pals, titles }) {
  const rows = useMemo(() => dems.map((d, i) => ({ r: d ? elevRange(d) : null, ramp: reliefRamp(pals[i]), title: titles[i] })), [dems, pals, titles]);
  return (
    <div className="hud-legend relief-legend">
      {rows.map((x) => (
        <span key={x.title} className="rl-row">
          <b>{x.title}</b>
          <small>{x.r ? `${fmt(x.r[0], 0)} m` : fmt(null)}</small>
          <span className="rl-bar" style={{ background: `linear-gradient(90deg, ${x.ramp.join(", ")})` }} />
          <small>{x.r ? `${fmt(x.r[1], 0)} m` : ""}</small>
        </span>
      ))}
      <small className="rl-note">{t("relief.note")}</small>
    </div>
  );
}
