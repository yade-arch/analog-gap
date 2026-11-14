import { t } from "../../i18n/index.js";

/** t() + {ad} yer tutucuları. */
export const tf = (k, v = {}) => t(k).replace(/\{(\w+)\}/g, (_, n) => (v[n] === undefined ? "" : v[n]));
