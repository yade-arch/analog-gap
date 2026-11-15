// Intro video shown when the site opens (once per visit); ✕ top right closes it, it also closes itself at the end.
import React, { useState } from "react";

export default function IntroVideo() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="intro-v" role="dialog" aria-label="Space Sync intro video">
      <video src={import.meta.env.BASE_URL + "data/intro.mp4"} autoPlay muted playsInline controls onEnded={() => setOpen(false)} />
      <button type="button" className="intro-x" aria-label="Close video" onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
