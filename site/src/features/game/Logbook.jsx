import React, { useState } from "react";
import { t } from "../../i18n/index.js";
import { regionLabel } from "../../i18n/terms.js";
import { listLog, clearLog, tierOf } from "./logbook.js";
import { tf } from "./ui.jsx";

// Personal mission logbook on the start menu (last 5 missions).
export default function Logbook() {
  const [log, setLog] = useState(listLog);
  if (log.length === 0) return <p className="g-small">{t("game.log.empty")}</p>;
  return (
    <details className="g-log">
      <summary>{tf("game.log.title", { n: log.length })}</summary>
      <ul>
        {log.slice(0, 5).map((x) => (
          <li key={x.t}>
            <b className={"g-tier g-tier-" + tierOf(x.result)}>{t("game.tier." + tierOf(x.result))}</b>{" "}
            {t("game.target." + x.profile)} · {x.region ? regionLabel(x.region) : "—"} · {tf("game.log.tests", { n: x.tests ?? 0 })} · {tf("game.o2.text", { l: Math.max(0, x.left ?? 0) })}
            <span className="g-small"> · {new Date(x.t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="g-btn" onClick={() => { clearLog(); setLog([]); }}>{t("game.log.clear")}</button>
    </details>
  );
}
