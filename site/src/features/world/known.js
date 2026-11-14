// "Bilinen analog" etiketi: koordinatlı katalog noktası (known_analogs.json) 10×10 km pencerenin içine düşüyorsa (merkezden ±5 km, düz yaklaşık).
// Değilse "katalogda yok": bu kısa katalogda yok demektir, "keşfedilmemiş" değil.
const KM_PER_DEG = 111.32, HALF_KM = 5;
export function knownIn(p, known) {
  const c = Math.cos((p.center_lat * Math.PI) / 180);
  return (known || []).find((k) => k.lat && Math.abs((+k.lat - p.center_lat) * KM_PER_DEG) <= HALF_KM && Math.abs((+k.lon - p.center_lon) * KM_PER_DEG * c) <= HALF_KM) || null;
}
/** Referans için sade ad (hedefe göre). */
export const REF_NAME = { moon: "Shackleton kraterinin çevresi (güney kutbu)", mars: "Jezero krateri çevresi (R2 alanı)" };
