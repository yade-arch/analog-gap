import requests
r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json",
    params={"collection_concept_id":"C2763264762-LPCLOUD","readable_granule_name":"NASADEM_HGT_n35w112","page_size":5}, timeout=60)
es = r.json()["feed"]["entry"]; print(len(es))
for e in es:
    print(e["title"], e.get("granule_size"))
    for l in e["links"]: print("  ", l["href"])
