import React, { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import { regionLabel } from "../i18n/terms.js";
import "../game.css";
import "../rescue.css";
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
import { addLog } from "../features/game/logbook.js";
import { EarthPanel, LandCard, LinkBadge, Location, Oxygen, Prompt, RegionBar, RoverHud, Speech, Toast, TouchPad, WaypointTags } from "../features/game/Hud.jsx";
import { PauseMenu, StartMenu } from "../features/game/Menus.jsx";
import useRescue from "../features/game/useRescue.js";
import { tf } from "../features/game/ui.jsx";
import { Garage, Loadout as GearLoadout, Stress, Telemetry, Uplink, beep } from "../features/game/GearUI.jsx";
import { testGear, zonesOf, FAIL_MIN } from "../features/game/gear.js";
import { Decision, DriveHud, EarthDesk, EarthSurvey, Loadout, Transmit } from "../features/game/RescueUI.jsx";
import RescueResult from "../features/game/RescueResult.jsx";

const PLAYING = ["explore", "drive", "suit", "transmit", "loadout", "earthdrive"];

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
  const [gear2, setGear2] = useState({ suit: "carbon", mod: "mesh" }), [garage, setGarage] = useState(false), [elog, setElog] = useState([]), [up, setUp] = useState(0), [zones, setZones] = useState([]), [flash, setFlash] = useState(null), [look, setLook] = useState(null);
  const lastBlock = useRef(0), loc = t("game.loc." + profile), solo = mode === "solo";
  const say = (lines, then) => setSpeech({ lines, i: 0, then });
  const rescue = useRescue({ D, profile, clock, phase, setPhase, paused, hud, toast: setToast, say, on: solo });   // solo = Earth-to-Space Rescue
  const view = solo ? (["explore", "transmit"].includes(phase) ? rescue.site() : rescue.site(rescue.S.report)) : sel;

  useEffect(() => { loadDemIndex().then((i) => setDems(i.windows)).catch(() => setDems({})); }, []);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(null), 4200); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { if (PLAYING.includes(phase)) { if (paused) clock.stop(); else clock.start(); } }, [paused, phase]);
  useEffect(() => { if (clock.left <= 0 && PLAYING.includes(phase)) { if (solo) rescue.end("timeout"); else finish("timeout", 0); } }, [clock.left]);

  const reset = () => { clock.reset(); setPhase("menu"); setPaused(false); setSel(null); setRegion(null); setSeen(new Set()); setDone({ p1: [], p2: [] }); setSuit(null); setFinal(null); setEnded(false); setSpeech(null); rescue.reset(); setGarage(false); setElog([]); setUp(0); setZones([]); setLook(null); };
  useEffect(reset, [profile]);
  const start = () => { document.documentElement.requestFullscreen?.().catch(() => {}); reset(); setPhase("intro"); };
  const next = () => setSpeech((s) => { if (!s) return s; if (s.i + 1 < s.lines.length) return { ...s, i: s.i + 1 }; setTimeout(() => s.then?.(), 0); return null; });
  useEffect(() => { if (!speech) return undefined; const id = setTimeout(next, 5500); return () => clearTimeout(id); }, [speech?.i, speech?.lines]);

  useEffect(() => { const R = rescue.S.result; if (R) addLog({ profile, mode, region: rescue.site(rescue.S.report)?.region ?? null, id: rescue.S.report, suit: rescue.S.load?.suit, result: R.tier === "success" ? "success" : R.tier === "partial" ? "risky" : "timeout", left: R.left, tests: rescue.S.collected.length }); }, [rescue.S.result]);
  useEffect(() => { if (ended && final) addLog({ profile, mode, region: sel?.region ?? null, id: sel?.id ?? null, suit, result: final.result, left: final.left, tests: tests.length }); }, [ended]);   // one logbook line per finished mission
  function finish(result, left) {
    clock.stop(); setFinal({ result, left }); setPhase("result");
    say(resultLines(result, sel, D, profile, cand, tests).slice(0, 2), () => setEnded(true));
  }
  const pick = (m) => {
    if (solo) { rescue.investigate(m); return; }
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
  useEffect(() => { if (solo && (phase === "earthdrive" || phase === "drive")) { const z = { p1: [], p2: [] }; doneRef.current = z; setDone(z); } }, [phase]);   // fresh data points for each rover phase
  const arrive = (k, i) => {                          // varış: ref ile tek sefer (kare döngüsü aynı karede tekrar çağırabilir)
    if (solo && phase === "earthdrive") { if (k === "p1") rescue.earthArrive(i); const d1 = doneRef.current; if (!d1.p1.includes(i)) { const nd1 = { ...d1, p1: [...d1.p1, i] }; doneRef.current = nd1; setDone(nd1); } return; }
    if (solo) { if (k === "p1") { const d0 = doneRef.current; if (!d0.p1.includes(i)) { const nd0 = { ...d0, p1: [...d0.p1, i] }; doneRef.current = nd0; setDone(nd0); rescue.arrive(i); } } return; }
    const d = doneRef.current; if (d[k].includes(i)) return;
    const nd = { ...d, [k]: [...d[k], i] }; doneRef.current = nd; setDone(nd);
    if (k === "p2") earthTest(i);
    if (mode === "multi" && !(nd.p1.includes(i) && nd.p2.includes(i))) { if (k !== "p2") setToast(t("game.msg.wait." + k)); return; }
    clock.spend(GAME.cost.test, TESTS[i]); setToast(testLine(i, sel, D, profile, target));
  };
  function earthTest(i) {                              // Earth player reached beacon i: test the current gear against Moon/Mars zone i (game rule)
    const z = zones.find((x) => x.i === i); if (!z) return;
    const r = testGear(z, gear2.suit, gear2.mod), e = { i, suit: gear2.suit, mod: gear2.mod, ok: r.ok, why: r.why };
    setElog((l) => [...l, e]);
    if (r.ok) { setToast(tf("gear.verified", { s: t("gear." + e.suit), m: t("gear." + e.mod) })); beep(880, 120); }
    else { setToast(tf("gear.fail." + (r.why === "cold" || r.why === "hot" ? "suit" : "mod"), { g: t("gear." + (r.why === "cold" || r.why === "hot" ? e.suit : e.mod)), z: t("gear.z." + r.why) })); beep(220, 300); setFlash(r.why === "cold" ? "cold" : "hot"); setTimeout(() => setFlash(null), 700); }
  }
  const confirmGear = (g, fails) => {                 // left loadout: failing zones cost time and lower the result (game rule)
    const after = Math.max(0, clock.left - GAME.cost.suit - fails.length * FAIL_MIN), res = fails.length === 0 ? outcome(SUITS.suit1, after, []) : fails.length === 1 ? "risky" : "nooxygen";
    setSuit(fails.length ? "suit2" : "suit1"); setLook(g.suit); clock.spend(GAME.cost.suit + fails.length * FAIL_MIN, "suit"); finish(res, res === "nooxygen" ? 0 : after);
  };
  const confirmSuit = (id) => {
    const s = SUITS[id], after = Math.max(0, clock.left - GAME.cost.suit), res = outcome(s, after, flags);
    setSuit(id); clock.spend(GAME.cost.suit, "suit"); finish(res, res === "nooxygen" ? 0 : after - s.returnMin);
  };

  if (import.meta.env.DEV) window.__gameDebug = { pick: (id) => pick({ id }), arrive, rescue };   // yalnızca geliştirme: uçtan uca test kancası
  const keys = useKeys((k) => {
    if (phase === "menu") return;
    if (k === "escape") { setPaused((p) => !p); return; }
    if (paused) return;
    if (speech && (k === "e" || k === "enter" || k === " ")) { next(); return; }
    if (phase === "explore" && k === "e" && !solo) land();
    if (phase === "drive" && k === "t" && !solo) setPhase("suit");
    if (phase === "drive" && !solo && k === "g") setGarage((x) => !x);
    if (phase === "drive" && !solo && k === "u" && up === 0) setUp(1);
    if (phase === "drive" && k === "m" && solo) rescue.cmd.mode(rescue.S.ctrl === "cmd" ? "direct" : "cmd");
  });

  const prompt = speech || paused ? null
    : solo && phase !== "menu" ? null
    : phase === "explore" ? (sel ? null : t("game.prompt.pick"))
    : phase === "drive" ? t(tests.length >= 3 ? "game.prompt.suit" : mode === "multi" ? "game.prompt.drive.multi" : "game.prompt.drive")
    : null;

  return (
    <div className={"g-root g-" + phase + " g-mode-" + mode}>
      {gl && <GameView profile={profile} D={D} phase={phase} mode={mode} sel={view} suit={solo ? rescue.S.load?.suit : suit} ctl={solo ? rescue.ctl : null} mod2={mode === "multi" ? gear2.mod : null} look={look} onZones={(pts) => setZones(zonesOf(pts, roverLimit(D.params, profile)?.num, profile))} region={region} dems={dems} done={done} paused={paused} keys={keys} anchors={anchor} hud={hud}
        onPick={pick} onArrive={arrive} onLanded={() => say([...introLines(profile), ...(solo ? [t("game.rs.say.help")] : [])], () => { setPhase("explore"); setToast(t("game.msg.start")); })}
        onBlocked={(b) => { const n = performance.now(); if (n - lastBlock.current > 3000) { lastBlock.current = n; setToast(t("game.msg.block." + b)); } }} />}
      {phase === "menu" && <StartMenu profile={profile} setProfile={setProfile} mode={mode} setMode={setMode} onStart={start} gl={gl} reportHref={reportHref} />}
      {PLAYING.includes(phase) && <Oxygen clock={clock} />}
      {(phase === "intro" || phase === "drive" || phase === "result") && <Location text={loc} />}
      {phase === "explore" && !paused && <><Location text={t("game.loc.pick")} side="right" /><RegionBar regions={regions} onGo={(r) => { setSel(null); setRegion(r); }} /></>}
      {solo && phase === "explore" && !paused && <EarthDesk r={rescue} profile={profile} />}
      {solo && phase === "earthdrive" && <><RoverHud hud={hud} who="p1" /><WaypointTags hud={hud} />{!paused && <EarthSurvey r={rescue} />}</>}
      {solo && phase === "transmit" && !paused && <Transmit r={rescue} profile={profile} />}
      {solo && phase === "loadout" && !paused && !speech && <Loadout r={rescue} />}
      {solo && phase === "drive" && <><DriveHud r={rescue} clock={clock} hud={hud} profile={profile} />{!paused && <Decision r={rescue} />}</>}
      {solo && phase === "result" && <RescueResult r={rescue} profile={profile} D={D} clockLog={clock.log} onAgain={reset} reportHref={reportHref} />}
      {!solo && phase === "explore" && sel && !paused && <LandCard p={sel} line={pickLine(sel, D)} onLand={land} onCancel={() => setSel(null)} />}
      {phase === "drive" && <><RoverHud hud={hud} who="p1" /><WaypointTags hud={hud} /></>}
            {phase === "drive" && mode === "multi" && <><RoverHud hud={hud} who="p2" side="right" /><Location text={regionLabel(sel?.region)} side="right" /><LinkBadge n={tests.length} of={3} /></>}
      <Speech text={speech?.lines[speech.i]} anchorRef={anchor} onNext={next} />
      <Toast text={toast} />
      {!solo && phase === "explore" && !sel && !paused && (<div className="g-story" role="note"><svg className="g-pxman" viewBox="0 0 8 12" width="32" height="48" aria-hidden="true" shapeRendering="crispEdges"><rect x="2" y="0" width="4" height="3" fill="#ffd9b0"/><rect x="2" y="3" width="4" height="4" fill="#4d8fe6"/><rect x="0" y="3" width="2" height="3" fill="#4d8fe6"/><rect x="6" y="3" width="2" height="3" fill="#4d8fe6"/><rect x="2" y="7" width="1.6" height="4" fill="#2b3a5c"/><rect x="4.4" y="7" width="1.6" height="4" fill="#2b3a5c"/></svg><p>{t("game.story.find")}</p></div>)}
      <Prompt text={prompt} />
      {!solo && phase === "drive" && !paused && <>
        <Stress zone={zones.find((z) => !done.p2.includes(z.i))} gear={gear2} />
        <div className="gr-btns"><button onClick={() => setGarage(!garage)}>🔧 {t("gear.garageKey")}</button>{up === 0 && <button onClick={() => setUp(1)}>📡 {t("gear.sendKey")}</button>}</div>
        {garage && <Garage gear={gear2} setGear={setGear2} onClose={() => setGarage(false)} />}
        {up === 1 && <Uplink log={elog} onDone={() => { setUp(2); beep(660, 120); }} />}
      </>}
      {!solo && up === 2 && phase === "drive" && <Telemetry log={elog} />}
      {flash && <div className={"gr-flash gr-flash-" + flash} />}
      {!solo && phase === "suit" && !paused && <GearLoadout zones={zones} log={elog} uplinked={up === 2} onGo={confirmGear} />}
      {solo && phase === "suit" && !paused && <SuitScreen suit={suit} setSuit={setSuit} onConfirm={confirmSuit} left={clock.left} />}
      {!solo && phase === "result" && ended && <MissionReport result={final?.result || "timeout"} p={sel} D={D} profile={profile} cand={cand} suit={suit} left={final?.left ?? 0} reportHref={reportHref} onAgain={reset} tests={tests.length} />}
      {TOUCH && phase === "drive" && !paused && <TouchPad keys={keys} actions={solo ? [["m", "M", () => rescue.cmd.mode(rescue.S.ctrl === "cmd" ? "direct" : "cmd")]] : [["t", "T", () => setPhase("suit")]]} />}
      {phase !== "menu" && !paused && <button className="g-pausebtn" onClick={() => setPaused(true)} aria-label={t("game.pause.title")}>II</button>}
      {paused && <PauseMenu onResume={() => setPaused(false)} onRestart={reset} reportHref={reportHref} />}
    </div>
  );
}
