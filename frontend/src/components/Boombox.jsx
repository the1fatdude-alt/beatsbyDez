import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, SkipBack, SkipForward, Download, ShoppingBag, Circle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmt = (s) => {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const Reel = ({ spinning, color = "#ff3300" }) => (
  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#0a0a0a] border border-white/20 flex items-center justify-center overflow-hidden">
    <div
      className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-2 border-dashed flex items-center justify-center ${
        spinning ? "animate-[spin_1.6s_linear_infinite]" : ""
      }`}
      style={{ borderColor: color }}
    >
      <div className="w-2 h-2 rounded-full bg-white/40" />
    </div>
  </div>
);

const EQBars = ({ active }) => (
  <div className="flex items-end gap-[3px] h-10">
    {Array.from({ length: 14 }).map((_, i) => (
      <div
        key={i}
        className="w-1.5 bg-[#dfff00] origin-bottom"
        style={{
          height: active ? `${20 + Math.random() * 80}%` : "8%",
          transition: "height 120ms ease-out",
          animation: active ? `bbpulse${(i % 4) + 1} ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
        }}
      />
    ))}
  </div>
);

const TransportBtn = ({ onClick, active, children, label, testid }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    aria-label={label}
    className={`relative h-12 w-12 md:h-14 md:w-14 flex items-center justify-center border-2 ${
      active
        ? "bg-[#ff3300] border-[#ff3300] text-white"
        : "bg-[#1a1a1a] border-white/20 text-white hover:border-[#ff3300] hover:text-[#ff3300]"
    } transition-colors`}
  >
    {children}
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
  const audioRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API}/instrumentals`)
      .then((r) => setTracks(r.data))
      .catch(() => toast.error("Could not load instrumentals"));
  }, []);

  const current = tracks[idx];

  // Sync audio with current
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = current.audio_url;
    a.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) a.play().catch(() => {});
  }, [idx, current]);

  // 30s preview cap for paid
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
    const a = audioRef.current;
    if (!a || !current) return;
    a.play().then(() => setIsPlaying(true)).catch(() => toast.error("Audio failed to load"));
  };
  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };
  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };
  const next = () => setIdx((i) => (i + 1) % Math.max(tracks.length, 1));
  const prev = () => setIdx((i) => (i - 1 + tracks.length) % Math.max(tracks.length, 1));

  const handleSelect = (i) => {
    setIdx(i);
    setTimeout(play, 30);
  };

  const handleDownload = async (track) => {
    if (!track.is_free) return;
    setIsRecording(true);
    setRecordingSlug(track.slug);
    toast(`Recording "${track.title}" to Deck B...`);
    try {
      const { data } = await axios.post(`${API}/instrumentals/${track.slug}/download`);
      // Visualise transfer for ~4 seconds before triggering download
      await new Promise((res) => setTimeout(res, 4000));
      const a = document.createElement("a");
      a.href = data.audio_url;
      a.download = `${track.slug}.mp3`;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`"${track.title}" recorded — check your downloads`);
    } catch (e) {
      toast.error("Download failed. Try again.");
    } finally {
      setIsRecording(false);
      setRecordingSlug(null);
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <section
      id="boombox"
      data-testid="boombox-section"
      className="relative bg-[#0a0a0a] border-y border-white/10 px-4 md:px-8 lg:px-12 py-16 md:py-24 overflow-hidden"
    >
      <style>{`
        @keyframes bbpulse1 { 0%{height:20%} 100%{height:90%} }
        @keyframes bbpulse2 { 0%{height:35%} 100%{height:70%} }
        @keyframes bbpulse3 { 0%{height:50%} 100%{height:95%} }
        @keyframes bbpulse4 { 0%{height:15%} 100%{height:60%} }
      `}</style>

      <div className="absolute -top-32 left-1/4 w-[40vw] h-[40vw] rounded-full bg-[#dfff00] opacity-[0.06] blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 w-[40vw] h-[40vw] rounded-full bg-[#ff3300] opacity-[0.06] blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ The Boombox</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-2">
              Press Play.
            </h2>
            <p className="text-white/60 text-sm mt-3 max-w-xl">
              Preview beats for sale, or jack a free starter pack straight from Deck B.
              30-second previews on paid joints. Free downloads are real, untagged MP3s.
            </p>
          </div>
        </div>

        {/* BOOMBOX BODY */}
        <div
          data-testid="boombox-body"
          className="relative bg-gradient-to-b from-[#1c1c1c] to-[#0d0d0d] border-2 border-white/15 p-4 md:p-8"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 80px -20px rgba(0,0,0,0.8)" }}
        >
          {/* Top handle + logo plate */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-1.5 w-24 md:w-40 bg-white/15" />
            <div className="font-heading text-2xl md:text-4xl tracking-[0.1em] uppercase">
              BEATS<span className="text-[#ff3300]">·</span>BY<span className="text-[#ff3300]">·</span>DEZ
            </div>
            <div className="h-1.5 w-24 md:w-40 bg-white/15" />
          </div>

          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center">
            {/* LEFT SPEAKER */}
            <Speaker pulse={isPlaying} />

            {/* CONTROL DECK */}
            <div className="w-full lg:w-[440px] flex flex-col gap-4">
              {/* LCD */}
              <div className="bg-[#020202] border border-[#dfff00]/30 p-4 font-mono text-[#dfff00]">
                <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase opacity-70 mb-2">
                  <span data-testid="lcd-mood">{current?.mood || "— — —"}</span>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-[#dfff00] animate-pulse" : "bg-[#dfff00]/30"}`} />
                    {isPlaying ? "PLAY" : "STOP"}
                  </span>
                </div>
                <div
                  data-testid="lcd-title"
                  className="font-heading text-xl md:text-2xl tracking-tight uppercase leading-tight truncate"
                >
                  {current?.title || "INSERT TAPE"}
                </div>
                <div className="flex items-center justify-between text-[10px] tracking-[0.2em] mt-2 opacity-80">
                  <span>BPM {current?.bpm || "—"} · {current?.key || "—"}</span>
                  <span data-testid="lcd-time">
                    {fmt(currentTime)} / {fmt(current?.is_free ? duration : Math.min(duration, current?.preview_seconds || 30))}
                  </span>
                </div>
                <div className="h-1 bg-[#dfff00]/20 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#dfff00] transition-all"
                    style={{ width: `${progressPct}%` }}
                    data-testid="lcd-progress"
                  />
                </div>
                <EQBars active={isPlaying} />
              </div>

              {/* DUAL TAPE DECKS */}
              <div className="grid grid-cols-2 gap-3">
                <Deck label="DECK A · PLAY" active={isPlaying} color="#ff3300" testid="deck-a">
                  <Reel spinning={isPlaying} color="#ff3300" />
                  <Reel spinning={isPlaying} color="#ff3300" />
                </Deck>
                <Deck
                  label={isRecording ? "DECK B · REC ●" : "DECK B · IDLE"}
                  active={isRecording}
                  color="#dfff00"
                  testid="deck-b"
                  recording={isRecording}
                >
                  <Reel spinning={isRecording} color="#dfff00" />
                  <Reel spinning={isRecording} color="#dfff00" />
                </Deck>
              </div>

              {/* TRANSPORT BUTTONS */}
              <div className="flex items-center justify-between gap-2">
                <TransportBtn onClick={prev} label="Previous" testid="bbox-prev">
                  <SkipBack className="w-5 h-5" />
                </TransportBtn>
                {isPlaying ? (
                  <TransportBtn onClick={pause} label="Pause" active testid="bbox-pause">
                    <Pause className="w-5 h-5" />
                  </TransportBtn>
                ) : (
                  <TransportBtn onClick={play} label="Play" testid="bbox-play">
                    <Play className="w-5 h-5" />
                  </TransportBtn>
                )}
                <TransportBtn onClick={stop} label="Stop" testid="bbox-stop">
                  <Square className="w-5 h-5" />
                </TransportBtn>
                <TransportBtn onClick={next} label="Next" testid="bbox-next">
                  <SkipForward className="w-5 h-5" />
                </TransportBtn>
                <TransportBtn
                  onClick={() => current?.is_free && handleDownload(current)}
                  label="Record / Download"
                  active={isRecording}
                  testid="bbox-rec"
                >
                  <Circle className={`w-5 h-5 ${isRecording ? "fill-white" : "fill-[#ff3300] text-[#ff3300]"}`} />
                </TransportBtn>
              </div>
            </div>

            {/* RIGHT SPEAKER */}
            <Speaker pulse={isPlaying} />
          </div>
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

const Speaker = ({ pulse }) => (
  <div className="relative w-full max-w-[280px] mx-auto aspect-square">
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#202020] to-[#080808] border-2 border-white/10" />
    <div
      className={`absolute inset-6 rounded-full bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 ${
        pulse ? "animate-[spin_8s_linear_infinite]" : ""
      }`}
    />
    <div className="absolute inset-12 rounded-full bg-[#0a0a0a] border border-white/10" />
    <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-[#ff3300] to-[#7a1500] border border-black/40 shadow-[0_0_30px_rgba(255,51,0,0.35)]" />
    {/* speaker grille dots */}
    <div className="absolute inset-0 pointer-events-none">
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/15"
          style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-110px)` }}
        />
      ))}
    </div>
  </div>
);

const Deck = ({ children, label, active, color, testid, recording }) => (
  <div
    data-testid={testid}
    className={`bg-[#080808] border ${active ? "border-[var(--col)]" : "border-white/10"} p-3 transition-colors`}
    style={{ "--col": color }}
  >
    <div className="flex items-center justify-between mb-3 text-[9px] tracking-[0.2em] uppercase font-bold">
      <span className={active ? "text-[var(--col)]" : "text-white/40"} style={{ color: active ? color : undefined }}>
        {label}
      </span>
      {recording && (
        <span className="text-[#ff3300] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff3300] animate-pulse" /> REC
        </span>
      )}
    </div>
    <div className="flex justify-between items-center gap-3">{children}</div>
    {/* Tape window strip */}
    <div className="h-1 bg-white/5 mt-3 overflow-hidden">
      <div
        className="h-full transition-all"
        style={{
          width: active ? "100%" : "20%",
          backgroundColor: color,
          opacity: active ? 0.7 : 0.2,
        }}
      />
    </div>
  </div>
);

const TrackRow = ({ track, active, isPlaying, recording, onSelect, onDownload }) => (
  <div
    data-testid={`track-row-${track.slug}`}
    className={`flex items-center gap-3 p-3 border ${
      active ? "border-[#ff3300] bg-[#ff3300]/5" : "border-white/10 bg-[#0a0a0a]"
    } transition-colors`}
  >
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Play ${track.title}`}
      data-testid={`track-play-${track.slug}`}
      className="w-12 h-12 flex items-center justify-center border border-white/20 hover:border-[#ff3300] hover:text-[#ff3300] transition-colors"
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
    {track.is_free ? (
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
