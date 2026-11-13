"""MYD11A2.061, 2023 takvim yılı: bölge bbox'ları için CMR granül listesi ve toplam boyut (indirmeden).
Çıktı: data/modis_granules.csv"""
import csv, json, requests

CMR = "https://cmr.earthdata.nasa.gov/search/granules.json"
COLL = "C2269057787-LPCLOUD"
REG = {f["properties"]["code"]: f["properties"]["bbox_wsen"] for f in json.load(open("data/regions.geojson"))["features"]}
seen, rows = {}, []
for code, (w, s, e, n) in REG.items():
    r = requests.get(CMR, params={"collection_concept_id": COLL, "bounding_box": f"{w},{s},{e},{n}",
                                  "temporal": "2023-01-01T00:00:00Z,2023-12-31T23:59:59Z", "page_size": 2000}, timeout=60)
    r.raise_for_status()
    for g in r.json()["feed"]["entry"]:
        gid = g["title"]
        urls = [l["href"] for l in g.get("links", []) if l.get("rel", "").endswith("/data#") and l["href"].startswith("https")]
        if gid not in seen:
            seen[gid] = {"granule": gid, "regions": {code}, "size_mb": float(g.get("granule_size", 0) or 0), "url": urls[0] if urls else "", "time_start": g.get("time_start")}
        else:
            seen[gid]["regions"].add(code)
tiles = {}
for g in seen.values():
    t = g["granule"].split(".")[2]
    tiles.setdefault(t, []).append(g)
for g in seen.values():
    rows.append({**g, "regions": "|".join(sorted(g["regions"]))})
with open("data/modis_granules.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print("granül", len(rows), "toplam MB", round(sum(g["size_mb"] for g in rows), 1))
print({t: (len(v), sorted({r for g in v for r in g["regions"]})) for t, v in sorted(tiles.items())})
