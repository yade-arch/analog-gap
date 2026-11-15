// Mission logbook: the last missions this viewer played, kept in this browser (localStorage, try/catch;
// a private window or blocked storage simply shows an empty logbook). Game results only, not NASA data.
const KEY = "analog-gap-logbook-v1", MAX = 20;

// Three outcome levels from the game's four results (game rule, not a mission prediction).
export const TIER = { success: "success", risky: "partial", nooxygen: "failure", timeout: "failure" };
export const tierOf = (result) => TIER[result] || "failure";

export function listLog() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

export function addLog(entry) {
  try { localStorage.setItem(KEY, JSON.stringify([{ ...entry, t: Date.now() }, ...listLog()].slice(0, MAX))); } catch { /* storage unavailable */ }
}

export function clearLog() { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } }
