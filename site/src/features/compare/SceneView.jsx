import React, { useEffect, useRef, useState } from "react";
import { createRig, webglOK } from "./sceneRig.js";
import { buildSlopeCanvas } from "./slopeTexture.js";
import { buildSurfaceCanvas } from "./surfaceTexture.js";
import { SETTINGS } from "../../config.js";
import { t } from "../../i18n/index.js";

function Flat({ dem, limit, view, kind }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv || !dem) return;
    const src = view === "slope" ? buildSlopeCanvas(dem, limit) : buildSurfaceCanvas(dem, kind, SETTINGS.noDataColor); cv.width = src.width; cv.height = src.height; cv.getContext("2d").drawImage(src, 0, 0);
  }, [dem, limit, view, kind]);
  return <canvas ref={ref} className="flat2d" aria-label="2D eğim görünümü" />;
}

/** İki yarım 3D sahne. WebGL yoksa 2D eğim görünümü. dems/limits: [sol, sağ]. */
// view: "surface" (gösterim malzemesi) | "slope" (eğim katmanı); kinds: [sol, sağ] yüzey anahtarı (surfaceMaterials). labels: [sol, sağ] etiket; children: sahne üstü katman.
export default function SceneView({ dems, limits, exag, mode, unit, rigRef, view = "surface", kinds = ["moon", "neutral"], labels = [], children }) {
  const box = useRef(null), rig = useRef(null);
  const [gl] = useState(() => webglOK());
  useEffect(() => {
    if (!gl) return;
    rig.current = createRig(box.current);
    if (rigRef) rigRef.current = rig.current;
    window.__rig = rig.current;                      // ekran görüntüsü/hata ayıklama için
    return () => { rig.current.dispose(); rig.current = null; if (rigRef) rigRef.current = null; };
  }, [gl]);
  useEffect(() => { rig.current?.setSide(0, dems[0], limits[0], kinds[0]); }, [dems[0], limits[0], kinds[0], gl]);
  useEffect(() => { rig.current?.setSide(1, dems[1], limits[1], kinds[1]); }, [dems[1], limits[1], kinds[1], gl]);
  useEffect(() => { rig.current?.setView(view); }, [view, gl]);
  const over = <>{labels.length > 0 && <div className="surf-labels" aria-hidden="true">{labels.map((l) => <span key={l}>{l}</span>)}</div>}{children}</>;
  useEffect(() => { rig.current?.setExag(exag); }, [exag, gl]);
  useEffect(() => { rig.current?.setCamera(mode); }, [mode, gl]);
  useEffect(() => { rig.current?.setUnit(unit); }, [unit, gl, dems[0], dems[1]]);
  if (!gl) return <div className="scene flatwrap"><Flat dem={dems[0]} limit={limits[0]} view={view} kind={kinds[0]} /><Flat dem={dems[1]} limit={limits[1]} view={view} kind={kinds[1]} /><div className="warn fb">{t("cmp.fallback")}</div>{over}</div>;
  return <div className="scene" ref={box} role="img" aria-label={t("scene.aria")}>{over}</div>;
}
