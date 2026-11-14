import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { SETTINGS } from "../config.js";
import { UNITS, slopeLimit } from "../features/units/index.js";
import { loadDem, loadDemIndex } from "../features/compare/demLoader.js";
import SceneView from "../features/compare/SceneView.jsx";
import DGauge from "../hud/DGauge.jsx";
import StationBar from "../hud/StationBar.jsx";
import { UnitPicker, CameraPicker, ObsLog, MiniMap, SlopeLegend } from "../hud/Panels.jsx";
import { fmt } from "../common.jsx";
import StationCard from "../hud/StationCard.jsx";
import MovePanel from "../hud/MovePanel.jsx";
import AutoPanel from "../hud/AutoPanel.jsx";
import { useAuto } from "../features/mission/useAuto.js";
import Fold from "../hud/Fold.jsx";
import { useMove } from "../features/mission/useMove.js";
import { VARIABLES, stationResult } from "../features/variables/index.js";
import { exceedFraction } from "../features/compare/stats.js";

function useDem(id) {
  const [s, set] = useState({ id: null, dem: null, err: null });
  useEffect(() => {
    let live = true; set({ id, dem: null, err: null });
    if (id) loadDem(id).then((dem) => live && set({ id, dem, err: null })).catch((e) => live && set({ id, dem: null, err: e.message }));
    return () => { live = false; };
  }, [id]);
  return s.id === id ? s : { id, dem: null, err: null };
}

/** Ana ekran (taslak 6). cand: profilin aday GeoJSON'u. selId: rota ile gelen aday kimliği. */
export default function Compare({ D, profile, cand, selId }) {
  const [index, setIndex] = useState(null);
  const [refId, setRefId] = useState(SETTINGS.references[profile][0]);
  const [unit, setUnit] = useState("rover"), [mode, setMode] = useState("follow"), [exag, setExag] = useState(SETTINGS.defaultExag);
  useEffect(() => { loadDemIndex().then(setIndex).catch(() => setIndex({ windows: {} })); }, []);
  useEffect(() => setRefId(SETTINGS.references[profile][0]), [profile]);

  const list = useMemo(() => (index ? cand.features.map((f) => f.properties).filter((p) => index.windows[p.id]).sort((a, b) => a.rank - b.rank) : []), [cand, index]);
  const all = useMemo(() => cand.features.map((f) => f.properties), [cand]);
  const cid = selId && all.some((p) => p.id === selId) ? selId : list[0]?.id;
  const cp = all.find((p) => p.id === cid);
  const hasDem = !!(index && index.windows[cid]);
  const L = useDem(refId), R = useDem(hasDem ? cid : null);

  const [cur, setCur] = useState(null), [visited, setVisited] = useState(() => new Set()), [log, setLog] = useState([]);
  useEffect(() => { setCur(null); setVisited(new Set()); setLog([]); }, [cid, profile]);
  const u = UNITS.find((x) => x.id === unit);
  const lim = slopeLimit(u, profile, D.params);
  const lv = lim ? lim.value : null;
  const reference = profile === "moon" ? D.rm : D.rs;
  const ctx = useMemo(() => ({ p: cp, profile, reference, tE: D.tE, tM: D.tM, lim, stats: { ref: exceedFraction(L.dem, lv), cand: exceedFraction(R.dem, lv) } }), [cp, profile, D, lim, L.dem, R.dem]);
  const curRes = cur && cp ? stationResult(VARIABLES.find((v) => v.id === cur), profile, ctx) : null;
  const rigRef = useRef(null), moved = useRef(false);
  const addLog = (id, title, text) => setLog((l) => [...l, { id: `${id}-${l.length}`, title, text }]);
  const visit = (id) => {
    if (!cp) return; setCur(id);
    if (visited.has(id)) return;
    const res = stationResult(VARIABLES.find((v) => v.id === id), profile, ctx), r0 = res.rows[0];
    setVisited(new Set([...visited, id]));
    setLog((l) => [...l, { id, title: t(res.v.titleKey) + ":", text: r0 ? `${r0.label.split(" (")[0]} — aday ${r0.cand}, referans ${r0.ref} [${t("tag." + r0.tag)}]` : "Veri eksik; değer üretilmedi." }]);
  };
  const stLabel = (i) => `${t(u.labelKey)} → ${t(VARIABLES[i].titleKey)}`;
  const autoRef = useRef(null);
  const labels = useMemo(() => VARIABLES.map((v) => t(v.titleKey) + (v.unit ? ` (${v.unit})` : "")), []);
  const move = useMove(rigRef, [L.dem, R.dem], VARIABLES.length, {
    labels,
    onStart: (i) => { moved.current = true; addLog("go", stLabel(i) + ":", t("move.start")); },
    onArrive: (i) => { if (moved.current) addLog("at", stLabel(i) + ":", t("move.arrive")); moved.current = false; if (!autoRef.current?.onArrive(i)) visit(VARIABLES[i].id); },
  });
  const auto = useAuto(VARIABLES.length, {
    go: (i) => { setCur(null); move.start(i); }, move: move.skip, cancelMove: move.cancel, close: () => setCur(null),
    open: (i) => visit(VARIABLES[i].id), reset: () => { setVisited(new Set()); setLog([]); setCur(null); rigRef.current?.clearTrail(); },
  });
  autoRef.current = auto;
  const states = useMemo(() => VARIABLES.map((v) => (v.availability(profile).status === "missing" ? "missing" : visited.has(v.id) ? "visited" : "pending")), [visited, profile]);
  useEffect(() => { rigRef.current?.setStationStates(states); }, [states, L.dem, R.dem]);
  // İstasyona git (kart kapanır, hareket biter, varışta kart açılır). Hareket sürerken yeni istek yok sayılır.
  const goStation = (id) => { if (!cp || move.moving || auto.active) return; setCur(null); move.start(VARIABLES.findIndex((v) => v.id === id)); };
  const next = () => { const i = VARIABLES.findIndex((v) => v.id === cur); const n = VARIABLES.slice(i + 1).concat(VARIABLES.slice(0, i)).find((v) => !visited.has(v.id)); if (n) goStation(n.id); else setCur(null); };
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
      if (/^[1-9]$/.test(e.key) && +e.key <= VARIABLES.length) goStation(VARIABLES[+e.key - 1].id);
      else if (e.key === "s" || e.key === "S") (auto.active ? auto.skip : move.skip)();
      else if (e.key === "Escape") { if (auto.active) auto.stop(); else setCur(null); }
    };
    addEventListener("keydown", h); return () => removeEventListener("keydown", h);
  });
  const done = visited.size === VARIABLES.length;
  const go = (id) => { location.hash = `#/compare/${id}/${profile}`; };
  const metaL = index?.windows[refId], metaR = hasDem ? index.windows[cid] : null;
  const body = profile === "moon" ? t("side.moon") : t("side.mars");

  return (
    <div className="compare">
      <SceneView dems={[L.dem, R.dem]} limits={[lv, lv]} exag={exag} mode={mode} unit={unit} rigRef={rigRef} />
      <div className="scene-tag">{t("exag.label")} ×{exag}</div>
      {curRes && <StationCard res={curRes} refTitle={`${body} (${t("side.ref")}) · ${metaL?.title || refId}`} candTitle={`${t("side.earth")} (${t("side.cand")}) · ${cid}`} D={cp?.D} onClose={auto.active ? auto.stop : () => setCur(null)} onNext={auto.active ? auto.next : next} nextLabel={auto.active ? t("auto.next") : undefined} last={!auto.active && visited.size === VARIABLES.length && !VARIABLES.some((v) => !visited.has(v.id) && v.id !== cur)} />}
      <div className="hud">
        <MovePanel moving={move.moving} label={move.moving ? stLabel(move.moving.idx) : ""} onSkip={move.skip} />
        <div className="hud-top">
          <div className="hud-panel side-card">
            <Fold Tag="b" title={`${body} · ${metaL?.title || refId}`}>
            <small>{metaL?.product}</small>
            <small>{t("side.ref")} · 10×10 km{metaL ? ` · ${t("cmp.elev")} ${fmt(metaL.z_min, 0)}–${fmt(metaL.z_max, 0)} m` : ""}</small>
            {SETTINGS.references[profile].length > 1 && (
              <select aria-label={t("cmp.ref")} value={refId} onChange={(e) => setRefId(e.target.value)}>{SETTINGS.references[profile].map((r) => <option key={r}>{r}</option>)}</select>
            )}
            {L.err && <small className="err">{t("cmp.err")}: {L.err}</small>}
            </Fold>
          </div>
          <DGauge cand={cp} profile={profile} />
          <div className="hud-panel side-card right">
            <Fold Tag="b" title={`${t("side.earth")} · ${cid || "—"}`}>
            <small>{metaR?.product || "NASADEM_HGT v001 (NASA LP DAAC), 30 m"}</small>
            <small>{t("side.cand")} · 10×10 km{metaR ? ` · ${t("cmp.elev")} ${fmt(metaR.z_min, 0)}–${fmt(metaR.z_max, 0)} m` : ""}</small>
            <select aria-label={t("cmp.cand")} value={cid || ""} onChange={(e) => go(e.target.value)}>
              {!hasDem && cid && <option value={cid}>{cid} (DEM yok)</option>}
              {list.map((p) => <option key={p.id} value={p.id}>#{p.rank} · {p.id}</option>)}
            </select>
            {cid && !hasDem && <small className="err">{t("cmp.nodem")}</small>}
            {R.err && <small className="err">{t("cmp.err")}: {R.err}</small>}
            {hasDem && !R.dem && !R.err && <small>{t("cmp.loading")}</small>}
            </Fold>
          </div>
        </div>
        <div className="hud-left">
          <UnitPicker unit={unit} onPick={setUnit} limits={{ cur: lim }} />
          <AutoPanel auto={auto} total={VARIABLES.length} label={auto.idx >= 0 ? labels[auto.idx] : ""} limitPending={!lim && unit === "astronaut"} hasScene={!!(L.dem && R.dem)} onReport={() => { location.hash = `#/report/${cid}/${profile}`; }} />
        </div>
        <details className="hud-right adv">
          <summary className="hud-panel">{t("cmp.adv")}<small>{t("cmp.advHint")}</small></summary>
          <div className="adv-body">
          <p className="hud-note">{t("move.keys")}</p>
          <CameraPicker mode={mode} onPick={setMode} exag={exag} onExag={setExag} />
          <ObsLog entries={log} />
          <MiniMap regions={D.regions} point={cp && { lat: cp.center_lat, lon: cp.center_lon }} />
          <SlopeLegend limit={lim} />
          </div>
        </details>
        <div className="hud-bottom">
          <div className="hud-center"><p className="hud-hint">{t("cmp.hint")}</p>
          <StationBar profile={profile} cur={cur} visited={visited} onVisit={goStation} busy={!!move.moving || auto.active} /></div>
          <div className="hud-end">
            <span className="badge">{t("badge.stage")}</span>
            <button className="hud-btn" disabled={!done} title={done ? "" : t("mission.pending")} onClick={() => { location.hash = `#/report/${cid}/${profile}`; }}>{t("mission.done")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
