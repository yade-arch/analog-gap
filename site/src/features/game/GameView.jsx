import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createStage } from "./engine/stage.js";
import { makePlanetView } from "./engine/planetView.js";
import { makeTerrainView } from "./engine/terrainView.js";
import { createRover, ROVER_SCALE } from "./engine/rover.js";
import { MODELS } from "../compare/unitModels.js";
import { loadDem } from "../compare/demLoader.js";
import { SETTINGS } from "../../config.js";
import { candMarkers, candOf, refMarkers, refOf, roverLimit } from "./data.js";

const SUIT_TINT = { suit1: 0xffffff, suit2: 0xbfd9ff };          // görsel ayrım (Simülasyon varsayımı); gerçek giysi değil

function astronaut(tv) {
  const o = MODELS.astronaut(); o.scale.setScalar(ROVER_SCALE);
  o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.userData.c0 = m.material.color.clone(); } });
  const p = tv.start || { x: 0, z: 0 }; o.position.set(p.x, tv.height(p.x, p.z) || 0, p.z); o.rotation.y = -Math.PI / 2;
  tv.add(o); return o;
}

/** Oyun sahnesi köprüsü: aşamaya göre görünümleri kurar; sürüşü kare döngüsünde işler. Ekrana veri yazmaz. */
export default function GameView({ profile, D, phase, sel, suit, done = [], dems, paused, keys, onPick, onNear, onBlocked, onLanded, anchorRef }) {
  const host = useRef(null), stage = useRef(null), field = useRef({});
  const cb = useRef({}); cb.current = { onPick, onNear, onBlocked, onLanded, paused };
  const group = phase === "intro" ? "intro" : phase === "explore" ? "explore" : phase === "menu" ? "menu" : "field";
  const refId = SETTINGS.references[profile][0];
  const refM = useMemo(() => refMarkers(refOf(D, profile)), [D, profile]);
  // DEM'i olan aday parlak (inilebilir), olmayan soluk: oyuncu arazi verisi olan bölgeyi görerek seçer.
  const cands = useMemo(() => candMarkers(candOf(D, profile)).map((m) => ({ ...m, color: dems?.[m.id] ? 0x9fd0ff : 0x3d5a78 })), [D, profile, dems]);

  useEffect(() => { stage.current = createStage(host.current); return () => stage.current.dispose(); }, []);

  useEffect(() => {                                   // görünümleri aşama grubuna göre kur
    const st = stage.current, live = { on: true }; field.current = {};
    if (group === "menu") {
      st.setLayout("split");
      st.setView("left", makePlanetView(st.els.left, "earth")); st.setView("right", makePlanetView(st.els.right, profile));
    }
    if (group === "intro") {
      st.setLayout("right"); st.setView("left", null);
      const pv = makePlanetView(st.els.right, profile); pv.setDistance(9); st.setView("right", pv);
      const tgt = refM[0] || { lat: 0, lon: 0 }; pv.flyTo(tgt.lat, tgt.lon, 1.25, 3.6);
      const t = setTimeout(() => loadDem(refId).then((dem) => {
        if (!live.on) return;
        const tv = makeTerrainView(st.els.right, dem, profile, { spots: 0 }); st.setView("right", tv);
        const a = astronaut(tv); field.current.astro = a; tv.descend(a.position, 3.2);
        setTimeout(() => live.on && cb.current.onLanded?.(), 3300);
      }).catch(() => live.on && cb.current.onLanded?.()), 3700);
      return () => { live.on = false; clearTimeout(t); };
    }
    if (group === "explore") {
      st.setLayout("split");
      st.setView("left", makePlanetView(st.els.left, "earth", { markers: cands, onPick: (m) => cb.current.onPick?.(m) }));
      st.setView("right", makePlanetView(st.els.right, profile, { markers: refM, color: 0xffd27a }));
    }
    if (group === "field" && sel) {
      st.setLayout("split");
      Promise.all([loadDem(sel.id), loadDem(refId)]).then(([dc, dr]) => {
        if (!live.on) return;
        const tl = makeTerrainView(st.els.left, dc, "earth"), tr = makeTerrainView(st.els.right, dr, profile, { spots: 0 });
        st.setView("left", tl); st.setView("right", tr);
        const lim = roverLimit(D.params, profile);
        field.current = { tl, tr, rover: createRover(tl, lim?.num), astro: astronaut(tr) };
        tr.follow(field.current.astro);
      });
    }
    return () => { live.on = false; };
  }, [group, profile, group === "field" ? sel?.id : null, group === "explore" ? cands : null]);

  useEffect(() => {                                   // keşif: seçilen adaya uç
    const v = stage.current?.view("left");
    if (group === "explore" && sel && v?.flyTo) { v.flyTo(sel.center_lat, sel.center_lon, 1.45); v.select({ lat: sel.center_lat, lon: sel.center_lon }); }
  }, [sel?.id, group]);

  useEffect(() => {                                   // yerleşim: kıyafet = sağ geniş, sonuç = sağ tam ekran
    const st = stage.current; if (!st || group !== "field") return;
    st.setLayout(phase === "result" ? "right" : "split");
  }, [phase, group]);

  useEffect(() => {                                   // kıyafet seçimi sahneye yansır
    const a = field.current.astro; if (!a || !suit) return;
    a.scale.setScalar(ROVER_SCALE * (suit === "suit1" ? 1.18 : 0.95));
    a.traverse((m) => { if (m.isMesh && m.userData.c0) m.material.color.copy(m.userData.c0).lerp(new THREE.Color(SUIT_TINT[suit]), 0.5); });
  }, [suit]);

  useEffect(() => stage.current.onFrame((dt) => {     // sürüş + konuşma balonu konumu
    const f = field.current, c = cb.current;
    if (f.rover && phase === "drive" && !c.paused) {
      const b = f.rover.update(dt, keys.current); if (b) c.onBlocked?.(b);
      const near = f.tl.points.findIndex((p) => p && !p.done && f.rover.near(p));
      if (near !== f.lastNear) { f.lastNear = near; c.onNear?.(near); }
    }
    const a = f.astro;
    if (anchorRef && a) anchorRef.current = stage.current.project("right", a.position.clone().add(new THREE.Vector3(0, 0.75, 0)));
    else if (anchorRef) anchorRef.current = null;
  }), [phase]);

  useEffect(() => { for (const i of done) field.current.tl?.markDone(i); }, [done.join(",")]);

  return <div ref={host} className="g-stage" />;
}
