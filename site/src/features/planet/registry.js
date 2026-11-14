// Planet Registry: cisim başına sabitler, tema ve doku. Sözleşme: BODIES[id] = { id, order, enabled, name, radius_km, gravity_ms2,
// mean_temp_C, pressure_bar, atmosphere, moons, orbit_days, color, tex, src }. enabled=false olan cisim listede "Yakında: veri yok" olarak görünür, açılmaz.
// Sayılar: NASA NSSDCA Planetary Fact Sheet (metrik tablo, 2026-11-14 okundu). Yarıçap = çap / 2. Yeni cisim: bu dosyaya bir satır + doku.
export const FACT_URL = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/";
const F = (p) => `${FACT_URL}${p}fact.html`;

export const BODIES = {
  earth: { id: "earth", order: 3, enabled: true, name: "EARTH", radius_km: 6378, gravity_ms2: 9.8, mean_temp_C: 15, pressure_bar: 1, moons: 1, orbit_days: 365.2,
    atmosphere: "%78,08 azot, %20,95 oksijen (kuru hava, hacimce)", atmoSrc: F("earth"), color: "#2f7fd0", glow: "#6fb2ff",
    tex: { map: "earth_bmng_200412_2048.jpg" }, texSrc: "NASA Blue Marble Next Generation, December 2004 (inventory T1)" },
  moon: { id: "moon", order: 4, enabled: true, name: "MOON", radius_km: 1737.5, gravity_ms2: 1.6, mean_temp_C: -20, pressure_bar: 0, moons: 0, orbit_days: 27.3,
    orbitNote: "Around Earth (sidereal period)", atmosphere: "Almost none (table: 0 bar)", atmoSrc: FACT_URL, color: "#9aa3ad", glow: null,
    tex: { map: "moon_lroc_color_2048.jpg", bump: "moon_ldem_bump_1024.jpg" }, texSrc: "NASA SVS CGI Moon Kit: LROC WAC renk + LOLA kabartma (T2, T3)" },
  mars: { id: "mars", order: 5, enabled: true, name: "MARS", radius_km: 3396, gravity_ms2: 3.7, mean_temp_C: -65, pressure_bar: 0.01, moons: 2, orbit_days: 687.0,
    atmosphere: "%95,1 karbondioksit, %2,59 azot, %1,94 argon (hacimce)", atmoSrc: F("mars"), color: "#c4532f", glow: "#e0875f",
    tex: { map: "mars_viking_clr_2048.jpg" }, texSrc: "USGS Astrogeology, Viking colour global mosaic 925 m (T4)" },
};
// Listede görünen ama verisi olmayan cisimler (açılmaz).
for (const [id, order, name] of [["sun", 0, "SUN"], ["mercury", 1, "MERCURY"], ["venus", 2, "VENUS"], ["jupiter", 6, "JUPITER"], ["saturn", 7, "SATURN"], ["uranus", 8, "URANUS"], ["neptune", 9, "NEPTUNE"]])
  BODIES[id] = { id, order, enabled: false, name };

export const bodyList = () => Object.values(BODIES).sort((a, b) => a.order - b.order);
export const getBody = (id) => (BODIES[id]?.enabled ? BODIES[id] : null);
