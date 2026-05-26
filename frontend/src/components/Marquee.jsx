export const Marquee = ({ items, accent = false }) => {
  const repeated = Array.from({ length: 2 }).flatMap(() => items);
  return (
    <div
      data-testid="marquee-ticker"
      className="overflow-hidden border-y border-white/10 bg-black py-6"
    >
      <div className="marquee-track">
        {repeated.map((t, i) => (
          <span
            key={i}
            className={`font-heading text-6xl md:text-8xl px-8 uppercase ${
              accent ? "text-stroke-accent" : "text-stroke"
            }`}
          >
            {t} <span className="text-[#ff3300]">●</span>
          </span>
        ))}
      </div>
    </div>
  );
};
