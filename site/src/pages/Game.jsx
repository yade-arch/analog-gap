import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import "../game.css";
import useClock from "../features/game/useClock.js";
import useKeys from "../features/game/useKeys.js";
import { GAME, SUITS, TESTS } from "../features/game/rules.js";
import { candOf, outcome, refOf, regionCenters, riskFlags, roverLimit } from "../features/game/data.js";
import { introLines, pickLine, resultLines, testLine } from "../features/game/script.js";
import { webglOK } from "../features/compare/sceneRig.js";
import { loadDemIndex } from "../features/compare/demLoader.js";
import { TOUCH } from "../features/game/engine/stage.js";
import GameView from "../features/game/GameView.jsx";
import SuitScreen from "../features/game/SuitScreen.jsx";
import MissionReport from "../features/game/MissionReport.jsx";
import { EarthPanel, LandCard, LinkBadge, Location, Oxygen, Prompt, RegionBar, RoverHud, Speech, Toast, TouchPad, WaypointTags } from "../features/game/Hud.jsx";
import { PauseMenu, StartMenu } from "../features/game/Menus.jsx";

const PLAYING = ["explore", "drive", "suit"];

/** Emergency Analog Mission: tam ekran oyun. Tek oyunculu (hedef gövde tam ekran) veya aynı ekranda iki oyunculu (sol Ay/Mars, sağ Dünya). */
export default function Game({ D, profile, setProfile }) {
  const clock = useClock(), anchor = useRef(null), hud = useRef(null), [gl] = useState(() => webglOK());
  const [phase, setPhase] = useState("menu"), [mode, setMode] = useState("solo"), [paused, setPaused] = useState(false);
  const [sel, setSel] = useState(null), [region, setRegion] = useState(null), [seen, setSeen] = useState(() => new Set());
  const [done, setDone] = useState({ p1: [], p2: [] }), [suit, setSuit] = useState(null), [final, setFinal] = useState(null);
  const [toast, setToast] = useState(null), [speech, setSpeech] = useState(null), [ended, setEnded] = useState(false), [dems, setDems] = useState(null);
  const cand = candOf(D, profile), target = refOf(D, profile), regions = useMemo(() => regionCenters(cand), [cand]);
  const best = cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0];
  const reportHref = `#/report/${(sel || best)?.id || ""}/${profile}`;
  const tests = mode === "multi" ? done.p1.filter((i) => done.p2.includes(i)) : done.p1;
  const flags = riskFlags(profile, Object.fromEntries(tests.map((i) => [TESTS[i], true])), target, roverLimit(D.params, profile));
  const lastBlock = useRef(0), loc = t("game.loc." + profile);

  useEffect(() => { loadDemIndex().then((i) => setDems(i.windows)).catch(() => setDems({})); }, []);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { if (PLAYING.includes(phase)) { if (paused) clock.stop(); else clock.start(); } }, [paused, phase]);
  useEffect(() => { if (clock.left <= 0 && PLAYING.includes(phase)) finish("timeout", 0); }, [clock.left]);

  const reset = () => { clock.reset(); setPhase("menu"); setPaused(false); setSel(null); setRegion(null); setSeen(new Set()); setDone({ p1: [], p2: [] }); setSuit(null); setFinal(null); setEnded(false); setSpeech(null); };
  useEffect(reset, [profile]);
  const start = () => { document.documentElement.requestFullscreen?.().catch(() => {}); reset(); setPhase("intro"); };
  const say = (lines, then) => setSpeech({ lines, i: 0, then });
  const next = () => setSpeech((s) => { if (!s) return s; if (s.i + 1 < s.lines.length) return { ...s, i: s.i + 1 }; setTimeout(() => s.then?.(), 0); return null; });
  useEffect(() => { if (!speech) return undefined; const id = setTimeout(next, 5500); return () => clearTimeout(id); }, [speech?.i, speech?.lines]);

  function finish(result, left) {
    clock.stop(); setFinal({ result, left }); setPhase("result");
    say(resultLines(result, sel, D, profile, cand, tests).slice(0, 2), () => setEnded(true));
  }
  const pick = (m) => {
    const p = cand.features.find((f) => f.properties.id === m.id)?.properties; if (!p) return;
    if (!seen.has(p.id)) { clock.spend(GAME.cost.inspect, "inspect"); setSeen(new Set(seen).add(p.id)); }
    setSel(p);
  };
  const land = () => {
    if (!sel) return;
    if (mode === "multi" && !dems?.[sel.id]) { setToast(t("game.msg.nodem")); return; }
    setPhase("drive"); setToast(t(mode === "multi" ? "game.msg.drive.multi" : "game.msg.drive"));
  };
  const doneRef = useRef(done); doneRef.current = done;
  const arrive = (k, i) => {                          // varış: ref ile tek sefer (kare döngüsü aynı karede tekrar çağırabilir)
    const d = doneRef.current; if (d[k].includes(i)) return;
    const nd = { ...d, [k]: [...d[k], i] }; doneRef.current = nd; setDone(nd);
    if (mode === "multi" && !(nd.p1.includes(i) && nd.p2.includes(i))) { setToast(t("game.msg.wait." + k)); return; }
    clock.spend(GAME.cost.test, TESTS[i]); setToast(testLine(i, sel, D, profile, target));
  };
  const confirmSuit = (id) => {
    const s = SUITS[id], after = Math.max(0, clock.left - GAME.cost.suit), res = outcome(s, after, flags);
    setSuit(id); clock.spend(GAME.cost.suit, "suit"); finish(res, res === "nooxygen" ? 0 : after - s.returnMin);
  };

  if (import.meta.env.DEV) window.__gameDebug = { pick: (id) => pick({ id }), arrive };   // yalnızca geliştirme: uçtan uca test kancası
  const keys = useKeys((k) => {
    if (phase === "menu") return;
    if (k === "escape") { setPaused((p) => !p); return; }
    if (paused) return;
    if (speech && (k === "e" || k === "enter" || k === " ")) { next(); return; }
    if (phase === "explore" && k === "e") land();
    if (phase === "drive" && k === "t") setPhase("suit");
  });

  const prompt = speech || paused ? null
    <div className="g-story" role="note"><svg className="g-pxman" viewBox="0 0 8 12" width="32" height="48" aria-hidden="true" shapeRendering="crispEdges"><rect x="2" y="0" width="4" height="3" fill="#ffd9b0"/><rect x="2" y="3" width="4" height="4" fill="#4d8fe6"/><rect x="0" y="3" width="2" height="3" fill="#4d8fe6"/><rect x="6" y="3" width="2" height="3" fill="#4d8fe6"/><rect x="2" y="7" width="1.6" height="4" fill="#2b3a5c"/><rect x="4.4" y="7" width="1.6" height="4" fill="#2b3a5c"/></svg><p>{t("game.story.find")}</p></div>
    : phase === "explore" ? (sel ? null : t("game.prompt.pick"))
    : phase === "drive" ? t(tests.length >= 3 ? "game.prompt.suit" : mode === "multi" ? "game.prompt.drive.multi" : "game.prompt.drive")
    : null;

  return (
    <div className={"g-root g-" + phase + " g-mode-" + mode}>
      {gl && <GameView profile={profile} D={D} phase={phase} mode={mode} sel={sel} suit={suit} region={region} dems={dems} done={done} paused={paused} keys={keys} anchors={anchor} hud={hud}
        onPick={pick} onArrive={arrive} onLanded={() => say([loc, ...introLines(profile)], () => { setPhase("explore"); setToast(t("game.msg.start")); })}
        onBlocked={(b) => { const n = performance.now(); if (n - lastBlock.current > 3000) { lastBlock.current = n; setToast(t("game.msg.block." + b)); } }} />}
      {phase === "menu" && <StartMenu profile={profile} setProfile={setProfile} mode={mode} setMode={setMode} onStart={start} gl={gl} reportHref={reportHref} />}
      {PLAYING.includes(phase) && <Oxygen clock={clock} />}
      {(phase === "intro" || phase === "drive" || phase === "result") && <Location text={loc} />}
      {phase === "explore" && !paused && <><Location text={t("game.loc.pick")} side="right" /><RegionBar regions={regions} onGo={(r) => { setSel(null); setRegion(r); }} /></>}
      {phase === "explore" && sel && !paused && <LandCard p={sel} line={pickLine(sel, D)} onLand={land} onCancel={() => setSel(null)} />}
      {phase === "drive" && <><RoverHud hud={hud} who="p1" /><WaypointTags hud={hud} /></>}
      {phase === "drive" && mode === "solo" && <EarthPanel sel={sel} n={tests.length} of={3} />}
      {phase === "drive" && mode === "multi" && <><RoverHud hud={hud} who="p2" side="right" /><Location text={regionLabel(sel?.region)} side="right" /><LinkBadge n={tests.length} of={3} /></>}
      <Speech text={speech?.lines[speech.i]} anchorRef={anchor} onNext={next} />
      <Toast text={toast} />
      <Prompt text={prompt} />
      {phase === "suit" && !paused && <SuitScreen suit={suit} setSuit={setSuit} onConfirm={confirmSuit} left={clock.left} />}
      {phase === "result" && ended && <MissionReport result={final?.result || "timeout"} p={sel} D={D} profile={profile} cand={cand} suit={suit} left={final?.left ?? 0} reportHref={reportHref} onAgain={reset} />}
      {TOUCH && phase === "drive" && !paused && <TouchPad keys={keys} actions={[["t", "T", () => setPhase("suit")]]} />}
      {phase !== "menu" && !paused && <button className="g-pausebtn" onClick={() => setPaused(true)} aria-label={t("game.pause.title")}>II</button>}
      {paused && <PauseMenu onResume={() => setPaused(false)} onRestart={reset} reportHref={reportHref} />}
    </div>
  );
}
