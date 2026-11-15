# Any point on Earth: on-demand landform check

Click anywhere on the map/globe (or type a place name / `lat, lon` in "Find a place"). The selected-place panel downloads
elevation for a 10 × 10 km square around the point, measures the land and shows the terrain distance D to the chosen
Moon/Mars reference. "Compare in 3D" opens `#/compare/@lat,lon/<target>` with this square as the Earth tile.

## Pipeline (browser, Web Worker)
- Source: AWS Terrain Tiles, Terrarium PNG (`data_inventory.csv` row E8). Mostly NASA SRTM; other, non-NASA sources outside
  60° N – 56° S and in some countries. Labelled **approximate** everywhere; never mixed into the shipped candidate ranking.
- Zoom 12–14 (ground pixel ≤ 30 m, ~15–19 m). Local east/north grid of 349 × 349 cells × 30 m (333 window + 8 margin),
  WGS84 radii of curvature at the point -> Web Mercator pixel -> bilinear; each 30 m cell = mean of k×k samples (k ≈ 30 m / pixel).
- Heights ≤ 0 m = sea / no land data (tiles contain sea-floor depths). Removes a few dry places below sea level too.
- Same measures as `scripts/terrain.py` (Horn 3×3 slope, 11×11 relief, 11×11 RMS of z − 5×5 mean; any NaN in a filter window -> NaN).
  JS port checked against the Python functions on a synthetic 349×349 grid with voids: identical pixel counts, P10/P50/P90 equal
  to 1e-13, W1 equal to 5 digits.
- Same rules as `scripts/sim.py`: land share < 90 % -> no D; any O_k < 0.25 -> no D (reason shown); O_k ≥ 0.5 for all -> "would pass
  the filter" (shown either way). d_k = W1 / IQR(reference), D = mean of three.
- Difference: the reference pixels are not shipped, only histograms (slope 1°, relief 10 m, roughness 0.2 m bins), so W1 is
  computed exactly against the histogram with values spread evenly in each bin. The pipeline used 20,000-pixel random subsamples.
- Cache: memory per point; the resampled grid in IndexedDB (`analog-gap-points`), try/catch. Download ~0.6–1.3 s (9–16 tiles),
  math ~0.3–0.5 s in the worker (UI stays responsive).

## Validation (2026-11-15, Moon reference)
| Window | Shipped D (NASADEM) | On-demand D | d slope | d relief | d rough |
|---|---|---|---|---|---|
| ATA_r119_c61 (−25.4259, −67.9939) | 0.160 | 0.189 | 0.118 → 0.107 | 0.151 → 0.132 | 0.210 → 0.327 |
| HAW_r8_c12 (19.8942, −155.4822) | 0.194 | 0.227 | 0.174 → 0.168 | 0.204 → 0.204 | 0.204 → 0.307 |

Slope and relief agree well (P50 slope 12.24° vs 12.21°, relief 79.1 m vs 78.7 m at ATA). Roughness distance is ~0.1 higher:
roughness is the measure most sensitive to the source (tile data is upsampled server-side and resampled again here, NASADEM
was reprojected once; SRTM noise dominates roughness, limitation L02). So on-demand D runs about +0.03 above the pipeline;
treat it as approximate and do not rank it against shipped D values.

Outside all regions: Iceland 65.0, −16.8 -> D 0.916 (does not pass the 0.5 filter; outside the SRTM band, warning shown);
Hoggar, Sahara 23.3, 5.6 -> D 0.812 (Moon), Mars: no D (an overlap < 0.25); Pacific 0, −150 -> 0 % land, "no land data", no D.
Near the poles (> 85°) the tiles stop: "no elevation tiles" message.
