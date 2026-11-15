import React, { useState } from "react";
import { t } from "../../i18n/index.js";

// Search box: "lat, lon" is used directly (no network); a place name is looked up once per submit with Nominatim
// (OpenStreetMap; usage policy: no autocomplete, at most 1 request per second). Not NASA data, labelled as such.
const NOMINATIM = "https://nominatim.openstreetmap.org/search?format=json&accept-language=en&limit=1&q=";

export function parseLatLon(q) {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?\s*$/i.exec(q);
  if (!m) return null;
  const lat = +m[1] * (/s/i.test(m[2] || "") ? -1 : 1), lon = +m[3] * (/w/i.test(m[4] || "") ? -1 : 1);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

export default function PlaceSearch({ onPick }) {
  const [q, setQ] = useState(""), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setMsg(null);
    const ll = parseLatLon(q); if (ll) { onPick(ll); return; }
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch(NOMINATIM + encodeURIComponent(q.trim()), { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(String(r.status));
      const [hit] = await r.json();
      if (hit) onPick({ lat: +hit.lat, lon: +hit.lon, name: hit.display_name }); else setMsg(t("search.none"));
    } catch { setMsg(t("search.err")); } finally { setBusy(false); }
  };
  return (
    <form className="pt-search" onSubmit={go} role="search">
      <label>
        <span className="small muted">{t("search.label")}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.ph")} aria-label={t("search.label")} />
      </label>
      <button className="g-btn" type="submit" disabled={busy}>{t("search.go")}</button>
      {msg && <span className="small">{msg}</span>}
      <span className="small muted pt-src">{t("search.src")}</span>
    </form>
  );
}
