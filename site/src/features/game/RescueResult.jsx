// Rescue result: simple words first, then FOR SCIENTISTS (expandable), then the full mission report as PDF (browser print).
import React from "react";
import { t } from "../../i18n/index.js";
import { fmt } from "../../common.jsx";
import { tf } from "./ui.jsx";
import { RESCUE } from "./rules.js";
import { TempRows, VarRows, coords, siteName } from "./RescueUI.jsx";
import { tileSource } from "./rescue.js";

function kidText(res, S, truth) {
  const a = res.a, L = S.load || {}, wrong = ["suit", "route", "equip"].filter((k) => L[k] !== res.best[k] && !(k === "equip" && L.equip === "backup"));
  const out = [t("game.rs.kid.info." + a.quality)];
  out.push(wrong.length ? tf("game.rs.kid.choiceBad", { list: wrong.map((k) => t("game.rs.kid.w." + k)).join(", ") }) : t("game.rs.kid.choiceGood"));
  out.push(res.end === "base" ? (res.tier === "success" ? t("game.rs.kid.end.success") : res.tier === "partial" ? tf("game.rs.kid.end.partial", { n: S.collected.length, of: 3 }) : t("game.rs.kid.end.none")) : t("game.rs.kid.end." + res.end));
  return out.join(" ");
}

const reasonText = (x) => tf("game.rs.why." + x.k, { ...x, site: x.site && t("game.rs.class." + x.site), real: x.real && t("game.rs.class." + x.real), suit: x.suit && t("game.rs.suit." + x.suit), route: x.route && t("game.rs.route." + x.route), equip: x.equip && t("game.rs.equip." + x.equip) });

function Science({ S, res, site, truth, profile, D }) {
  const lim = truth.lim, row = D.params?.find((p) => p.id === lim?.id);
  return (
    <div className="rs-sci">
      <h4>{t("game.rs.sci.site")}</h4>
      <p>{site.letter} · {siteName(site)} · {coords(site)} ({fmt(site.center_lat, 4)}, {fmt(site.center_lon, 4)})</p>
      <h4>{tf("game.rs.sci.meas", { b: truth.label })}</h4>
      <VarRows s={site} truth={truth} />
      {site.elev && <p>{t("game.rs.elev")}: {fmt(site.elev.min, 0)} – {fmt(site.elev.max, 0)} m ({t("game.rs.tag.approx")})</p>}
      <TempRows s={site} truth={truth} profile={profile} />
      <p>{t("game.rs.match")}: {site.D != null ? `D = ${fmt(site.D, 3)} (${t("game.rs.tag.calc")})` : t("game.rs.noD")}</p>
      <h4>{t("game.rs.sci.src")}</h4>
      <ul>
        <li>{t("game.rs.earth")}: {site.source}{site.approx && <> — <code>{tileSource}</code></>}</li>
        {site.tempSource && <li>{t("game.rs.temp")}: {site.tempSource}</li>}
        <li>{t("game.rs.target")}: {truth.label} — {String(truth.ref?.dem || "").replace("ortalama", "average")}</li>
        {truth.thermal && <li>{t("game.rs.temp")} ({t("game.rs.target")}): {D.tM?.product} — {D.tM?.provider}</li>}
        {lim && <li>{t("game.rs.sci.lim")}: {lim.num}° — {row?.source_title} ({row?.source_url})</li>}
        <li>{t("game.rs.sci.units")}</li>
      </ul>
      <h4>{t("game.rs.sci.limits")}</h4>
      <ul>
        {site.approx && <li>{t("game.rs.approxNote")}</li>}
        {res.a.missing.map((k) => <li key={k}>{tf("game.rs.sci.miss", { v: k === "temp" ? t("game.rs.temp") : t("pt.v." + k) })}</li>)}
        <li>{t("game.rs.temp.notSame." + profile)}</li>
        <li>{t("game.rs.gameRule")}</li>
      </ul>
      <h4>{t("game.rs.sci.sent")}</h4>
      <p>{S.sent ? tf("game.rs.lo.msg", { suit: t("game.rs.suit." + S.sent.suit), route: t("game.rs.route." + S.sent.route), equip: t("game.rs.equip." + S.sent.equip) }) : "—"}</p>
      {S.upgraded && <p>{tf("game.rs.sci.upgraded", { id: S.upgraded.id })}</p>}
      <h4>{t("game.rs.sci.load")}</h4>
      <p>{t("game.rs.suit." + S.load?.suit)} · {t("game.rs.route." + S.load?.route)} · {t("game.rs.equip." + S.load?.equip)}</p>
      <h4>{t("game.rs.sci.cmds")}</h4>
      <p>{S.cmds.length ? S.cmds.map((c) => `${t("game.rs.log." + c.what)} (${c.at} min)`).join(" → ") : t("game.rs.sci.noCmds")}</p>
      <h4>{t("game.rs.sci.dec")}</h4>
      <p>{S.decisions.length ? S.decisions.map((d) => `${t("game.rs.d." + d.id.replace("2", "") + "." + d.opt)} (${d.at} min)`).join(" · ") : t("game.rs.sci.noDec")}</p>
      <h4>{t("game.rs.sci.end")}</h4>
      <p>{tf("game.rs.sci.left", { l: res.left, n: S.collected.length, of: S.need, s: Math.round(S.suit), w: Math.round(S.water) })}</p>
      <ul>{res.reasons.map((x, i) => <li key={i}>{reasonText(x)}</li>)}</ul>
    </div>
  );
}

export default function RescueResult({ r, profile, D, clockLog, onAgain, reportHref }) {
  const { S, truth } = r, res = S.result, site = r.site(S.report);
  if (!res || !site) return null;
  const kid = kidText(res, S, truth);
  return (
    <div className="rs-result">
      <div className="rs-card rs-res">
        <h1 className={"rs-tier rs-tier-" + res.tier}>{t("game.tier." + res.tier)}</h1>
        <p className="rs-kid">{kid}</p>
        <ul className="rs-why">{res.reasons.slice(0, 4).map((x, i) => <li key={i}>{reasonText(x)}</li>)}</ul>
        <details className="rs-details noprint"><summary>{t("game.rs.sci.title")}</summary><Science S={S} res={res} site={site} truth={truth} profile={profile} D={D} /></details>
        <div className="rs-acts noprint">
          <button className="g-go" onClick={() => window.print()}>{t("game.rs.pdf")}</button>
          <button className="g-btn2" onClick={onAgain}>{t("game.rs.again")}</button>
          {site.kind === "cand" && <a className="g-btn2" href={reportHref}>{t("game.rs.fullAnalog")}</a>}
        </div>
        <p className="g-note noprint">{t("game.rs.pdfHint")}</p>
      </div>
      <section className="print-only rs-print">
        <h1>ANALOG GAP — {t("game.rs.pdfTitle")}</h1>
        <p>{new Date(res.at).toLocaleString()} · {t("ui.body." + profile)} · {truth.label}</p>
        <h2>{t("game.tier." + res.tier)}</h2><p>{kid}</p>
        <Science S={S} res={res} site={site} truth={truth} profile={profile} D={D} />
        <h4>{t("game.rs.sci.history")}</h4>
        <p>{S.sites.map((x) => `${x.letter}: ${siteName(x)} ${coords(x)}${x.status !== "ok" ? " (" + t("game.rs.status." + x.status) + ")" : x.D != null ? " D=" + fmt(x.D, 3) : ""}`).join(" · ")}</p>
        <p>{clockLog.map((c) => `${t("game.rs.spend." + c.what)} −${c.n} min`).join(" · ")}</p>
        <p className="small">{tf("game.rs.sci.rules", { s: RESCUE.suitWear, w: RESCUE.waterPerMin })}</p>
      </section>
    </div>
  );
}
