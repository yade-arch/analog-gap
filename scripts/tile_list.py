"""regions.geojson + NASADEM karo listesi (CMR). Boyut toplamı indirmeden önce raporlanır."""
import csv, json, requests

# SPEC §3.1 yaklaşık kutuları (W, S, E, N). Kesin sınırlar = bu kutular; regions.geojson'da tutulur.
REGIONS = {
    "US-SW": ("ABD Güneybatı (Colorado Platosu, Mojave)", (-118.0, 34.0, -109.0, 39.0)),
    "ATA":   ("Atacama ve Orta And Dağları",                       (-71.0, -26.0, -67.0, -20.0)),
    "HAW":   ("Hawaii Büyük Ada",                          (-156.1, 18.9, -154.8, 20.3)),
    "ANA":   ("Batı ve Orta Anadolu",                      (29.0, 37.0, 35.0, 40.0)),
}
CID = "C2763264762-LPCLOUD"
eps = 0.001
rows, feats = [], []
for code, (name, (w, s, e, n)) in REGIONS.items():
    r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json", params={
        "collection_concept_id": CID, "bounding_box": f"{w+eps},{s+eps},{e-eps},{n-eps}", "page_size": 200}, timeout=120)
    r.raise_for_status()
    es = r.json()["feed"]["entry"]
    for x in es:
        url = next(l["href"] for l in x["links"] if l["href"].endswith(".zip") and "protected" in l["href"])
        rows.append({"region": code, "granule": x["title"], "size_mb": float(x["granule_size"]), "url": url})
    feats.append({"type": "Feature", "properties": {"code": code, "name": name, "bbox_wsen": [w, s, e, n],
                  "note": "SPEC §3.1 yaklaşık kutu; su/boşluk NASADEM kodlarıyla maskelenir; antropojenik alan maskesi yok (limitasyon)",
                  "n_tiles": len(es)},
                  "geometry": {"type": "Polygon", "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]]}})
    print(code, len(es), "karo", round(sum(float(x["granule_size"]) for x in es), 1), "MB")
json.dump({"type": "FeatureCollection", "features": feats}, open("data/regions.geojson", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open("data/nasadem_tiles.csv", "w", newline="", encoding="utf-8") as f:
    wr = csv.DictWriter(f, fieldnames=["region", "granule", "size_mb", "url"]); wr.writeheader(); wr.writerows(rows)
print("TOPLAM", len(rows), "karo", round(sum(r["size_mb"] for r in rows), 1), "MB (CMR granule_size)")
