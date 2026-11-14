import React from "react";
import { t } from "../../i18n/index.js";
import { GAME, SUITS } from "./rules.js";
import { Lbl, tf } from "./ui.jsx";

export function FlagList({ flags }) {
  return (
    <ul className="g-list">
      {flags.map((f) => <li key={f.k}>{t("game.test." + f.k)}: {t("game.flag." + f.why)}</li>)}
      {!flags.length && <li>{t("game.flag.none")}</li>}
    </ul>
  );
}

/** Aşama 4: kıyafet seçimi. Değerler gerçek giysi performansı değildir (Simülasyon varsayımı). */
export default function StageSuit({ flags, left, onPick }) {
  return (
    <section className="g-suit">
      <p className="g-hint">{t("game.suit.hint")} <Lbl k="sim" /></p>
      <div className="card">
        <h4>{t("game.suit.flags")}</h4>
        <FlagList flags={flags} />
      </div>
      <div className="g-grid2">
        {Object.values(SUITS).map((s) => {
          const need = GAME.cost.suit + s.returnMin;
          return (
            <div key={s.id} className="card g-suitcard">
              <h3>{t("game." + s.id)}</h3>
              <p className="muted">{t("game." + s.id + ".d")}</p>
              <ul className="g-pros">{["p1", "p2"].map((k) => <li key={k}>+ {t(`game.${s.id}.${k}`)}</li>)}</ul>
              <ul className="g-cons">{["c1", "c2"].map((k) => <li key={k}>− {t(`game.${s.id}.${k}`)}</li>)}</ul>
              <p>{tf("game.suit.time", { r: s.returnMin, s: GAME.cost.suit })} <Lbl k="sim" /></p>
              {left < need && <p className="g-result">{tf("game.suit.short", { n: need, l: left })}</p>}
              <button className="btn-accent g-big" onClick={() => onPick(s)}>{t("game.suit.pick")}</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
