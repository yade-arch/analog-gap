"""Site için veri dosyalarını site/public/data altına UTF-8 olarak kopyalar (kaynağı değiştirmez)."""
import csv, json, shutil
from pathlib import Path

out = Path("site/public/data"); out.mkdir(parents=True, exist_ok=True)
for n in ("candidates_moon.geojson", "candidates_mars.geojson", "reference_moon.json", "reference_mars.json", "controls.json", "limitations.json",
          "validation.json", "thermal_earth.json", "thermal_moon.json", "regions.geojson", "exploratory_moon_sites.json"):
    p = Path("data") / n
    if not p.exists():
        print("yok:", n); continue
    txt = p.read_bytes().decode("utf-8", errors="replace")
    obj = json.loads(txt)
    (out / n).write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
for n in ("data_inventory.csv", "known_analogs.csv", "parameters_sources.csv"):
    rows = list(csv.DictReader(open(n, encoding="utf-8")))
    (out / (n.replace(".csv", ".json"))).write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
shutil.copy("data_inventory.csv", out / "data_inventory.csv")
print("tamam", sorted(x.name for x in out.iterdir()))
