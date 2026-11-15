// TIME MACHINE: travel through real yearly satellite snapshots (NASA GIBS, MODIS Terra) of an Earth analog place.
// Only visible change is described; no terrain (elevation/slope/roughness) change is claimed: no comparable multi-date DEM here.
import React, { useEffect, useRef, useState } from "react";
import "../guide.css";
import { t } from "../i18n/index.js";
import { tf } from "../features/game/ui.jsx";
import { fmt } from "../common.jsx";
import { RobotSays } from "../features/guide/Robot.jsx";
import PlacePicker from "../features/guide/PlacePicker.jsx";
import { SOURCE, YEARS, diffPct, gibsUrl, loadShot } from "../features/guide/gibs.js";

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const SAME = 5, WHITE = 0.05;   // display rules (not science): diff < 5 % = "looks similar"; white share change > 5 points is mentioned

function say(cur, last, d, year, lastYear) {
  if (!cur || cur.empty) return tf("tm.say.none", { y: year });
  if (cur === last) return t("tm.say.latest");
  const parts = [d == null ? t("tm.say.cantCompare") : d < SAME ? tf("tm.say.same", { y: year, l: lastYear }) : tf("tm.say.diff", { y: year, l: lastYear })];
  if (last && !last.empty) {
    if (cur.white - last.white > WHITE) parts.push(t("tm.say.moreWhite"));
    else if (last.white - cur.white > WHITE) parts.push(t("tm.say.lessWhite"));
  }
  parts.push(t("tm.say.means"));
  return parts.join(" ");
}

export default function TimeMachine({ D, profile, setProfile, cand }) {
  const [planet, setPlanet] = useState("earth"), [place, setPlace] = useState(null), [month, setMonth] = useState("07");
  const [shots, setShots] = useState({}), [i, setI] = useState(YEARS.length - 1), [play, setPlay] = useState(false), live = useRef(0);
  useEffect(() => {
    if (!place) return; const id = ++live.current; setShots({});
    for (const y of YEARS) loadShot(gibsUrl(place.lat, place.lon, `${y}-${month}-15`)).then((s) => { if (live.current === id) setShots((o) => ({ ...o, [y]: s })); });
  }, [place?.lat, place?.lon, month]);
  useEffect(() => { if (!play) return undefined; const id = setInterval(() => setI((x) => (x + 1) % YEARS.length), 1200); return () => clearInterval(id); }, [play]);
  const year = YEARS[i], lastYear = [...YEARS].reverse().find((y) => shots[y] && !shots[y].empty), cur = shots[year], last = lastYear && shots[lastYear];
  const d = diffPct(cur, last), got = YEARS.filter((y) => shots[y] && !shots[y].empty), miss = YEARS.filter((y) => shots[y]?.empty);
  const diffs = got.map((y) => [y, diffPct(shots[y], last)]).filter(([, v]) => v != null);
  const stable = diffs.length > 1 ? diffs.filter(([, v]) => v >= SAME).length / diffs.length < 0.3 : null;
  const choosePlanet = (p) => { setPlanet(p); if (p !== "earth") setProfile(p); };
  return (
    <div className="gd-page">
      <div className="gd-head">
        <h1>{t("tm.title")}</h1>
        <div className="gd-planet" role="group">{["earth", "moon", "mars"].map((b) => <button key={b} className={planet === b ? "on" : ""} onClick={() => choosePlanet(b)}>{t("tm.planet." + b)}</button>)}</div>
        {planet !== "earth" && <p className="small">{tf("tm.planetNote", { body: t("ui.body." + planet), ref: (planet === "moon" ? D.rm : D.rs)?.label })}</p>}
        <PlacePicker cand={cand} onPick={(p) => { setPlace(p); setI(YEARS.length - 1); }} value={place?.kind === "cand" ? "c:" + place.id : ""} />
        <label className="small">{t("tm.month")} <select value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
      </div>
      {!place ? <RobotSays text={t("tm.hello")} /> : (
        <>
          <div className="tm-view">
            <figure>{cur && !cur.empty ? <img src={cur.url} alt={tf("tm.alt", { y: year })} /> : <div className="tm-empty">{cur ? tf("tm.noImg", { y: year }) : t("gd.loading")}</div>}<figcaption>{year}-{month}-15</figcaption></figure>
            <figure>{last ? <img src={last.url} alt={tf("tm.alt", { y: lastYear })} /> : <div className="tm-empty">{t("gd.loading")}</div>}<figcaption>{t("tm.latest")}: {lastYear ?? "—"}-{month}-15</figcaption></figure>
          </div>
          <div className="tm-slider">
            <button className="g-btn2" onClick={() => setI(Math.max(0, i - 1))}>{t("tm.prev")}</button>
            <input type="range" min="0" max={YEARS.length - 1} value={i} onChange={(e) => setI(+e.target.value)} aria-label={t("tm.year")} />
            <button className="g-btn2" onClick={() => setI(Math.min(YEARS.length - 1, i + 1))}>{t("tm.next")}</button>
            <button className="g-go" onClick={() => setPlay(!play)}>{t(play ? "tm.pause" : "tm.play")}</button>
            <strong>{year}</strong>
          </div>
          <RobotSays text={say(cur, last, d, year, lastYear)} />
          <details className="card tm-report"><summary>{t("tm.viewReport")}</summary>
            <ReportBody {...{ planet, place, month, got, miss, diffs, stable, D }} />
            <button className="g-go" onClick={() => window.print()}>{t("tm.pdf")}</button>
          </details>
          <section className="print-only">
            <h1>ANALOG GAP — {t("tm.title")}</h1>
            <ReportBody {...{ planet, place, month, got, miss, diffs, stable, D }} />
            {got.length > 0 && <div className="tm-view"><figure><img src={shots[got[0]].url} alt="" /><figcaption>{got[0]}-{month}-15</figcaption></figure><figure><img src={last.url} alt="" /><figcaption>{lastYear}-{month}-15</figcaption></figure></div>}
          </section>
        </>
      )}
    </div>
  );
}

function ReportBody({ planet, place, month, got, miss, diffs, stable, D }) {
  return (
    <div className="small">
      <p>{t("tm.r.planet")}: {t("tm.planet." + planet)}{planet !== "earth" && ` (${(planet === "moon" ? D.rm : D.rs)?.label})`} · {t("tm.r.place")}: {place.label} · {fmt(place.lat, 4)}, {fmt(place.lon, 4)}</p>
      <p>{t("tm.r.dates")}: {got.map((y) => `${y}-${month}-15`).join(", ") || "—"}</p>
      <p>{t("tm.r.missing")}: {miss.join(", ") || t("tm.r.none")}</p>
      <p>{t("tm.r.diff")}: {diffs.map(([y, v]) => `${y}: ${fmt(v, 1)} %`).join(" · ") || "—"}</p>
      <p>{t("tm.r.terrain")}</p>
      <p>{t("tm.r.summary")}: {stable == null ? t("tm.r.unknown") : t(stable ? "tm.r.stable" : "tm.r.changed")}</p>
      <p>{t("tm.r.source")}: {SOURCE}. {t("tm.r.limits")}</p>
    </div>
  );
}
