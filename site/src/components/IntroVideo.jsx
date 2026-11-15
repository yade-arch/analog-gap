// Intro video shown when the site opens after GET STARTED; ✕ top right or the end of the video closes it.
import React from "react";

export default function IntroVideo({ onClose }) {
  const setOpen = () => onClose?.();
  return (
    <div className="intro-v" role="dialog" aria-label="Space Sync intro video">
      <video src={import.meta.env.BASE_URL + "data/intro.mp4"} autoPlay muted playsInline controls onEnded={() => setOpen(false)} />
      <button type="button" className="intro-x" aria-label="Close video" onClick={() => setOpen(false)}>✕</button>
    </div>
  );
}
