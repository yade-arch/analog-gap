import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import { fmt } from "../common.jsx";
import { SETTINGS } from "../config.js";
import { loadDem, loadDemIndex } from "../features/compare/demLoader.js";
import { webglOK } from "../features/compare/sceneRig.js";
import { createPairScene, EXAG } from "../features/overview/pairScene.js";
import { centreProfile } from "../features/overview/layers.js";
import { PlaceCard, DistanceCard, CandPicker } from "../features/overview/Cards.jsx";
import Panel, { statRows } from "../features/overview/Panel.jsx";
import Stations from "../features/overview/Stations.jsx";
import { ClimateBox, LinksBox } from "../features/overview/Climate.jsx";
import { usePoint } from "../features/overview/usePoint.js";
import GlobeView from "../components/GlobeView.jsx";
import "../features/overview/overview.css";
const PHOTO = import.meta.env.BASE_URL + "data/tex/earth_bmng_200412_2048.jpg";

/** Main screen: Moon/Mars reference and an Earth candidate as two large real-terrain 3D tiles, terrain distance in the
 *  middle, collapsible tool panel below. Values come from the data files; nothing here is simulated. */
export default function Overview({ D, profile, cand, reference, selId }) {
  const host = useRef(null), sc = useRef(null), [gl] = useState(() => webglOK());
  const list = useMemo(() => (cand?.features || []).map((f) => f.properties).sort((a, b) => a.rank - b.rank).slice(0, 40), [cand]);
  const [pick, setPick] = useState(null), pt = usePoint(pick ? null : selId, profile, D);
  const p = pt?.p || list.find((x) => x.id === (pick || selId)) || list[0];
  const refId = SETTINGS.references[profile][0], [zoomed, setZoomed] = useState(false), ready = !!p && !pt?.loading && !pt?.error && zoomed;
  const [dems, setDems] = useState({}), [idx, setIdx] = useState(null);
  const [layer, setLayer] = useState("dem"), [mode, setMode] = useState("3d"), [open, setOpen] = useState(true), [swapped, setSwapped] = useState(false);
  const names = [t("ui.body." + profile), t("side.earth").charAt(0) + t("side.earth").slice(1).toLowerCase()];

  useEffect(() => { loadDemIndex().then(setIdx).catch(() => setIdx({ windows: {} })); }, []);
  useEffect(() => {
    if (!p) return undefined; let live = true; setDems({});
    Promise.all([loadDem(refId).catch(() => null), p.onDemand ? Promise.resolve(pt.dem) : loadDem(p.id).catch(() => null)]).then(([r, c]) => live && setDems({ r, c }));
    return () => { live = false; };
  }, [refId, p?.id]);
  useEffect(() => { if (!gl || !host.current) return undefined; sc.current = createPairScene(host.current); return () => { sc.current.dispose(); sc.current = null; }; }, [gl, ready]);
  useEffect(() => {
    const s = sc.current; if (!s) return;
    const L = [[dems.r, profile], [dems.c, "earth"]]; if (swapped) L.reverse();
    L.forEach(([dem, body], i) => s.setTile(i, dem || null, layer, body));
  }, [dems, swapped, ready]);
  useEffect(() => { sc.current?.setLayer(layer); }, [layer]);
  useEffect(() => { sc.current?.setMode(mode === "2d" ? "2d" : "3d"); }, [mode]);

  if (pt?.loading) return <p>{t("pt.loading")}</p>;
  if (pt?.error) return <p>{t("pt.err")} <a href="#/map">{t("ov.onMap")}</a></p>;
  if (!p) return <p>{t("ui.loading")}</p>;
  const mr = idx?.windows?.[refId], mc = p.onDemand ? pt.dem.meta : idx?.windows?.[p.id];
  const refCard = (
    <PlaceCard key="r" body={profile} title={`${names[0]} – ${mr?.title || refId}`} sub={reference?.label}
      chips={[["grid", "30 m"], ["product", profile === "moon" ? "LDEM_80S_20M" : "CTX DTM (R2)"], ["src", profile === "moon" ? "NASA PDS" : "USGS"]]}
      details={[[t("ov.d.coord"), mr ? `${fmt(mr.lat, 3)}°, ${fmt(mr.lon, 3)}°` : null], [t("cmp.elev"), mr ? `${fmt(mr.z_min, 0)} – ${fmt(mr.z_max, 0)} m` : null], [t("ov.d.product"), mr?.product]]} />
  );
  const earthCard = p.onDemand ? (
    <PlaceCard key="e" body="earth" title={t("ov.pt.title")} sub={`${t("ov.pt.sub")} · ${t("pt.approx")}`}
      chips={[["grid", "30 m"], ["product", "Terrain Tiles"], ["src", t("ov.pt.approx")], ["range", mc.z_min != null ? `${fmt(mc.z_min, 0)}–${fmt(mc.z_max, 0)} m` : null]]}
      details={[[t("ov.d.coord"), `${fmt(p.center_lat, 4)}°, ${fmt(p.center_lon, 4)}°`], [t("ov.d.product"), mc.product]]}>
      <CandPicker list={list} value="" onPick={setPick} />
    </PlaceCard>
  ) : (
    <PlaceCard key="e" body="earth" title={`${names[1]} – ${regionLabel(p.region)}`} sub={`${t("list.code")}: ${p.id}`}
      chips={[["grid", "30 m"], ["product", "NASADEM_HGT v001"], ["src", "NASA LP DAAC"], ["range", mc ? `${fmt(mc.z_min, 0)}–${fmt(mc.z_max, 0)} m` : null]]}
      details={[[t("ov.d.coord"), `${fmt(p.center_lat, 3)}°, ${fmt(p.center_lon, 3)}°`], [t("map.rank"), `#${p.rank}`], [t("ov.d.product"), mc?.product]]}>
      <CandPicker list={list} value={p.id} onPick={setPick} />
    </PlaceCard>
  );
  const cards = swapped ? [earthCard, refCard] : [refCard, earthCard];
  const profA = dems.r ? centreProfile(dems.r) : [], profB = dems.c ? centreProfile(dems.c) : [];
  const download = () => {
    const out = { product: "ANALOG GAP overview", generated: new Date().toISOString(), target: profile, reference: refId, candidate: p.id, terrain_distance_D: p.D,
      d: p.d, candidate_percentiles: p.derived_percentiles, reference_percentiles: reference?.variables && Object.fromEntries(Object.entries(reference.variables).map(([k, v]) => [k, { p10: v.p10, p50: v.p50, p90: v.p90 }])),
      sources: [mr?.product, mc?.product], note: t("ov.dlNote") };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = `analog-gap-${profile}-${p.id}.json`; a.click();
  };

  return (
    <div className={"ov" + (open ? "" : " ov-full")}>
      <div className="ov-top">{cards[0]}<DistanceCard D={p.D} />{cards[1]}</div>
      {!zoomed ? (
      <div className="ov-stage ov-intro" onWheelCapture={(e) => { if (e.deltaY < 0) setZoomed(true); }} onDoubleClick={() => setZoomed(true)}>
        <div className="ov-globes">
          <GlobeView body={profile} compact photo={import.meta.env.BASE_URL + "data/tex/" + (profile === "moon" ? "moon_lroc_color_2048.jpg" : "mars_viking_clr_2048.jpg")} markers={mr ? [{ id: "", lat: mr.lat, lon: mr.lon, kind: "ref", label: mr.title }] : []} />
          <GlobeView body="earth" compact photo={PHOTO} markers={[{ id: "", lat: p.center_lat, lon: p.center_lon, kind: "cand", label: p.id }]} />
        </div>
        <button className="ov-zoom" onClick={() => setZoomed(true)}>{t("ov.zoomIn")}</button>
      </div>
      ) : (
      <div className="ov-stage">
        {gl ? <div ref={host} className="ov-canvas" aria-label={t("ov.aria")} /> : <p className="ov-nogl">{t("cmp.fallback")}</p>}
        {(!dems.r || !dems.c) && <p className="ov-load">{t("cmp.loading")}</p>}
        <button className="ov-swap" onClick={() => setSwapped(!swapped)} aria-label={t("ov.swap")} title={t("ov.swap")}>⇄</button>
        <div className="ov-ctrl">
          <button onClick={() => setZoomed(false)} aria-label={t("ov.zoomOut")} title={t("ov.zoomOut")}>🪐</button>
          <button onClick={() => sc.current?.north()} aria-label={t("ov.north")} title={t("ov.north")}>N</button>
          <button onClick={() => sc.current?.zoom(0.8)} aria-label={t("globe.zoomin")}>+</button>
          <button onClick={() => sc.current?.zoom(1.25)} aria-label={t("globe.zoomout")}>−</button>
        </div>
        <p className="ov-note">{t("ov.exag").replace("{x}", EXAG)} · {t("ov.layer." + layer + ".d")}</p>
      </div>
      )}
      <Stations D={D} profile={profile} reference={reference} p={p} dems={dems} />
      <Panel layer={layer} setLayer={setLayer} mode={mode} setMode={setMode} open={open} setOpen={setOpen}
        profile={{ a: swapped ? profB : profA, b: swapped ? profA : profB, labels: swapped ? [names[1], names[0]] : names, big: mode === "profile" }}
        stats={statRows(reference, p, mr, mc, names)} actions={{ report: p.onDemand ? null : `#/report/${p.id}/${profile}`, download }} />
      <details className="ov-more"><summary>{t("ov.moreInfo")}</summary><div className="ov-grid2"><ClimateBox lat={p.center_lat} lon={p.center_lon} /><LinksBox lat={p.center_lat} lon={p.center_lon} profile={profile} /></div></details>
    </div>
  );
}
