import React from "react";
import { t } from "../../i18n/index.js";
import { GAME, TESTS } from "./rules.js";
import { ThermalTest, TerrainTest, SurfaceTest } from "./Tests.jsx";
import { Lbl, tf } from "./ui.jsx";

const VIEW = { thermal: ThermalTest, terrain: TerrainTest, surface: SurfaceTest };
const ICON = { thermal: "🌡", terrain: "⛰", surface: "◫" };

/** Aşama 3: üç sanal rover testi; her biri süre harcar. Sonuçlar seçilen pencerenin gerçek verisinden. */
export default function StageTests({ p, D, profile, target, done, onRun, onNext }) {
  return (
    <section className="g-tests">
      <p className="g-hint">{tf("game.tests.hint", { id: p.id, c: GAME.cost.test })} <Lbl k="sim" /></p>
      <div className="g-tgrid">
        {TESTS.map((k) => {
          const V = VIEW[k];
          return (
            <div key={k} className={"card g-test" + (done[k] ? " done" : "")}>
              <h3><span aria-hidden="true">{ICON[k]}</span> {t("game.test." + k)}</h3>
              <p className="muted">{t("game.test." + k + ".d")}</p>
              {done[k] ? <V p={p} D={D} profile={profile} target={target} /> : (
                <button className="g-run" onClick={() => onRun(k)}>{tf("game.test.run", { c: GAME.cost.test })}</button>
              )}
            </div>
          );
        })}
      </div>
      <button className="btn-accent g-big" onClick={onNext}>{t("game.tests.next")}</button>
    </section>
  );
}
