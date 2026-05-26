import { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

const compute = (endsAt) => {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    ended: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export const Countdown = ({ endsAt, compact = false, testid }) => {
  const [t, setT] = useState(() => compute(endsAt));

  useEffect(() => {
    if (!endsAt) return;
    const i = setInterval(() => setT(compute(endsAt)), 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  if (!endsAt) return null;
  if (t.ended) {
    return (
      <span data-testid={testid} className="text-xs tracking-[0.2em] uppercase font-bold text-white/40">
        Drop Ended
      </span>
    );
  }

  if (compact) {
    return (
      <span
        data-testid={testid}
        className="font-heading text-sm tracking-[0.1em] text-[#dfff00]"
      >
        {t.days}d {pad(t.hours)}:{pad(t.minutes)}:{pad(t.seconds)}
      </span>
    );
  }

  const Unit = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <span className="font-heading text-3xl md:text-5xl leading-none text-[#dfff00] tabular-nums">
        {pad(value)}
      </span>
      <span className="text-[9px] tracking-[0.25em] uppercase font-bold text-white/50 mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div data-testid={testid} className="flex items-center gap-4 md:gap-6">
      <Unit value={t.days} label="Days" />
      <span className="font-heading text-3xl text-white/20">:</span>
      <Unit value={t.hours} label="Hours" />
      <span className="font-heading text-3xl text-white/20">:</span>
      <Unit value={t.minutes} label="Min" />
      <span className="font-heading text-3xl text-white/20">:</span>
      <Unit value={t.seconds} label="Sec" />
    </div>
  );
};
