// Earth-to-Space Rescue state (solo mode): Earth investigation -> report -> loadout -> rover drive with decisions -> result.
// All costs and wear rates are game rules (rules.js RESCUE); all terrain/temperature values are real data (rescue.js).
import { useEffect, useRef, useState } from "react";
import { RESCUE } from "./rules.js";
import { analysePoint } from "../planet/pointAnalysis.js";
import { assess, betterSite, evaluate, fillPoint, siteFromCand, sitePoint, suggest, truthOf } from "./rescue.js";
import { t } from "../../i18n/index.js";
import { tf } from "./ui.jsx";
import { fmt } from "../../common.jsx";

const fresh = () => ({ sites: [], focus: null, report: null, sent: null, load: null, ctrl: "direct", avoid: false, collected: [], need: 3,
  suit: 100, water: 100, event: null, evDone: false, decision: null, shown: {}, decisions: [], cmds: [], upgraded: null, wantEnd: false, result: null, driveAt: null });

export default function useRescue({ D, profile, clock, phase, setPhase, paused, hud, toast, say, on }) {
  const [S, setS] = useState(fresh), R = useRef(S); R.current = S;
  const ctl = useRef({ auto: null, mods: {}, api: null });
  const truth = truthOf(D, profile);
  const put = (o) => { const n = { ...R.current, ...(typeof o === "function" ? o(R.current) : o) }; R.current = n; setS(n); };   // synchronous: later reads see it
  const site = (k) => R.current.sites.find((x) => x.key === (k ?? R.current.focus)) || null;
  const log = (what) => put((s) => ({ cmds: [...s.cmds, { at: clock.left, what }] }));
  const reset = () => { ctl.current = { auto: null, mods: {}, api: null }; setS(fresh()); R.current = fresh(); };

  /** Earth team: investigate a catalog candidate or ANY point (clicked or typed). Each new place costs time. */
  function investigate(m) {
    if (!on) return;
    const cand = !m.free && D[profile === "moon" ? "cm" : "cs"]?.features.find((f) => f.properties.id === m.id)?.properties;
    const key = cand ? cand.id : sitePoint(m.lat, m.lon, 0).key, had = R.current.sites.find((x) => x.key === key);
    if (had) { put({ focus: key }); return; }
    const i = R.current.sites.length;
    if (cand) { clock.spend(RESCUE.cost.inspectCand, "inspect"); put((s) => ({ sites: [...s.sites, siteFromCand(cand, D, i)], focus: cand.id })); return; }
    clock.spend(RESCUE.cost.inspectPoint, "inspect");
    const sp = { ...sitePoint(m.lat, m.lon, i), name: m.name || null }; put((s) => ({ sites: [...s.sites, sp], focus: sp.key }));
    analysePoint(m.lat, m.lon, { moon: D.rm, mars: D.rs })
      .then((r) => put((s) => ({ sites: s.sites.map((x) => (x.key === sp.key ? fillPoint(x, r, profile) : x)) })))
      .catch((e) => put((s) => ({ sites: s.sites.map((x) => (x.key === sp.key ? { ...x, status: "err", err: String(e.message || e) } : x)) })));
  }
  const chooseReport = () => { const s = site(); if (s?.status === "ok") { put({ report: s.key }); setPhase("transmit"); } };
  function send(rec) {
    clock.spend(RESCUE.cost.send, "send"); put({ sent: rec, load: { ...rec } });
    setPhase("loadout"); say([t("game.rs.say.recv")]);
  }
  function startDrive(load) {
    put({ load, driveAt: clock.left, suit: 100, avoid: load.route === "safe" });
    ctl.current.auto = null; setPhase("drive"); toast(t("game.rs.msg.drive"));
  }

  // rover modifiers (equipment, route, event) -> engine
  useEffect(() => {
    const L = S.load || {}, ev = S.event, storm = ev?.kind === "storm";
    ctl.current.mods = { speed: (S.ctrl === "cmd" && L.route === "safe" ? RESCUE.safeSpeed : 1) * (storm ? RESCUE.storm.speed : 1),
      drain: (RESCUE.equip[L.equip]?.drain ?? 1) * (storm ? RESCUE.storm.drain : 1), wear: RESCUE.equip[L.equip]?.wear ?? 1 };
  }, [S.load, S.event, S.ctrl]);

  // every game minute during the drive: suit wear, water, unexpected event, decision triggers
  const lastMin = useRef(null);
  useEffect(() => {
    if (!on || phase !== "drive" || paused || S.result) { lastMin.current = clock.left; return; }
    if (lastMin.current === null || clock.left >= lastMin.current) { lastMin.current = clock.left; return; }
    const dm = lastMin.current - clock.left; lastMin.current = clock.left;
    const s = R.current, L = s.load, lim = truth.lim?.num, sl = hud.current?.p1?.slope, since = s.driveAt - clock.left;
    let wear = RESCUE.suitWear * RESCUE.suitWearMul[L.suit] * (lim && sl > lim ? RESCUE.steepWear : 1) * (s.water <= 0 ? RESCUE.dryWear : 1);
    if (s.event?.kind === "cold") wear *= RESCUE.cold[L.suit];
    const upd = { suit: Math.max(0, s.suit - wear * Math.min(dm, 3)), water: Math.max(0, s.water - RESCUE.waterPerMin * Math.min(dm, 3)) };
    if (!s.evDone && since >= RESCUE.eventAt) { upd.event = { kind: profile === "mars" ? "storm" : "cold", until: since + RESCUE.eventLen }; upd.evDone = true; toast(t("game.rs.ev." + upd.event.kind)); }
    if (s.event && since >= s.event.until) { upd.event = null; toast(t("game.rs.ev.end")); }
    put(upd);
    if (upd.suit <= 0) return end("suit");
    if (!s.decision) {
      const api = ctl.current.api;
      if (!s.shown.terrain && api) {
        const legs = api.points.filter(Boolean).map((p) => api.scan(p)).filter(Boolean);
        const bad = legs.find((l) => l.over > 0);
        put((x) => ({ shown: { ...x.shown, terrain: true }, decision: bad ? { id: "terrain", scan: bad } : null }));
      } else if (!s.shown.suit && upd.suit < RESCUE.suitLow) put((x) => ({ shown: { ...x.shown, suit: true }, decision: { id: "suit" } }));
      else if (!s.shown.better && s.collected.length >= 1) {
        const b = betterSite(D, profile, site(s.report));
        put((x) => ({ shown: { ...x.shown, better: true }, decision: b ? { id: "better", best: b } : null }));
      }
    }
  }, [clock.left]);

  // fast loop: rover breakdown and arrival at base
  useEffect(() => {
    if (!on || phase !== "drive") return undefined;
    const id = setInterval(() => {
      const s = R.current, h = hud.current?.p1; if (!h || s.result || paused) return;
      if (h.health <= 0) end("rover");
      else if (h.atBase && (s.collected.length >= s.need || (s.wantEnd && s.collected.length > 0))) end("base");
      else if (h.atBase && s.wantEnd && !s.collected.length) { put({ wantEnd: false }); toast(t("game.rs.msg.nothing")); }
    }, 250);
    return () => clearInterval(id);
  }, [on, phase, paused]);

  function arrive(i) {
    const s = R.current; if (s.collected.includes(i)) return;
    clock.spend(RESCUE.collectMin[s.load.suit], "collect");
    const n = [...s.collected, i]; put({ collected: n });
    toast(tf(n.length >= s.need ? "game.rs.msg.allGot" : "game.rs.msg.got", { n: n.length, of: s.need }));
  }

  // command mode
  const api = () => ctl.current.api;
  const remaining = () => (api()?.points || []).filter((p) => p && !R.current.collected.includes(p.i));
  const nearest = (list) => { const r = api().rover(); return [...list].sort((a, b) => Math.hypot(a.x - r.x, a.z - r.z) - Math.hypot(b.x - r.x, b.z - r.z)); };
  const queue = (q, what) => { ctl.current.auto = { queue: q, avoid: R.current.avoid, stop: false }; log(what); };
  const cmd = {
    mode(m) { put({ ctrl: m }); ctl.current.auto = m === "cmd" ? { queue: [], avoid: R.current.avoid, stop: true } : null; log(m === "cmd" ? "mode.cmd" : "mode.direct"); },
    next() { const r = remaining(); if (!api() || !r.length) return; queue([nearest(r)[0]], "cmd.next"); },
    follow() {
      if (!api()) return; const order = [], left = remaining();
      while (left.length) { const r = order.length ? order[order.length - 1] : api().rover(); left.sort((a, b) => Math.hypot(a.x - r.x, a.z - r.z) - Math.hypot(b.x - r.x, b.z - r.z)); order.push(left.shift()); }
      const safe = R.current.load.route === "safe"; put({ avoid: safe, wantEnd: true });
      ctl.current.auto = { queue: [...order, { ...api().start, base: true }], avoid: safe, stop: false }; log(safe ? "cmd.follow.safe" : "cmd.follow.direct");
    },
    scan() {
      if (!api()) return; const to = nearest(remaining())[0] || api().start, r = api().scan(to);
      clock.spend(RESCUE.cost.scan, "scan"); log("cmd.scan");
      toast(r ? tf(r.lim ? "game.rs.msg.scan" : "game.rs.msg.scanNoLim", { max: fmt(r.max, 0), pct: Math.round(r.over * 100), lim: r.lim, km: fmt(r.km, 1) }) : t("game.rs.msg.scanNone"));
    },
    avoid() { const v = !R.current.avoid; put({ avoid: v }); if (ctl.current.auto) ctl.current.auto.avoid = v; log(v ? "cmd.avoid.on" : "cmd.avoid.off"); },
    stop() { if (ctl.current.auto) ctl.current.auto.stop = true; log("cmd.stop"); },
    base() { if (!api()) return; put({ wantEnd: true }); queue([{ ...api().start, base: true }], "cmd.base"); },
    endHere() { put({ wantEnd: true }); },
  };

  /** Decision moments: consequences come from time, equipment and real terrain, never from chance. */
  function decide(opt) {
    const s = R.current, d = s.decision; if (!d) return;
    const rec = { id: d.id, opt, at: clock.left };
    if (d.id === "suit") {
      if (opt === "backup") { clock.spend(RESCUE.cost.switchSuit, "suit"); put({ suit: RESCUE.backupSuit }); }
      if (opt === "rover") { clock.spend(RESCUE.cost.toRover, "rover"); put({ suit: Math.min(100, s.suit + RESCUE.roverRest) }); }
    }
    if (d.id === "terrain") {
      if (opt === "ask") {
        clock.spend(RESCUE.cost.askEarth, "ask");
        toast(truth.lim ? tf(truth.steep ? "game.rs.msg.askSteep" : "game.rs.msg.askGentle", { p90: fmt(truth.v.slope.p90, 0), lim: truth.lim.num }) : t("game.rs.msg.askNone"));
        put({ decisions: [...s.decisions, rec], decision: { id: "terrain2", scan: d.scan } }); return;
      }
      const route = opt === "alt" ? "safe" : "direct"; put({ load: { ...s.load, route }, avoid: route === "safe" });
      if (ctl.current.auto) ctl.current.auto.avoid = route === "safe";
    }
    if (d.id === "terrain2") { const route = opt === "alt" ? "safe" : "direct"; put({ load: { ...s.load, route }, avoid: route === "safe" }); if (ctl.current.auto) ctl.current.auto.avoid = route === "safe"; }
    if (d.id === "better") {
      if (opt === "wait") {
        clock.spend(RESCUE.cost.waitAnalysis, "wait");
        const b = siteFromCand(d.best, D, s.sites.length), sg = suggest(assess(b, truth));
        put({ upgraded: b }); toast(sg ? tf("game.rs.msg.newInfo", { route: t("game.rs.route." + sg.route), id: b.id }) : t("game.rs.msg.newInfoNone"));
      }
      if (opt === "plan") put({ need: Math.max(s.collected.length, s.need - 1) });
    }
    put({ decisions: [...R.current.decisions, rec], decision: null });
  }

  function end(cause) {
    if (R.current.result) return;
    clock.stop(); ctl.current.auto = { queue: [], stop: true };
    const s = R.current, ev = evaluate({ end: cause, collected: s.collected.length, need: s.need, site: site(s.report), truth, load: s.load || {}, sent: s.sent,
      rover: hud.current?.p1, suitDur: s.suit, decisions: s.decisions, D, profile, upgraded: s.upgraded });
    put({ result: { ...ev, end: cause, left: clock.left, at: new Date().toISOString() } });
    setPhase("result");
  }

  return { S, ctl, truth, site, investigate, chooseReport, send, startDrive, arrive, cmd, decide, end, reset, focus: (k) => put({ focus: k }), back: () => setPhase("explore") };
}
