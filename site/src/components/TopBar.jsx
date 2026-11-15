import React, { useEffect, useRef, useState } from "react";
import { SECTIONS, setSection, useSection } from "../features/mapSections.js";
import { THEMES, getTheme, setTheme } from "../features/appearance.js";
import { ROUTES } from "../config.js";
import { TargetSwitch } from "../features/world/WorldBar.jsx";
import { t } from "../i18n/index.js";

// Sade üst çubuk (referans tasarım): logo, 3 adım (Bölge seç → Karşılaştır → Rapor), bağlantı durumu, üç çizgili menü (☰).
// Diğer sayfalar ve Ay/Mars seçimi ☰ menüsünde. "Bağlantı aktif" tarayıcının gerçek çevrimiçi durumudur (navigator.onLine).
const Logo = () => (
  <svg width="40" height="28" viewBox="0 0 40 28" aria-hidden="true"><ellipse cx="20" cy="15" rx="18" ry="6" fill="none" stroke="#1f3a8a" strokeWidth="2.4" transform="rotate(-18 20 15)" /><circle cx="20" cy="14" r="9" fill="#1f3a8a" /></svg>
);

// "Find a place" tab with a small menu: show one part of that page at a time.
function TabDrop({ tab, home, children }) {
  const [open, setOpen] = useState(false), sec = useSection(tab), ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const f = (e) => { if (e.key === "Escape" || (e.type === "pointerdown" && !ref.current?.contains(e.target))) setOpen(false); };
    addEventListener("pointerdown", f); addEventListener("keydown", f);
    return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", f); };
  }, [open]);
  const pick = (s) => { setSection(tab, s); setOpen(false); if (!location.hash.startsWith(home.split("?")[0])) location.hash = home; };
  return (
    <span className="navdrop" ref={ref}>
      {children}
      <button type="button" aria-haspopup="true" aria-expanded={open} aria-label={t("nav.sections")} onClick={() => setOpen(!open)}>▾</button>
      {open && <ul className="navmenu">{SECTIONS[tab].map((s) => <li key={s}><button type="button" aria-current={s === sec} onClick={() => pick(s)}>{t("sec." + tab + "." + s)}</button></li>)}</ul>}
    </span>
  );
}

// One tab, several pages: the ▾ menu links to each (e.g. Robot guide -> Story Mode / Time Machine).
function LinkDrop({ items, children }) {
  const [open, setOpen] = useState(false), ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const f = (e) => { if (e.key === "Escape" || (e.type === "pointerdown" && !ref.current?.contains(e.target))) setOpen(false); };
    addEventListener("pointerdown", f); addEventListener("keydown", f);
    return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", f); };
  }, [open]);
  return (
    <span className="navdrop" ref={ref}>
      {children}
      <button type="button" aria-haspopup="true" aria-expanded={open} aria-label={t("nav.sections")} onClick={() => setOpen(!open)}>▾</button>
      {open && <ul className="navmenu">{items.map(([k, h, cur]) => <li key={k}><a href={h} aria-current={cur || undefined} onClick={() => setOpen(false)}>{t(k)}</a></li>)}</ul>}
    </span>
  );
}

export default function TopBar({ page, profile, setProfile, reportId }) {
  const [online, setOnline] = useState(navigator.onLine), [theme, setThemeS] = useState(getTheme);
  useEffect(() => { const f = () => setOnline(navigator.onLine); addEventListener("online", f); addEventListener("offline", f); return () => { removeEventListener("online", f); removeEventListener("offline", f); }; }, []);
  const id = reportId;
  const SEC = [["map", "nav.explore", "#/map"], ["compare", "nav.compare", id ? `#/compare/${id}/${profile}` : "#/compare"], ["list", "nav.discoveries", "#/list"], ["guide", "nav.guide", "#/story"], ["game", "nav.mission", "#/game"]];
  const on = (k) => k === page || (k === "compare" && (page === "home" || page === "report")) || (k === "list" && page === "card") || (k === "guide" && (page === "story" || page === "time"));
  return (
    <header className="top topx">
      <a className="brand" href="#/start" aria-label={t("nav.home")}><Logo /><h1>Space Sync</h1></a>
      <nav className="mainnav" aria-label={t("ui.pages")}>
        {SEC.map(([k, key, h]) => {
          const a = <a key={k} href={h} className={on(k) ? "on" : ""} aria-current={on(k) ? "page" : undefined}>{t(key)}</a>;
          if (k === "guide") return <LinkDrop key={k} items={[["nav.story", "#/story", page === "story"], ["nav.time", "#/time", page === "time"]]}>{a}</LinkDrop>;
          return SECTIONS[k] ? <TabDrop key={k} tab={k} home={h}>{a}</TabDrop> : a;
        })}
      </nav>
      <span className={"conn" + (online ? "" : " off")}><i />{t(online ? "ui.online" : "ui.offline")}</span>
      <details className="gear">
        <summary aria-label={t("ui.menu")} title={t("ui.menu")}><span className="burger" aria-hidden="true"><i /><i /><i /></span></summary>
        <div className="gear-menu">
          <div className="g-sub">{t("world.target")}</div>
          <TargetSwitch target={profile} setTarget={setProfile} />
          <div className="theme-pick" role="group" aria-label={t("nav.theme")}>{THEMES.map((k) => <button key={k} type="button" aria-pressed={theme === k} onClick={() => { setThemeS(k); setTheme(k); }}>{t("nav.theme." + k)}</button>)}</div>
          <div className="g-sub">{t("ui.pages")}</div>
          {ROUTES.filter((r) => r.primary).map((r) => <a key={r.id} href={"#/" + r.id} aria-current={page === r.id ? "page" : undefined}>{t(r.key)}</a>)}
          {id && <a href={`#/report/${id}/${profile}`}>{t("nav.report")}</a>}
        </div>
      </details>
    </header>
  );
}
