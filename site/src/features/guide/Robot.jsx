// Friendly robot guide shared by Story Mode and Time Machine (same look, same voice). Speech = animated bubble.
import React from "react";

export function Robot({ size = 120 }) {
  return (
    <svg className="rb-bot" viewBox="0 0 80 100" width={size} height={size * 1.25} aria-hidden="true">
      <line x1="40" y1="4" x2="40" y2="14" stroke="#9fb8d8" strokeWidth="3" /><circle className="rb-ant" cx="40" cy="4" r="4" fill="#ffd27a" />
      <rect x="14" y="14" width="52" height="38" rx="12" fill="#dfe8f4" stroke="#4d8fe6" strokeWidth="3" />
      <rect x="20" y="22" width="40" height="22" rx="8" fill="#13233f" />
      <circle className="rb-eye" cx="31" cy="33" r="5" fill="#7fe0ff" /><circle className="rb-eye" cx="49" cy="33" r="5" fill="#7fe0ff" />
      <rect x="22" y="56" width="36" height="30" rx="8" fill="#dfe8f4" stroke="#4d8fe6" strokeWidth="3" />
      <circle cx="40" cy="70" r="6" fill="#4d8fe6" />
      <rect x="6" y="58" width="12" height="6" rx="3" fill="#9fb8d8" /><rect x="62" y="58" width="12" height="6" rx="3" fill="#9fb8d8" />
      <rect x="26" y="88" width="10" height="10" rx="3" fill="#6f86a6" /><rect x="44" y="88" width="10" height="10" rx="3" fill="#6f86a6" />
    </svg>
  );
}

export function RobotSays({ text, children }) {
  return (
    <div className="rb-wrap">
      <Robot />
      <div className="rb-bubble" key={text} role="status" aria-live="polite"><p>{text}</p>{children}</div>
    </div>
  );
}
