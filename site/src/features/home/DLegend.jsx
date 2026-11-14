import React from "react";
import { Tag } from "../../common.jsx";
import { t } from "../../i18n/index.js";

/** Arazi uzaklığı (D) renk açıklaması: tek yönlü sıralı palet, iyi/kötü anlamı yok. Harita ve ana ekran ortak. */
export default function DLegend() {
  return (
    <>
      <div className="legend"><span>{t("map.near")}</span><span className="bar" /><span>{t("map.far")} (D)</span></div>
      <p>{t("map.legend")} <Tag kind="der" /></p>
      <p className="muted">{t("map.palette")}</p>
    </>
  );
}
