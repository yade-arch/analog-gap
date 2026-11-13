import tr from "./tr.js";
import en from "./en.js";
import { SETTINGS } from "../config.js";

const L = { tr, en };
export const t = (k) => (L[SETTINGS.lang] && L[SETTINGS.lang][k]) || tr[k] || k;
