// DEM pencereleri (scripts/export_dem_windows.py): gzip -> Int16 yükseklik [G*G] + Uint8 eğim [G*G]. Pencere başına tembel yüklenir.
const base = import.meta.env.BASE_URL + "data/dem/";
let indexP = null;
const cache = new Map();

export const loadDemIndex = () => (indexP ||= fetch(base + "index.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error("index.json " + r.status)))));

async function gunzip(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] !== 0x1f || u8[1] !== 0x8b) return buf;            // sunucu zaten açmış
  const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(s).arrayBuffer();
}

/** -> { id, G, z: Int16Array, slope: Uint8Array, meta } */
export function loadDem(id) {
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const idx = await loadDemIndex();
      const meta = idx.windows[id];
      if (!meta) throw new Error("DEM yok: " + id);
      const r = await fetch(base + id + ".bin.gz");
      if (!r.ok) throw new Error(id + " " + r.status);
      const buf = await gunzip(await r.arrayBuffer());
      const G = idx.grid, n = G * G;
      return { id, G, z: new Int16Array(buf, 0, n), slope: new Uint8Array(buf, n * 2, n), meta, idx };
    })().catch((e) => { cache.delete(id); throw e; }));
  }
  return cache.get(id);
}

export const slopeDeg = (dem, k) => (dem.slope[k] === dem.idx.slope_nodata ? NaN : dem.slope[k] * dem.idx.slope_step_deg);
export const elev = (dem, k) => (dem.z[k] === dem.idx.z_nodata ? NaN : dem.z[k]);
