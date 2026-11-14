import React, { useEffect, useRef, useState } from "react";
import { t } from "../../i18n/index.js";
import { BODIES, FACT_URL } from "../planet/registry.js";
import { createHeroGlobe, webglOk } from "./heroGlobe.js";
import "./hero.css";

// Ana ekran kahraman bölümü: seçili cisim başlığı, tek gerçek (Fact Sheet), BAŞLA, yanlarda komşu cisimler, altta yarım küre, aşağı ok.
const ORDER = ["moon", "earth", "mars"];
const texUrl = (b) => import.meta.env.BASE_URL + "data/tex/" + b.tex.map;
const fmt = (n) => String(n).replace(".", ",");

export default function Hero({ onStart }) {
  const [i, setI] = useState(1);
  const host = useRef(null), g = useRef(null), [gl] = useState(webglOk);
  const b = BODIES[ORDER[i]], left = BODIES[ORDER[(i + 2) % 3]], right = BODIES[ORDER[(i + 1) % 3]];
  const go = (d) => setI((x) => (x + d + 3) % 3);
  useEffect(() => { if (!gl) return undefined; g.current = createHeroGlobe(host.current); return () => g.current?.dispose(); }, [gl]);
  useEffect(() => { g.current?.setBody(b); }, [b]);
  useEffect(() => {
    const k = (e) => { if (e.target.closest?.("input,select,textarea")) return; if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, []);
  const fact = t("hero.fact").replace("{g}", fmt(b.gravity_ms2)).replace("{r}", fmt(b.radius_km));
  return (
    <section className={"hero hero-" + b.id} aria-label={t("hero.aria")}>
      <div className="hero-text">
        <div className="hero-kicker">{t("hero.kicker")}</div>
        <h2 className="hero-title" key={b.id}>{t("hero.name." + b.id)}</h2>
        <div className="hero-rule" />
        <p className="hero-desc">{t("hero.desc." + b.id)} {fact} <a className="hero-src" href={FACT_URL} target="_blank" rel="noreferrer" title={t("hero.src")} aria-label={t("hero.src")}>ⓘ</a></p>
        <button className="hero-start" onClick={() => onStart(b.id)}>{t("hero.start")}</button>
      </div>
      {[["l", left, -1], ["r", right, 1]].map(([s, x, d]) => (
        <button key={s} className={"hero-side " + s} onClick={() => go(d)} aria-label={t("hero.goto").replace("{n}", t("hero.name." + x.id))}>
          <span className="hero-ball" style={{ backgroundImage: `url(${texUrl(x)})` }} /><span className="hero-side-name">{t("hero.name." + x.id)}</span>
        </button>
      ))}
      <div className="hero-globe" ref={host}>
        {!gl && <div className="hero-flat" style={{ backgroundImage: `url(${texUrl(b)})` }} role="img" aria-label={t("hero.nowebgl")} />}
      </div>
      {!gl && <p className="hero-note">{t("hero.nowebgl")}</p>}
      <p className="hero-credit">{t("hero.tex")}: {b.texSrc}</p>
      <a className="hero-down" href="#hero-more" onClick={(e) => { e.preventDefault(); document.getElementById("hero-more")?.scrollIntoView({ behavior: "smooth" }); }} aria-label={t("hero.down")}>↓</a>
    </section>
  );
}
