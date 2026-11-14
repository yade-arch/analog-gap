import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createStage } from "./engine/stage.js";
import { makePlanetView } from "./engine/planetView.js";
import { makeTerrainView } from "./engine/terrainView.js";
import { createRover, KEYMAPS, ROVER_SCALE } from "./engine/rover.js";
import { astronaut, lander } from "./engine/voxel.js";
import { loadDem } from "../compare/demLoader.js";
import { SETTINGS } from "../../config.js";
import { candMarkers, candOf, refMarkers, refOf, roverLimit } from "./data.js";

const UP = new THREE.Vector3(0, 0.55, 0);

/** Kaza alanı: arızalı iniş aracı + astronot (başlangıç noktasının yanında). */
function crashSite(tv, suit, withLander = true) {
  const p = tv.start || { x: 0, z: 0 }, y = (x, z) => tv.height(x, z) || 0;
  if (withLander) { const l = lander(); l.scale.setScalar(0.45); l.position.set(p.x - 0.9, y(p.x - 0.9, p.z - 0.5), p.z - 0.5); tv.add(l); }
  const a = astronaut(suit || "base"); a.scale.setScalar(ROVER_SCALE * 1.4); a.position.set(p.x - 0.35, y(p.x - 0.35, p.z + 0.2), p.z + 0.2); a.rotation.y = -0.6; tv.add(a);
  return a;
}

/** Sahne köprüsü. Sol yuva = hedef gövde (Ay/Mars), sağ yuva = Dünya. Tek oyunculuda yalnızca sol (tam ekran). */
export default function GameView({ profile, D, phase, mode, sel, suit, region, dems, done, paused, keys, onPick, onArrive, onBlocked, onLanded, anchors, hud }) {
  const host = useRef(null), stage = useRef(null), F = useRef({});
  const cb = useRef({}); cb.current = { onPick, onArrive, onBlocked, onLanded, paused, phase, done };
  const group = ["drive", "suit", "result"].includes(phase) ? "field" : phase;
  const refId = SETTINGS.references[profile][0];
  const refM = useMemo(() => refMarkers(refOf(D, profile)), [D, profile]);
  const cands = useMemo(() => candMarkers(candOf(D, profile)).map((m) => ({ ...m, hot: !!dems?.[m.id], color: dems?.[m.id] ? 0x9fd0ff : 0x3d5a78 })), [D, profile, dems]);

  useEffect(() => { stage.current = createStage(host.current); return () => stage.current.dispose(); }, []);

  useEffect(() => {
    const st = stage.current, live = { on: true }, F0 = (F.current = {});
    const planets = () => {
      st.setView("left", makePlanetView(st.els.left, profile, { markers: refM, color: 0xffd27a }));
      st.setView("right", makePlanetView(st.els.right, "earth", { markers: cands, onPick: (m) => cb.current.onPick?.(m) }));
    };
    if (group === "menu" || group === "explore") { st.setLayout("split"); planets(); }
    if (group === "intro") {
      st.setLayout("left"); st.setView("right", null);
      const pv = makePlanetView(st.els.left, profile); pv.setDistance(9); st.setView("left", pv);
      const tg = refM[0] || { lat: 0, lon: 0 }; pv.flyTo(tg.lat, tg.lon, 1.25, 3.6);
      const t = setTimeout(() => loadDem(refId).then((dem) => {
        if (!live.on) return;
        const tv = makeTerrainView(st.els.left, dem, profile, { spots: 0 }); st.setView("left", tv);
        F0.astro = crashSite(tv, null); tv.descend(F0.astro.position, 3.2);
        setTimeout(() => live.on && cb.current.onLanded?.(), 3300);
      }).catch(() => live.on && cb.current.onLanded?.()), 3700);
      return () => { live.on = false; clearTimeout(t); };
    }
    if (group === "field" && sel) {
      Promise.all([loadDem(refId), mode === "multi" ? loadDem(sel.id) : null]).then(([dr, dc]) => {
        if (!live.on) return;
        const tl = makeTerrainView(st.els.left, dr, profile); st.setView("left", tl);
        F0.tl = tl; F0.astro = crashSite(tl, suit);
        F0.r1 = createRover(tl, roverLimit(D.params, profile)?.num, mode === "multi" ? KEYMAPS.p1 : KEYMAPS.solo); tl.chase(F0.r1.obj);
        if (dc) {
          const tr = makeTerrainView(st.els.right, dc, "earth"); st.setView("right", tr); F0.tr = tr;
          F0.r2 = createRover(tr, roverLimit(D.params, profile)?.num, KEYMAPS.p2, 0x2a6fd6); tr.chase(F0.r2.obj);
        } else st.setView("right", null);
        st.setLayout(mode === "multi" ? "split" : "left");
      });
    }
    return () => { live.on = false; };
  }, [group, profile, mode, group === "field" ? sel?.id : null, group === "menu" || group === "explore" ? cands : null]);

  useEffect(() => {                                   // keşif: bölge düğmesi veya aday seçimi -> Dünya kamerası oraya uçar
    const v = stage.current?.view("right"); if (group !== "explore" || !v?.flyTo) return;
    if (sel) { v.flyTo(sel.center_lat, sel.center_lon, 1.4); v.select({ lat: sel.center_lat, lon: sel.center_lon }); }
    else if (region) v.flyTo(region.lat, region.lon, 1.55);
  }, [sel?.id, region?.code, group]);

  useEffect(() => {                                   // kıyafet/sonuç: astronot seçilen kıyafeti giyer, kamera ona döner
    const f = F.current; if (!f.tl || !f.astro) return;
    if (phase === "result") {
      const old = f.astro; f.astro = crashSite(f.tl, suit, false); old.parent?.remove(old);
      f.tl.orbit(f.astro); stage.current.setLayout("left");
    }
  }, [phase, suit]);

  useEffect(() => { for (const i of done.p1 || []) F.current.tl?.markDone(i); for (const i of done.p2 || []) F.current.tr?.markDone(i); }, [JSON.stringify(done)]);

  useEffect(() => stage.current.onFrame((dt) => {      // sürüş, varış, HUD ve etiket konumları (React dışı)
    const f = F.current, c = cb.current, st = stage.current;
    const drive = c.phase === "drive" && !c.paused, out = {};
    for (const [k, r, tv, side] of [["p1", f.r1, f.tl, "left"], ["p2", f.r2, f.tr, "right"]]) {
      if (!r || !tv) continue;
      if (drive) {
        const b = r.update(dt, keys.current); if (b) c.onBlocked?.(b, k);
        const i = tv.points.findIndex((p) => p && !c.done[k]?.includes(p.i) && r.near(p));
        if (i >= 0) c.onArrive?.(k, i);
      }
      const next = tv.points.filter((p) => p && !c.done[k]?.includes(p.i)).sort((a, b) => r.dist(a) - r.dist(b))[0];
      const pos = next && st.project(side, next.obj.position.clone().add(new THREE.Vector3(0, 3.1, 0)));
      let dir = null;                                   // sıradaki noktanın yönü (aracın burnuna göre) ve uzaklığı
      if (next) { let a = Math.atan2(-(next.z - r.stats.z), next.x - r.stats.x) - r.stats.heading; a = Math.atan2(Math.sin(a), Math.cos(a)); dir = { a, m: Math.round(r.dist(next) * 1000) }; }
      out[k] = { ...r.stats, speed: Math.abs(r.stats.v), dir, tag: next && pos ? { ...pos, m: dir.m } : null };
    }
    if (hud) hud.current = out;
    if (anchors) anchors.current = f.astro ? st.project("left", f.astro.position.clone().add(UP)) : null;
  }), []);

  return <div ref={host} className="g-stage" />;
}
