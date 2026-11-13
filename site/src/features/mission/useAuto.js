// Otomatik görev: iki birim tüm istasyonları sırayla gezer. Her istasyonda kısa "ölçüm" durumu, sonra kart; "Devam" ile ya da kısa beklemeyle sonraki.
// Süreler (ölçüm / kart) yalnızca gösterim içindir: "Simülasyon varsayımı". Ölçüm değerleri Python sonuçlarından gelir (kartta).
import { useCallback, useEffect, useRef, useState } from "react";
import { SETTINGS } from "../../config.js";

/** count: istasyon sayısı. fns: { go(i) hareketi başlatır, move() hareketi atlar, cancelMove(), open(i) kartı açar, close() kartı kapatır }.
 *  -> { phase: idle|moving|measuring|card|done, idx, active, start, stop, next, skip, onArrive(i) -> true ise varış otomatik görev tarafından işlendi } */
export function useAuto(count, fns) {
  const [st, setSt] = useState({ phase: "idle", idx: -1 });
  const R = useRef({ phase: "idle", idx: -1, timer: 0 }), f = useRef(fns); f.current = fns;
  const put = (phase, idx) => { R.current.phase = phase; R.current.idx = idx; setSt({ phase, idx }); };
  const clear = () => clearTimeout(R.current.timer);
  useEffect(() => () => clearTimeout(R.current.timer), []);

  const begin = useCallback((i) => { put("moving", i); f.current.go(i); }, []);
  const next = useCallback(() => {
    clear(); const i = R.current.idx + 1; f.current.close();
    if (R.current.phase === "idle") return;
    if (i >= count) put("done", count - 1); else begin(i);
  }, [count, begin]);
  const openCard = useCallback(() => {
    clear(); const i = R.current.idx; put("card", i); f.current.open(i);
    R.current.timer = setTimeout(next, SETTINGS.autoCardMs);
  }, [next]);

  const start = useCallback(() => { clear(); f.current.close(); f.current.reset?.(); begin(0); }, [begin]);
  const stop = useCallback(() => { clear(); const was = R.current.phase; put("idle", -1); if (was === "moving") f.current.cancelMove(); f.current.close(); }, []);
  const skip = useCallback(() => {
    const p = R.current.phase;
    if (p === "moving") f.current.move(); else if (p === "measuring") openCard(); else if (p === "card") next();
  }, [openCard, next]);
  const onArrive = useCallback((i) => {
    if (R.current.phase !== "moving") return false;
    put("measuring", i); clear(); R.current.timer = setTimeout(openCard, SETTINGS.autoMeasureMs); return true;
  }, [openCard]);

  return { phase: st.phase, idx: st.idx, active: st.phase !== "idle" && st.phase !== "done", start, stop, next, skip, onArrive };
}
