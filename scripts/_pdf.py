import pypdf,re
r=pypdf.PdfReader(r"C:\Users\Yade\.claude\projects\C--Users-Yade-analog-gap\067ee520-f71e-40c6-a413-1cb430c94190\tool-results\webfetch-1794567136803-z5555t.pdf")
for i,p in enumerate(r.pages):
    t=p.extract_text() or ""
    if re.search(r"\bNUM\b",t) and re.search(r"(?i)(code|value)",t) and ("GDEM" in t or "interpol" in t.lower()):
        print("=== page",i+1); print(t[:3500])
