# Redesign handoff (2026-11-15, branch `gezegen-kesif`)

Source: the "complete application redesign" brief (Parts 1–15). Work was done in priority order with a small budget.

## Done and checked (`npm run check` passes)
- Four main tabs: Explore, Compare, My places, Mission. Method / Project / Moon-Mars choice stay in the ☰ menu.
- ▾ menu on Explore, Compare and My places shows one part of the page at a time (`src/features/mapSections.js`).
- Black-and-white mode: ☰ menu checkbox, kept in localStorage (`src/features/appearance.js`, `src/mono.css`). Colours become greys. Images, globes, maps, SVG charts and the game canvas are shown in greyscale. The three result labels use solid, dashed and dotted outlines.
- Compare: "Your result" card (`src/features/overview/ResultSummary.jsx`). It shows place and coordinates, reference, D, Earth and reference P50 for slope, relief and roughness with units, most and least alike (smallest/largest d_k), missing data, a caution line, a "Download full PDF report" button (opens the existing report page) and JSON under "More export options". Quick on-demand checks are labelled "Approximate".
- Explore point panel: action renamed to "Compare this place" (already opened Compare with the point).
- Merged `claude/global-analysis-8184cd` (any point on Earth).
- Start screen (`#/start`, now the default page; `src/pages/Start.jsx`): Earth globe, short intro, Moon/Mars choice, place search, "Find a place", up to 4 recent places. A globe click or search opens Explore with that point already selected (`#/map?lat=..&lon=..&name=..`). Checked in the browser.
- PDF report (`src/print.css`, `pages/Report.jsx`, `features/ui/SciChart.jsx`): A4 pages, light paper colours, one column, cards and charts are not split across pages, page numbers and a footer (where the browser supports @page margin boxes), a header block with place, reference, D, date and data products, every closed section opened while printing, and all three charts printed (screen keeps tabs). Earth line is dashed. "Download full PDF report" is the first button; it opens the print window by itself when reached from the result card. JSON is under "More export options". Checked by applying the print rules on screen: nothing wider than the page, no dark backgrounds, no Turkish text. A real browser PDF was not saved.
- My places (`features/ui/Discovered.jsx`, `features/planet/discovered.js`, `pages/ListPage.jsx`): two groups, "Places you explored" first and "Best matches from our scan" second, with a note that only 4 regions were scanned. Explored places have a favourite star (favourites are never dropped when the 24-place limit is reached), the date explored, filters (All, Closer to the Moon, Closer to Mars, Favourites, Last 7 days) and "Pick to compare": two picked places show their saved numbers side by side, with nothing new calculated. Also fixed: a saved place name was lost when the same point was checked again. Checked in the browser with 2 saved places.
- Data sources page (`#/data`, ☰ menu, footer link; `pages/DataSources.jsx`): 11 groups by purpose built from data_inventory.json plus NASA POWER, NASA GIBS / Blue Marble and OpenStreetMap. "NASA data" or "Not NASA data" is shown once per source. AWS Terrain Tiles is described as mostly NASA SRTM and not NASADEM. Versions, licence, citation and access path are in "More details". Provider chips were removed from the Compare place cards. The last Turkish words in the inventory (piksel, derece, kutular, KULLANILMIYOR) were translated in both the JSON and the CSV.
- Method page: already had the four simple steps and expandable sections; these are now named "For scientists". Turkish control headings were translated. Added: a similar shape alone does not make a place right for a mission, with a link to Data sources. The positive-control result ("target not met") is unchanged.

## Not verified
- Black-and-white mode was not looked at in the browser. Check the globe, charts, report printout and the game.
- The result card for an on-demand point: it may show "not enough data yet" if the point object has no `d` / `derived_percentiles`.

## Not started (next, in this order)
1. (done: start screen)
2. PDF report: layout fixed (see Done). Still missing: a PDF for on-demand points (no scan window, so no report page yet) and terrain pictures of both places inside the PDF (Part 4).
3. (done: My places) Still missing there: report download for explored places (needs the on-demand PDF), comparing two scan candidates with each other.
4. (done: Data sources page)
5. (done: Method page)
6. Black-and-white mode: line patterns in charts instead of greyscale alone (Part 11).
7. Mission game expansion (Part 8): mission types, suit/rover/equipment effects, resources, outcomes, logbook. This is large and needs its own session.
