// Birim hareketi: istasyona düz çizgi rota, her iki tarafta kendi DEM yüzeyinde. Süre/hız yalnızca görseldir (gerçek performans değildir).
// Kart açıkken hareket yoktur: varışta onArrive çağrılır (kart açılır), yeni hareket kart kapatıldıktan sonra başlar.
import { useCallback, useEffect, useRef, useState } from "react";
import { SETTINGS } from "../../config.js";
import { layout, buildRoute, pointAt } from "../compare/route.js";

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** dems: [sol, sağ]; onStart(idx) / onArrive(idx) son sürümüyle çağrılır. -> { moving: {idx, dur, gaps}|null, start(idx), skip() } */
export function useMove(rigRef, dems, count, { onStart, onArrive, labels }) {
  const [moving, setMoving] = useState(null);
  const S = useRef({ lay: [null, null], cur: [null, null], at: null, run: null });
  const cb = useRef({}); cb.current = { onStart, onArrive }; const lab = useRef(labels); lab.current = labels;

  const finish = useCallback(() => {
    const s = S.current, r = s.run; if (!r) return;
    cancelAnimationFrame(r.raf); s.run = null;
    r.routes.forEach((rt, k) => {
      if (!rt) return;
      const last = rt.pts[rt.pts.length - 1]; s.cur[k] = last;
      rigRef.current?.setUnitPos(k, { ...last, heading: pointAt(rt.pts, 1).heading }); rigRef.current?.setRoute(k, null);
    });
    s.at = r.idx; setMoving(null); cb.current.onArrive?.(r.idx);
  }, [rigRef]);

  // DEM değişince yerleşimi ve konumu sıfırla (rig kendi tarafında birimi merkeze koyar).
  useEffect(() => {
    const s = S.current; if (s.run) { cancelAnimationFrame(s.run.raf); s.run = null; }
    s.lay = dems.map((d) => (d ? layout(d, count) : null)); s.cur = s.lay.map((l) => l && l.start); s.at = null;
    dems.forEach((d, k) => {
      rigRef.current?.setStations(k, s.lay[k] ? s.lay[k].spots : null, lab.current); rigRef.current?.setRoute(k, null);
      if (s.cur[k]) rigRef.current?.setUnitPos(k, { ...s.cur[k], heading: 0 });
    });
    setMoving(null);
  }, [dems[0], dems[1], count, rigRef]);
  useEffect(() => () => { if (S.current.run) cancelAnimationFrame(S.current.run.raf); }, []);

  const start = useCallback((idx) => {
    const s = S.current; if (s.run) return;
    const routes = dems.map((d, k) => (d && s.cur[k] && s.lay[k]?.spots[idx] ? buildRoute(d, s.cur[k], s.lay[k].spots[idx]) : null));
    if (s.at === idx || !routes.some(Boolean)) { s.at = idx; cb.current.onArrive?.(idx); return; }          // zaten orada / rota kurulamadı: yalnızca kart
    const dur = Math.max(0.5, Math.max(...routes.map((r) => (r ? r.length : 0))) / SETTINGS.moveSpeedKmPerS) * 1000;
    const run = { idx, routes, raf: 0, lastH: s.cur.map((c) => c && c.h), pos: s.cur.slice() }; s.run = run;
    routes.forEach((rt, k) => rigRef.current?.setRoute(k, rt && rt.pts));
    setMoving({ idx, dur, gaps: routes.reduce((a, r) => a + (r ? r.gaps : 0), 0) });
    cb.current.onStart?.(idx);
    if (reduced() || !rigRef.current) { finish(); return; }          // hareket azaltma tercihi / WebGL yok: animasyonsuz varış
    const t0 = performance.now();
    const tick = (now) => {
      if (S.current.run !== run) return;
      const p = Math.min((now - t0) / dur, 1);
      routes.forEach((rt, k) => {
        if (!rt) return;
        const q = pointAt(rt.pts, p);
        if (Number.isNaN(q.h)) q.h = run.lastH[k]; else run.lastH[k] = q.h;     // veri boşluğunda son geçerli yükseklik; uydurma yok
        run.pos[k] = q; rigRef.current?.setUnitPos(k, q);
      });
      if (p >= 1) finish(); else run.raf = requestAnimationFrame(tick);
    };
    run.raf = requestAnimationFrame(tick);
  }, [dems[0], dems[1], rigRef, finish]);

  // Durdur: varış olmadan hareketi keser; birim bulunduğu yerde kalır (sonraki rota oradan başlar).
  const cancel = useCallback(() => {
    const s = S.current, r = s.run; if (!r) return;
    cancelAnimationFrame(r.raf); s.run = null; s.at = null;
    r.pos.forEach((q, k) => { if (q) s.cur[k] = { x: q.x, z: q.z, h: q.h }; rigRef.current?.setRoute(k, null); });
    setMoving(null);
  }, [rigRef]);

  return { moving, start, skip: finish, cancel };
}
