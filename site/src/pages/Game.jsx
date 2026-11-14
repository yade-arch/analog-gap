import React, { useEffect, useState } from "react";
import { t } from "../i18n/index.js";
import { SOURCES } from "../common.jsx";
import "../game.css";
import useClock from "../features/game/useClock.js";
import { GAME } from "../features/game/rules.js";
import { candOf, outcome, refOf, riskFlags, roverLimit } from "../features/game/data.js";
import { OxygenBar } from "../features/game/ui.jsx";
import StageBrief from "../features/game/StageBrief.jsx";
import StageScout from "../features/game/StageScout.jsx";
import StageTests from "../features/game/StageTests.jsx";
import StageSuit from "../features/game/StageSuit.jsx";
import StageResult from "../features/game/StageResult.jsx";
import RulesPanel from "../features/game/RulesPanel.jsx";

const STAGES = ["brief", "scout", "tests", "suit", "result"];

/** Emergency Analog Mission: oyun. Sayılar mevcut veri ürünlerinden; süre/kıyafet değerleri Simülasyon varsayımı. */
export default function Game({ D, profile, setProfile }) {
  const clock = useClock();
  const [stage, setStage] = useState("brief");
  const [sel, setSel] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const [done, setDone] = useState({});
  const [suit, setSuit] = useState(null);
  const [final, setFinal] = useState(null);
  const cand = candOf(D, profile), target = refOf(D, profile);
  const flags = riskFlags(profile, done, target, roverLimit(D.params, profile));

  const restart = () => { clock.reset(); setStage("brief"); setSel(null); setSeen(new Set()); setDone({}); setSuit(null); setFinal(null); };
  useEffect(restart, [profile]);
  useEffect(() => {                                   // süre bitti: sonuç ekranı
    if (clock.left <= 0 && stage !== "brief" && stage !== "result") { setFinal({ result: "timeout", left: 0 }); setStage("result"); }
  }, [clock.left, stage]);

  const inspect = (id) => {
    const p = cand.features.find((f) => f.properties.id === id)?.properties;
    if (!p) return;
    if (!seen.has(id)) { clock.spend(GAME.cost.inspect, "inspect"); setSeen(new Set(seen).add(id)); }
    setSel(p);
  };
  const run = (k) => { if (!done[k]) { clock.spend(GAME.cost.test, k); setDone({ ...done, [k]: true }); } };
  const pick = (s) => {
    const after = Math.max(0, clock.left - GAME.cost.suit);
    const res = outcome(s, after, flags);
    clock.stop(); clock.spend(GAME.cost.suit, "suit");
    setSuit(s); setFinal({ result: res, left: res === "nooxygen" ? 0 : after - s.returnMin }); setStage("result");
  };

  return (
    <div className="g-page" data-level={clock.level}>
      <header className="g-head">
        <div>
          <h2>{t("game.title")}</h2>
          <p className="muted">{t("game.sub")}</p>
        </div>
        {stage !== "brief" && <OxygenBar clock={stage === "result" ? { ...clock, left: final?.left ?? clock.left, frac: (final?.left ?? clock.left) / GAME.startMin } : clock} />}
      </header>
      <ol className="g-steps" aria-label={t("game.steps")}>
        {STAGES.map((s, i) => <li key={s} className={s === stage ? "on" : STAGES.indexOf(stage) > i ? "past" : ""}>{i + 1} · {t("game.step." + s)}</li>)}
      </ol>
      {stage === "brief" && <StageBrief D={D} profile={profile} setProfile={setProfile} onStart={() => { clock.start(); setStage("scout"); }} />}
      {stage === "scout" && <StageScout D={D} profile={profile} cand={cand} target={target} sel={sel} inspected={seen.size} onInspect={inspect} onChoose={() => setStage("tests")} />}
      {stage === "tests" && sel && <StageTests p={sel} D={D} profile={profile} target={target} done={done} onRun={run} onNext={() => setStage("suit")} />}
      {stage === "suit" && <StageSuit flags={flags} left={clock.left} onPick={pick} />}
      {stage === "result" && <StageResult p={sel} D={D} profile={profile} cand={cand} target={target} done={done} suit={suit} flags={flags} result={final?.result || "timeout"} left={final?.left ?? 0} onRestart={restart} />}
      <RulesPanel />
      <div className="g-foot">
        <p><strong>{t("game.foot.game")}</strong></p>
        <p className="muted">{t("game.foot.src")} {SOURCES} · {t("game.foot.params")}</p>
      </div>
    </div>
  );
}
