import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Download, ShoppingBag, Circle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BOOMBOX_IMG =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/qdcx3gp4_969a6a9b-e488-43de-b364-591b5b7f73c5.jpeg";

const fmt = (s) => {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// 6-spoke cassette reel (not a CD platter)
const CassetteReel = ({ spinning, color }) => (
  <div
    className={`relative w-full h-full rounded-full ${spinning ? "animate-[spin_1.6s_linear_infinite]" : ""}`}
    style={{ transformOrigin: "center" }}
  >
    {[0, 60, 120, 180, 240, 300].map((deg) => (
      <div
        key={deg}
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: "12%",
          height: "70%",
          backgroundColor: color,
          opacity: 0.85,
          transform: `translate(-50%, -50%) rotate(${deg}deg)`,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      />
    ))}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: "22%", height: "22%", backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
    />
  </div>
);

// Hotspot button overlaid on the boombox photo
const HotBtn = ({ onClick, active, label, testid, children, style, glow = "#ff3300" }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    aria-label={label}
    style={style}
    className={`absolute flex items-center justify-center rounded-full border backdrop-blur-[2px] transition-all ${
      active
        ? "border-[var(--g)] bg-[var(--g)]/30 scale-105 opacity-100"
        : "border-white/15 bg-black/10 opacity-60 hover:border-[var(--g)] hover:bg-[var(--g)]/20 hover:opacity-100 hover:scale-105"
    }`}
    {...{ "data-glow": glow }}
  >
    <div style={{ "--g": glow, color: active ? "#fff" : "rgba(255,255,255,0.9)" }} className="contents">
      {children}
    </div>
  </button>
);

export const Boombox = () => {
  const [tracks, setTracks] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSlug, setRecordingSlug] = useState(null);
  const [volume, setVolume] = useState(0.75);
  const [powered, setPowered] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API}/instrumentals`)
      .then((r) => setTracks(r.data))
      .catch(() => toast.error("Could not load instrumentals"));
  }, []);

  const current = tracks[idx];

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (current.coming_soon || !current.audio_url) {
      a.pause();
      a.removeAttribute("src");
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }
    a.src = current.audio_url;
    a.currentTime = 0;
    a.volume = volume;
    setCurrentTime(0);
    if (isPlaying && powered) a.play().catch(() => {});
  }, [idx, current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setCurrentTime(a.currentTime);
      if (current && !current.is_free && a.currentTime >= (current.preview_seconds || 30)) {
        a.pause();
        a.currentTime = 0;
        setIsPlaying(false);
        toast(`30 sec preview ended — buy "${current.title}" for the full beat`);
      }
    };
    const onMeta = () => setDuration(a.duration);
    const onEnded = () => setIsPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnded);
    };
  }, [current]);

  const play = () => {
    if (!powered) {
      toast.error("Boombox is off. Hit the power switch.");
      return;
    }
    if (current?.coming_soon) {
      toast("This beat is coming soon — stay tuned.");
      return;
    }
    const a = audioRef.current;
    if (!a || !current) return;
    a.play().then(() => setIsPlaying(true)).catch(() => toast.error("Audio failed to load"));
  };
  const pause = () => { audioRef.current?.pause(); setIsPlaying(false); };
  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause(); a.currentTime = 0;
    setCurrentTime(0); setIsPlaying(false);
  };
  const next = () => setIdx((i) => (i + 1) % Math.max(tracks.length, 1));
  const prev = () => setIdx((i) => (i - 1 + tracks.length) % Math.max(tracks.length, 1));

  const handleSelect = (i) => {
    setIdx(i);
    setTimeout(play, 50);
  };

  const handleDownload = async (track) => {
    if (!track.is_free) return;
    setIsRecording(true);
    setRecordingSlug(track.slug);
    toast(`Recording "${track.title}" to Deck B...`);
    try {
      const { data } = await axios.post(`${API}/instrumentals/${track.slug}/download`);
      await new Promise((res) => setTimeout(res, 4000));
      const a = document.createElement("a");
      a.href = data.audio_url; a.download = `${track.slug}.mp3`;
      a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success(`"${track.title}" recorded — check your downloads`);
    } catch {
      toast.error("Download failed. Try again.");
    } finally {
      setIsRecording(false); setRecordingSlug(null);
    }
  };

  const cycleVolume = () => {
    setVolume((v) => {
      const next = v >= 0.99 ? 0 : Math.min(1, Math.round((v + 0.25) * 4) / 4);
      toast(`Volume ${Math.round(next * 100)}%`);
      return next;
    });
  };

  const togglePower = () => {
    if (powered && isPlaying) stop();
    setPowered((p) => !p);
    toast(powered ? "Power OFF" : "Power ON");
  };

  // Notify global background music to duck while boombox is active
  useEffect(() => {
    const evt = isPlaying || isRecording ? "boombox-active" : "boombox-inactive";
    window.dispatchEvent(new CustomEvent(evt));
  }, [isPlaying, isRecording]);

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const previewCap = current?.is_free ? duration : Math.min(duration || 0, current?.preview_seconds || 30);

  return (
    <section
      id="boombox"
      data-testid="boombox-section"
      className="relative bg-[#0a0a0a] border-y border-white/10 px-4 md:px-8 lg:px-12 py-16 md:py-24 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/4 w-[40vw] h-[40vw] rounded-full bg-[#dfff00] opacity-[0.06] blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[#ff3300] opacity-[0.06] blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ The Boombox</p>
          <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-2">
            Press Play.
          </h2>

          <blockquote
            data-testid="boombox-manifesto"
            className="mt-8 border-l-4 border-[#ff3300] pl-5 md:pl-7 max-w-3xl"
          >
            <p className="font-heading text-lg md:text-2xl uppercase tracking-tight leading-snug text-white">
              "For Beats by Dez, hip-hop is life. This brand was born from a deep, unapologetic love
              for the music and the lifestyle behind it. To show that love, I'm paying it forward
              by offering free downloads of my production — putting the music back into the hands
              of the people who need it. I'm always looking to collaborate with artists, songwriters,
              producers, singers, and musicians who share that same grit. If you've got something
              to say, let's get to work."
            </p>
            <footer className="mt-4 text-[10px] tracking-[0.3em] uppercase font-bold text-[#dfff00]">
              — Dez
            </footer>
          </blockquote>

          <p className="text-white/60 text-sm mt-6 max-w-xl">
            Preview beats for sale, or jack a free starter pack onto Deck B. 30-second previews on paid joints.
            Free downloads are real, untagged MP3s.
          </p>
        </div>

        {/* BOOMBOX — graffiti photo as the body */}
        <div
          data-testid="boombox-body"
          className="relative aspect-square max-w-4xl mx-auto select-none"
        >
          <img
            src={BOOMBOX_IMG}
            alt="BeatsByDez Boombox"
            className="absolute inset-0 w-full h-full object-cover"
            draggable="false"
          />
          {/* Dim slightly when powered off */}
          {!powered && <div className="absolute inset-0 bg-black/60 transition-opacity" />}

          {/* LCD READOUT — overlaid on the tuner strip */}
          <div
            data-testid="boombox-lcd"
            className="absolute bg-black/85 border border-[#dfff00]/50 px-3 py-1 flex items-center gap-2 font-mono"
            style={{ top: "40.2%", left: "16%", width: "68%", height: "3.4%" }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                powered ? (isPlaying ? "bg-[#dfff00] animate-pulse" : "bg-[#dfff00]/40") : "bg-red-500/40"
              }`}
            />
            <span data-testid="lcd-title" className="text-[#dfff00] text-[10px] md:text-xs tracking-[0.15em] uppercase truncate flex-1">
              {!powered ? "— OFF —" : current?.title || "INSERT TAPE"}
            </span>
            <span data-testid="lcd-time" className="text-[#dfff00] text-[9px] md:text-[10px] font-bold tabular-nums">
              {fmt(currentTime)}/{fmt(previewCap)}
            </span>
          </div>

          {/* LCD progress bar — directly under the LCD */}
          <div
            className="absolute bg-black/70 overflow-hidden"
            style={{ top: "44%", left: "16%", width: "68%", height: "0.6%" }}
          >
            <div
              data-testid="lcd-progress"
              className="h-full bg-[#dfff00] transition-all"
              style={{ width: `${powered ? progressPct : 0}%` }}
            />
          </div>

          {/* CASSETTE A — left "BEATS" reels (positioned over the cassette label) */}
          <div
            data-testid="deck-a"
            className="absolute flex items-center justify-around"
            style={{ top: "45.5%", left: "26%", width: "19%", height: "8.5%" }}
          >
            <div style={{ width: "44%", height: "100%" }}>
              <CassetteReel spinning={powered && isPlaying} color="#ff3300" />
            </div>
            <div style={{ width: "44%", height: "100%" }}>
              <CassetteReel spinning={powered && isPlaying} color="#ff3300" />
            </div>
          </div>

          {/* CASSETTE B — right "DEZ" reels (records when downloading) */}
          <div
            data-testid="deck-b"
            className="absolute flex items-center justify-around"
            style={{ top: "45.5%", left: "56%", width: "19%", height: "8.5%" }}
          >
            <div style={{ width: "44%", height: "100%" }}>
              <CassetteReel spinning={powered && isRecording} color="#dfff00" />
            </div>
            <div style={{ width: "44%", height: "100%" }}>
              <CassetteReel spinning={powered && isRecording} color="#dfff00" />
            </div>
          </div>

          {/* REC LED on Deck B */}
          {isRecording && (
            <div
              className="absolute flex items-center gap-1 bg-black/85 px-1.5 py-0.5 border border-[#ff3300]"
              style={{ top: "43%", left: "56%" }}
              data-testid="rec-led"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3300] animate-pulse" />
              <span className="text-[#ff3300] text-[8px] tracking-[0.2em] font-bold">REC</span>
            </div>
          )}

          {/* TAPE TRANSFER glow — line from Deck A to Deck B while recording */}
          {isRecording && (
            <div
              className="absolute pointer-events-none"
              style={{ top: "49.5%", left: "44%", width: "13%", height: "1.4%" }}
            >
              <div className="w-full h-full bg-gradient-to-r from-[#ff3300] via-[#dfff00] to-[#dfff00] opacity-80 animate-pulse" />
            </div>
          )}

          {/* POWER LED (top right above mixer) */}
          <div
            className="absolute rounded-full transition-all"
            style={{
              top: "23%",
              left: "21.5%",
              width: "0.9%",
              height: "0.9%",
              backgroundColor: powered ? "#22c55e" : "#444",
              boxShadow: powered ? "0 0 10px #22c55e" : "none",
            }}
          />

          {/* TRANSPORT BUTTON HOTSPOTS — over the chrome button row */}
          <HotBtn onClick={prev} label="Previous track" testid="bbox-prev"
            style={{ top: "65.5%", left: "23%", width: "5.5%", height: "5.5%" }}>
            <SkipBack className="w-3 h-3 md:w-4 md:h-4" />
          </HotBtn>

          {isPlaying && powered ? (
            <HotBtn onClick={pause} active label="Pause" testid="bbox-pause"
              style={{ top: "65.5%", left: "35%", width: "5.5%", height: "5.5%" }} glow="#dfff00">
              <Pause className="w-3 h-3 md:w-4 md:h-4" />
            </HotBtn>
          ) : (
            <HotBtn onClick={play} label="Play" testid="bbox-play"
              style={{ top: "65.5%", left: "35%", width: "5.5%", height: "5.5%" }} glow="#dfff00">
              <Play className="w-3 h-3 md:w-4 md:h-4" />
            </HotBtn>
          )}

          <HotBtn onClick={stop} label="Stop" testid="bbox-stop"
            style={{ top: "65.5%", left: "47%", width: "5.5%", height: "5.5%" }}>
            <Square className="w-3 h-3 md:w-4 md:h-4" />
          </HotBtn>

          <HotBtn onClick={next} label="Next track" testid="bbox-next"
            style={{ top: "65.5%", left: "59%", width: "5.5%", height: "5.5%" }}>
            <SkipForward className="w-3 h-3 md:w-4 md:h-4" />
          </HotBtn>

          <HotBtn onClick={() => current?.is_free && handleDownload(current)}
            active={isRecording} label="Record / download free beat" testid="bbox-rec"
            style={{ top: "65.5%", left: "71%", width: "5.5%", height: "5.5%" }} glow="#ff3300">
            <Circle className={`w-3 h-3 md:w-4 md:h-4 ${isRecording ? "fill-white text-white" : "fill-[#ff3300] text-[#ff3300]"}`} />
          </HotBtn>

          {/* VOLUME KNOB — over leftmost knob in mixer */}
          <HotBtn onClick={cycleVolume} label={`Volume ${Math.round(volume * 100)}%`} testid="bbox-volume"
            style={{ top: "26.5%", left: "29.2%", width: "4%", height: "4.5%" }} glow="#dfff00">
            <span className="text-[7px] md:text-[9px] font-bold tabular-nums">{Math.round(volume * 100)}</span>
          </HotBtn>

          {/* POWER SWITCH — over top-left switch */}
          <HotBtn onClick={togglePower} active={!powered} label="Power" testid="bbox-power"
            style={{ top: "23.5%", left: "21%", width: "4%", height: "4.5%" }}
            glow={powered ? "#22c55e" : "#ff3300"}>
            <span className="text-[7px] md:text-[8px] font-bold tracking-widest">{powered ? "ON" : "OFF"}</span>
          </HotBtn>

          {/* CASSETTE-A clickable surface — clicking the BEATS cassette plays the current track */}
          <button
            type="button"
            onClick={play}
            aria-label="Activate Deck A"
            data-testid="deck-a-click"
            className="absolute hover:bg-white/5 transition-colors"
            style={{ top: "46%", left: "25%", width: "20%", height: "12%" }}
          />
          {/* CASSETTE-B clickable surface — clicking the DEZ cassette downloads the current free beat */}
          <button
            type="button"
            onClick={() => current?.is_free && handleDownload(current)}
            aria-label="Activate Deck B"
            data-testid="deck-b-click"
            className="absolute hover:bg-white/5 transition-colors"
            style={{ top: "46%", left: "55%", width: "20%", height: "12%" }}
          />
        </div>

        {/* TRACK LIST */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          {tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              active={i === idx}
              isPlaying={isPlaying && i === idx}
              recording={recordingSlug === t.slug}
              onSelect={() => handleSelect(i)}
              onDownload={() => handleDownload(t)}
            />
          ))}
        </div>

        <audio ref={audioRef} preload="metadata" />
      </div>
    </section>
  );
};

const TrackRow = ({ track, active, isPlaying, recording, onSelect, onDownload }) => (
  <div
    data-testid={`track-row-${track.slug}`}
    className={`flex items-center gap-3 p-3 border ${
      track.coming_soon
        ? "border-white/10 bg-[#0a0a0a] opacity-60"
        : active
        ? "border-[#ff3300] bg-[#ff3300]/5"
        : "border-white/10 bg-[#0a0a0a]"
    } transition-colors`}
  >
    <button
      type="button"
      onClick={onSelect}
      disabled={track.coming_soon}
      aria-label={`Play ${track.title}`}
      data-testid={`track-play-${track.slug}`}
      className={`w-12 h-12 flex items-center justify-center border border-white/20 transition-colors ${
        track.coming_soon ? "cursor-not-allowed text-white/30" : "hover:border-[#ff3300] hover:text-[#ff3300]"
      }`}
    >
      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
    </button>
    <div className="flex-1 min-w-0">
      <p className="font-heading text-base md:text-lg uppercase tracking-tight truncate leading-none">
        {track.title}
      </p>
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold mt-1">
        {track.mood} · BPM {track.bpm} · {track.key}
      </p>
    </div>
    {track.coming_soon ? (
      <span
        data-testid={`track-coming-soon-${track.slug}`}
        className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-bold border border-white/20 text-white/50"
      >
        Coming Soon
      </span>
    ) : track.is_free ? (
      <button
        type="button"
        onClick={onDownload}
        disabled={recording}
        data-testid={`track-download-${track.slug}`}
        className={`flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.2em] uppercase font-bold border transition-colors ${
          recording
            ? "border-[#dfff00] text-[#dfff00] bg-[#dfff00]/10 animate-pulse"
            : "border-[#dfff00] text-[#dfff00] hover:bg-[#dfff00] hover:text-black"
        }`}
      >
        <Download className="w-3.5 h-3.5" /> {recording ? "REC..." : "Free DL"}
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <span className="font-heading text-lg">${track.price}</span>
        <button
          type="button"
          onClick={() => window.location.assign("/shop")}
          data-testid={`track-buy-${track.slug}`}
          className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-[0.2em] uppercase font-bold border border-white/20 hover:border-[#ff3300] hover:text-[#ff3300]"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Buy
        </button>
      </div>
    )}
  </div>
);
