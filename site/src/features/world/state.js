// Küresel hedef (Ay | Mars) ve Dünya bölgesi durumu. Kalıcılık: localStorage + adres (#/sayfa?t=mars&r=ATA, paylaşılabilir).
// Ay ve Mars hiçbir ekranda karışmaz: sayfalar bu hedefe göre süzülür.
import { useEffect, useState } from "react";
import { DEFAULT_ROUTE } from "../../config.js";
import { emit } from "./events.js";

export const TARGETS = ["moon", "mars"];
export const REGION_CODES = ["ALL", "ATA", "HAW", "ANA", "US-SW"];
const read = (k) => { try { return localStorage.getItem("ag." + k); } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem("ag." + k, v); } catch { /* özel pencere: yalnızca adres */ } };
const query = (hash) => new URLSearchParams(hash.split("?")[1] || "");
const pick = (list, ...c) => c.find((x) => list.includes(x)) || list[0];

/** Yol a2 (kart/görev/rapor) hedefi belirler; yoksa ?t, yoksa son seçim. */
export function useWorld(hash, page, a2) {
  const [target, setTarget] = useState(() => pick(TARGETS, a2, query(hash).get("t"), read("t")));
  const [region, setRegion] = useState(() => pick(REGION_CODES, query(hash).get("r"), read("r")));
  useEffect(() => {
    const q = query(hash);
    if (["card", "compare", "report"].includes(page) && TARGETS.includes(a2)) setTarget(a2);
    else if (TARGETS.includes(q.get("t"))) setTarget(q.get("t"));
    if (REGION_CODES.includes(q.get("r"))) setRegion(q.get("r"));
  }, [hash]);
  useEffect(() => {                                   // durumu adrese yaz (replaceState hashchange tetiklemez)
    save("t", target); save("r", region);
    const [p, qs] = (location.hash || "#/" + DEFAULT_ROUTE).split("?");
    const n = new URLSearchParams(qs || ""); n.set("t", target);
    if (region === "ALL") n.delete("r"); else n.set("r", region);
    const h = p + "?" + n.toString();
    if (h !== location.hash) history.replaceState(null, "", h);
  }, [target, region, hash]);
  useEffect(() => { emit({ type: "select-region", target, id: region }); }, [region, target]);
  return { target, setTarget, region, setRegion };
}

/** Aday koleksiyonunu bölgeye göre süz (meta korunur). */
export const byRegion = (fc, region) => (!fc || region === "ALL" ? fc : { ...fc, features: fc.features.filter((f) => f.properties.region === region) });

/** Bölge içi sıra: id -> N (aynı bölgede genel sıraya göre). */
export function regionRanks(features) {
  const c = {}, out = {};
  [...features].map((f) => f.properties || f).sort((a, b) => a.rank - b.rank).forEach((p) => { c[p.region] = (c[p.region] || 0) + 1; out[p.id] = c[p.region]; });
  return out;
}
