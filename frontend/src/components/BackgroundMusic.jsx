import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";

const SRC =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/7cr2q3ke_1996.mp3";

export const BackgroundMusic = () => {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [active, setActive] = useState(false); // user has actually played at least once
  const [boomboxActive, setBoomboxActive] = useState(false);

  // Initial setup: muted autoplay loop
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.muted = true;
    a.volume = 0.32;
    a.play().catch(() => {});
  }, []);

  // Duck when boombox is doing anything
  useEffect(() => {
    const onActive = () => {
      setBoomboxActive(true);
      audioRef.current?.pause();
    };
    const onInactive = () => {
      setBoomboxActive(false);
      if (active && !muted) {
        audioRef.current?.play().catch(() => {});
      }
    };
    window.addEventListener("boombox-active", onActive);
    window.addEventListener("boombox-inactive", onInactive);
    return () => {
      window.removeEventListener("boombox-active", onActive);
      window.removeEventListener("boombox-inactive", onInactive);
    };
  }, [muted, active]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (muted) {
      a.muted = false;
      a.volume = 0.32;
      a.play().catch(() => {});
      setMuted(false);
      setActive(true);
    } else {
      a.muted = true;
      setMuted(true);
    }
  };

  const label = (() => {
    if (muted) return "Play 1996";
    if (boomboxActive) return "1996 · ducked";
    return "1996 · Dez";
  })();

  return (
    <>
      <audio ref={audioRef} src={SRC} preload="auto" />
      <button
        type="button"
        onClick={toggle}
        data-testid="bg-music-toggle"
        aria-label={muted ? "Play background music" : "Mute background music"}
        className={`fixed bottom-5 left-5 z-50 flex items-center gap-2 px-4 py-2.5 border backdrop-blur transition-all ${
          muted
            ? "border-white/20 bg-black/60 text-white hover:border-[#dfff00] hover:text-[#dfff00]"
            : "border-[#dfff00] bg-black/60 text-[#dfff00]"
        }`}
      >
        {muted ? (
          <VolumeX className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className={`w-3.5 h-3.5 ${boomboxActive ? "opacity-40" : "animate-pulse"}`} />
        )}
        <span className="text-[10px] tracking-[0.2em] uppercase font-bold">{label}</span>
        {muted && <Music className="w-3 h-3 ml-1 animate-pulse text-[#ff3300]" />}
      </button>
    </>
  );
};
