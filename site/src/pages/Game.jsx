import React, { useEffect, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import "../game.css";
import useClock from "../features/game/useClock.js";
import useKeys from "../features/game/useKeys.js";
import { GAME, SUITS, TESTS } from "../features/game/rules.js";
import { candOf, outcome, refOf, riskFlags, roverLimit } from "../features/game/data.js";
import { introLines, pickLine, resultLines, testLine } from "../features/game/script.js";
import { webglOK } from "../features/compare/sceneRig.js";
import { loadDemIndex } from "../features/compare/demLoader.js";
import { TOUCH } from "../features/game/engine/stage.js";
import GameView from "../features/game/GameView.jsx";
import { Oxygen, Prompt, Speech, SuitPick, Toast, TouchPad } from "../features/game/Hud.jsx";
import { PauseMenu, StartMenu } from "../features/game/Menus.jsx";

const PLAYING = ["explore", "drive", "suit"];

/** Emergency Analog Mission: tam ekran oyun. Ekranda veri tablosu yok; bilimsel değerler rapordadır (#/report). */
export default function Game({ D, profile, setProfile }) {
  const clock = useClock(), anchor = useRef(null), [gl] = useState(() => webglOK());
  const [phase, setPhase] = useState("menu"), [paused, setPaused] = useState(false);
  const [sel, setSel] = useState(null), [seen, setSeen] = useState(() => new Set()), [done, setDone] = useState([]);
  const [suit, setSuit] = useState(null), [ended, setEnded] = useState(false);
  const [toast, setToast] = useState(null), [speech, setSpeech] = useState(null), [near, setNear] = useState(-1), [dems, setDems] = useState(null);
  const cand = candOf(D, profile), target = refOf(D, profile);
  const best = cand?.features.map((f) => f.properties).sort((a, b) => a.rank - b.rank)[0];
  const reportHref = `#/report/${(sel || best)?.id || ""}/${profile}`;
  const doneMap = Object.fromEntries(done.map((i) => [TESTS[i], true]));
  const flags = riskFlags(profile, doneMap, target, roverLimit(D.params, profile));
  const lastBlock = useRef(0);

  useEffect(() => { loadDemIndex().then((i) => setDems(i.windows)).catch(() => setDems({})); }, []);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 3800); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { if (PLAYING.includes(phase)) { if (paused) clock.stop(); else clock.start(); } }, [paused, phase]);
  useEffect(() => { if (clock.left <= 0 && PLAYING.includes(phase)) finish("timeout"); }, [clock.left]);
  useEffect(() => () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, []);

  const reset = () => { clock.reset(); setPhase("menu"); setPaused(false); setSel(null); setSeen(new Set()); setDone([]); setSuit(null); setEnded(false); setSpeech(null); setNear(-1); };
  useEffect(reset, [profile]);
  const start = () => { document.documentElement.requestFullscreen?.().catch(() => {}); reset(); setPhase("intro"); };
  const say = (lines, then) => setSpeech({ lines, i: 0, then });
  const next = () => setSpeech((s) => { if (!s) return s; if (s.i + 1 < s.lines.length) return { ...s, i: s.i + 1 }; setTimeout(() => s.then?.(), 0); return null; });
  useEffect(() => { if (!speech) return undefined; const id = setTimeout(next, 5200); return () => clearTimeout(id); }, [speech?.i, speech?.lines]);

  function finish(result) {
    clock.stop(); setPhase("result");
    say(resultLines(result, sel, D, profile, cand, done), () => setEnded(true));
  }
  const pick = (m) => {
    const p = cand.features.find((f) => f.properties.id === m.id)?.properties; if (!p) return;
    if (!seen.has(p.id)) { clock.spend(GAME.cost.inspect, "inspect"); setSeen(new Set(seen).add(p.id)); }
    setSel(p); setToast(pickLine(p, D));
  };
  const runTest = () => {
    if (near < 0 || done.includes(near)) return;
    clock.spend(GAME.cost.test, TESTS[near]); setDone([...done, near]); setToast(testLine(near, sel, D, profile, target));
  };
  const confirmSuit = () => {
    const s = SUITS[suit], after = Math.max(0, clock.left - GAME.cost.suit);
    clock.spend(GAME.cost.suit, "suit"); finish(outcome(s, after, flags));
  };
  const land = () => {
    if (!sel) return;
    if (!dems?.[sel.id]) { setToast(t("game.msg.nodem")); return; }
    setPhase("drive"); setToast(t("game.msg.drive"));
  };

  const keys = useKeys((k) => {
    if (phase === "menu") return;
    if (k === "escape") { setPaused((p) => !p); return; }
    if (paused) return;
    if (speech && (k === "e" || k === "enter" || k === " ")) { next(); return; }
    if (phase === "explore" && k === "e") land();
    if (phase === "drive" && k === "e") runTest();
    if (phase === "drive" && k === "t") setPhase("suit");
    if (phase === "suit" && (k === "1" || k === "2")) setSuit(k === "1" ? "suit1" : "suit2");
    if (phase === "suit" && k === "enter" && suit) confirmSuit();
  });

  const prompt = speech || paused ? null
    : phase === "explore" ? (sel ? t(dems?.[sel.id] ? "game.prompt.land" : "game.msg.nodem") : t("game.prompt.pick"))
    : phase === "drive" ? (near >= 0 && !done.includes(near) ? t("game.prompt.test." + TESTS[near]) : t("game.prompt.drive"))
    : null;
  const act = () => (phase === "explore" ? land() : runTest());

  return (
    <div className={"g-root g-" + phase}>
      {gl && <GameView profile={profile} D={D} phase={phase} sel={sel} suit={suit} done={done} dems={dems} paused={paused} keys={keys} anchorRef={anchor}
        onPick={pick} onNear={setNear} onLanded={() => say(introLines(profile), () => { setPhase("explore"); setToast(t("game.msg.start")); })}
        onBlocked={(b) => { const n = performance.now(); if (n - lastBlock.current > 2500) { lastBlock.current = n; setToast(t("game.msg.block." + b)); } }} />}
      {phase === "menu" && <StartMenu profile={profile} setProfile={setProfile} onStart={start} gl={gl} reportHref={reportHref} />}
      {PLAYING.includes(phase) && <Oxygen clock={clock} />}
      <Speech text={speech?.lines[speech.i]} anchorRef={anchor} onNext={next} />
      <Toast text={toast} />
      <Prompt text={prompt} />
      {phase === "suit" && !paused && <SuitPick suit={suit} setSuit={setSuit} onConfirm={confirmSuit} left={clock.left} />}
      {phase === "result" && ended && (
        <div className="g-end"><a className="g-start" href={reportHref}>{t("game.end.report")}</a><button className="g-btn" onClick={reset}>{t("game.end.again")}</button></div>
      )}
      {TOUCH && PLAYING.includes(phase) && !paused && <TouchPad keys={keys} actions={[["e", "E", act], ["t", "T", () => phase === "drive" && setPhase("suit")]]} />}
      {phase !== "menu" && !paused && <button className="g-pausebtn" onClick={() => setPaused(true)} aria-label={t("game.pause.title")}>II</button>}
      {paused && <PauseMenu onResume={() => setPaused(false)} onRestart={reset} reportHref={reportHref} />}
    </div>
  );
}
