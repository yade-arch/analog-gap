import React from "react";
import { t } from "../../i18n/index.js";
import { GAME, SUITS } from "./rules.js";
import { Lbl, tf } from "./ui.jsx";

/** Oyun kuralları ve eşikler arayüzde açık (kural 10); kullanıcı değiştiremez. */
export default function RulesPanel() {
  return (
    <details className="card g-rules">
      <summary>{t("game.rules.title")} <Lbl k="sim" /></summary>
      <ul className="g-list">
        <li>{tf("game.rules.time", { m: GAME.startMin, i: GAME.cost.inspect, te: GAME.cost.test, s: GAME.cost.suit })}</li>
        <li>{tf("game.rules.suits", { a: SUITS.suit1.returnMin, b: SUITS.suit2.returnMin })}</li>
        <li>{t("game.rules.flags")}</li>
        <li>{t("game.rules.outcome")}</li>
        <li>{tf("game.rules.site", { q: GAME.dQuantile * 100, cov: GAME.coverageMin, km: GAME.novelKm, d: GAME.similarD })}</li>
      </ul>
    </details>
  );
}
