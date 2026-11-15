// 1900–2026 timeline. Earth: real yearly NASA GISTEMP v4 global temperature change. Moon/Mars: real dated mission events;
// there is no long temperature record for them, so none is shown or invented.
import React, { useEffect, useState } from "react";
import { t } from "../../i18n/index.js";
import { tf } from "../game/ui.jsx";
import { RobotSays } from "./Robot.jsx";

const EV = {
  earth: [[1900, "e1900"], [1958, "e1958"], [1972, "e1972"], [1999, "e1999"], [2000, "e2000"], [2015, "e2015"], [2024, "e2024"]],
  moon: [[1900, "m1900"], [1959, "m1959"], [1966, "m1966"], [1969, "m1969"], [1972, "m1972"], [1994, "m1994"], [2009, "m2009"], [2023, "m2023"]],
  mars: [[1900, "r1900"], [1965, "r1965"], [1971, "r1971"], [1976, "r1976"], [1997, "r1997"], [2001, "r2001"], [2004, "r2004"], [2012, "r2012"], [2018, "r2018"], [2021, "r2021"]],
};
const Y0 = 1900, Y1 = 2026;

function Chart({ g, year }) {
  const ys = Object.keys(g).map(Number).filter((y) => y >= Y0), W = 600, H = 120, x = (y) => ((y - Y0) / (Y1 - Y0)) * W, yv = (v) => H / 2 - v * 40;
  return (
    <svg className="lt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("lt.chart")}>
      <line x1="0" x2={W} y1={yv(0)} y2={yv(0)} className="lt-zero" />
      {ys.map((y) => <rect key={y} x={x(y)} width={W / (Y1 - Y0) - 0.6} y={Math.min(yv(0), yv(g[y]))} height={Math.abs(yv(g[y]) - yv(0))} className={g[y] >= 0 ? "lt-warm" : "lt-cool"} />)}
      <line x1={x(year)} x2={x(year)} y1="0" y2={H} className="lt-now" />
    </svg>
  );
}

export default function LongTimeline({ planet }) {
  const [year, setYear] = useState(Y1), [g, setG] = useState(null);
  useEffect(() => { fetch(import.meta.env.BASE_URL + "data/gistemp_global.json").then((r) => r.json()).then((j) => setG(j.annual)).catch(() => setG({})); }, []);
  const ev = [...EV[planet]].reverse().find(([y]) => y <= year), v = g?.[year];
  let text = ev ? `${ev[0]}: ${t("lt." + ev[1])}` : "";
  if (planet === "earth") text = (v == null ? tf("lt.e.none", { y: year }) : tf(v >= 0 ? "lt.e.warm" : "lt.e.cool", { y: year, v: Math.abs(v).toFixed(2) })) + " " + text;
  else text += " " + t("lt.noTemp." + planet);
  return (
    <section className="card lt">
      <h2>{tf("lt.title", { p: t("tm.planet." + planet) })}</h2>
      <div className="tm-slider">
        <button className="g-btn2" onClick={() => setYear(Math.max(Y0, year - 1))}>−1</button>
        <input type="range" min={Y0} max={Y1} value={year} onChange={(e) => setYear(+e.target.value)} aria-label={t("tm.year")} />
        <button className="g-btn2" onClick={() => setYear(Math.min(Y1, year + 1))}>+1</button>
        <strong>{year}</strong>
      </div>
      {planet === "earth" && g && <Chart g={g} year={year} />}
      <div className="lt-ev">{EV[planet].map(([y, k]) => <button key={k} className={"g-btn2" + (ev?.[1] === k ? " on" : "")} onClick={() => setYear(y)}>{y}</button>)}</div>
      <RobotSays text={text} />
      <p className="small muted">{t(planet === "earth" ? "lt.src.earth" : "lt.src.ev")}</p>
    </section>
  );
}
