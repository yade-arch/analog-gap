import { useEffect, useRef, useState } from "react";
import { GAME } from "./rules.js";

/** Oksijen/süre sayacı: çalışırken her GAME.tickMs'de 1 oyun dakikası azalır; spend(n) eylem maliyeti düşer. */
export default function useClock() {
  const [left, setLeft] = useState(GAME.startMin);
  const [running, setRunning] = useState(false);
  const log = useRef([]);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setLeft((v) => Math.max(0, v - 1)), GAME.tickMs);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (left <= 0) setRunning(false); }, [left]);
  const spend = (n, what) => { log.current.push({ what, n }); setLeft((v) => Math.max(0, v - n)); };
  const reset = () => { log.current = []; setLeft(GAME.startMin); setRunning(false); };
  const frac = left / GAME.startMin;
  const level = frac <= GAME.critFrac ? "crit" : frac <= GAME.warnFrac ? "warn" : "ok";
  return { left, frac, level, running, start: () => setRunning(true), stop: () => setRunning(false), spend, reset, log: log.current };
}
