// The SINGLE source of the glossary: name, unit, one-sentence meaning, technical name (shown only in details).
export const TERMS = {
  slope: { name: "How steep?", unit: "°", meaning: "How steep the ground is. 0° is flat, 90° is a vertical wall.", tech: "slope (Horn 3×3, 30 m)" },
  relief: { name: "How much higher?", unit: "m", meaning: "The difference between the highest and lowest point nearby.", tech: "local relief (330 m)" },
  rough: { name: "How bumpy?", unit: "m", meaning: "How bumpy the ground is at a small scale.", tech: "roughness (RMS)" },
  typical: { name: "Usual value and range", unit: "", meaning: "The middle value and the range where most of the place falls.", tech: "P50, P10–P90" },
  D: { name: "How different? (Terrain Gap D)", unit: "no unit", meaning: "How different the shape of the Earth land is from the reference: 0 = identical, lower = more similar. It is not a percentage or a similarity score, and not a physical distance.", tech: "D" },
  d_slope: { name: "Steepness gap", unit: "no unit", meaning: "Terrain distance for slope only; lower = more similar.", tech: "d_slope (d_k)" },
  d_relief: { name: "Height gap", unit: "no unit", meaning: "Terrain distance for height difference only; lower = more similar.", tech: "d_relief (d_k)" },
  d_rough: { name: "Bumpiness gap", unit: "no unit", meaning: "Terrain distance for surface roughness only; lower = more similar.", tech: "d_rough (d_k)" },
  overlap: { name: "How much they share", unit: "0–1", meaning: "How much of the reference's typical range is shared by the candidate's range: 0 = none, 1 = all.", tech: "O_k" },
  valid: { name: "How much was measured", unit: "%", meaning: "The share of the window that was actually measured; gaps are never counted as zero.", tech: "valid pixel fraction" },
  coverage: { name: "How much of the area we measured", unit: "", meaning: "How much of the area the result is based on real measurements.", tech: "Evidence Coverage" },
  reliability: { name: "How exact the measuring is", unit: "", meaning: "How much error and noise the measurement itself has; judged separately from coverage.", tech: "Evidence Reliability" },
  gap: { name: "What we cannot compare", unit: "", meaning: "Things that are missing or cannot be compared.", tech: "Gap" },
  temp: { name: "How hot or cold?", unit: "K", meaning: "Surface temperature (Earth: satellite measurement; Moon: model). They are not directly the same quantity.", tech: "LST / Diviner" },
};
// Labels (technical name shown in details).
export const TAGS = {
  obs: { name: "Real measurement", tech: "Observed Data" },
  der: { name: "Calculated", tech: "Derived Parameter" },
  int: { name: "Interpretation", tech: "Scientific Interpretation" },
  sim: { name: "Simulation assumption", tech: "Simulation assumption" },
};
// Search regions: the code stays the data key; a plain name is shown on screen. Source: public/data/regions.geojson
// (name, n_tiles) and STATUS.md tile counts (US-SW 45, ATA 24, ANA 18, HAW 6). Full name + extent: regions.geojson "name".
export const REGIONS = { "US-SW": "Southwestern USA", ATA: "Atacama and Central Andes (South America)", ANA: "Western/Central Anatolia (Türkiye)", HAW: "Island of Hawaiʻi (USA)" };
/** Region code -> plain name (unknown codes are returned as is). Use the code for data, this only for display. */
export const regionLabel = (code) => REGIONS[code] || code || "";
export const tipOf = (k) => { const x = TERMS[k]; return x ? `${x.name}${x.unit ? " (" + x.unit + ")" : ""}: ${x.meaning}${x.tech ? " Technical name: " + x.tech + "." : ""}` : ""; };
