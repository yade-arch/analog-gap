# Redesign handoff (2026-11-15, branch `gezegen-kesif`)

Source: the "complete application redesign" brief (Parts 1–15). Work was done in priority order with a small budget.

## Done and checked (`npm run check` passes)
- Four main tabs: Explore, Compare, My places, Mission. Method / Project / Moon-Mars choice stay in the ☰ menu.
- ▾ menu on Explore, Compare and My places shows one part of the page at a time (`src/features/mapSections.js`).
- Black-and-white mode: ☰ menu checkbox, kept in localStorage (`src/features/appearance.js`, `src/mono.css`). Colours become greys. Images, globes, maps, SVG charts and the game canvas are shown in greyscale. The three result labels use solid, dashed and dotted outlines.
- Compare: "Your result" card (`src/features/overview/ResultSummary.jsx`). It shows place and coordinates, reference, D, Earth and reference P50 for slope, relief and roughness with units, most and least alike (smallest/largest d_k), missing data, a caution line, a "Download full PDF report" button (opens the existing report page) and JSON under "More export options". Quick on-demand checks are labelled "Approximate".
- Explore point panel: action renamed to "Compare this place" (already opened Compare with the point).
- Merged `claude/global-analysis-8184cd` (any point on Earth).

## Not verified
- Black-and-white mode was not looked at in the browser. Check the globe, charts, report printout and the game.
- The result card for an on-demand point: it may show "not enough data yet" if the point object has no `d` / `derived_percentiles`.

## Not started (next, in this order)
1. Start screen: globe + intro + search + Moon/Mars choice + recent places (Part 1).
2. PDF report: real PDF for on-demand points; fix page breaks and image scaling in the print CSS (Part 4).
3. My places: two groups (Places I explored / Best matches from our scan), favourites and Moon/Mars filters, compare two saved places (Part 6).
4. One "Data sources" section grouped by purpose. Remove repeated "NASA" badges from cards. Check that AWS Terrain Tiles is never labelled NASADEM (Part 5).
5. Method page: four simple steps + "For scientists" sections (Part 9).
6. Black-and-white mode: line patterns in charts instead of greyscale alone (Part 11).
7. Mission game expansion (Part 8): mission types, suit/rover/equipment effects, resources, outcomes, logbook. This is large and needs its own session.
