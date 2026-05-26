import { Countdown } from "./Countdown";

export const HypeBar = ({ product, variant = "default" }) => {
  if (!product?.total_supply) return null;

  const sold = product.sold_count || 0;
  const total = product.total_supply;
  const pct = Math.min(100, Math.round((sold / total) * 100));
  const remaining = Math.max(0, total - sold);
  const lowStock = remaining <= total * 0.15;

  if (variant === "card") {
    return (
      <div
        data-testid={`hype-bar-card-${product.slug}`}
        className="px-4 pb-4 -mt-2"
      >
        <div className="flex items-center justify-between mb-1.5 text-[10px] tracking-[0.15em] uppercase font-bold">
          <span className={lowStock ? "text-[#ff3300]" : "text-white/60"}>
            {sold.toLocaleString()} / {total.toLocaleString()} sold
          </span>
          {product.drop_ends_at && (
            <Countdown endsAt={product.drop_ends_at} compact testid={`countdown-card-${product.slug}`} />
          )}
        </div>
        <div className="h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${lowStock ? "bg-[#ff3300]" : "bg-[#dfff00]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`hype-bar-detail-${product.slug}`}
      className="border border-white/10 bg-[#0a0a0a] p-5 md:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#ff3300] mb-1">
            ▸ Limited Drop
          </p>
          <p className="font-heading text-2xl md:text-3xl uppercase tracking-tight leading-none">
            {sold.toLocaleString()} <span className="text-white/40">of {total.toLocaleString()} sold</span>
          </p>
          {lowStock && (
            <p className="text-xs tracking-[0.2em] uppercase font-bold text-[#ff3300] mt-2 animate-pulse">
              Only {remaining} left — moving fast
            </p>
          )}
        </div>

        {product.drop_ends_at && (
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/50 mb-2">
              Ends in
            </p>
            <Countdown endsAt={product.drop_ends_at} testid={`countdown-detail-${product.slug}`} />
          </div>
        )}
      </div>

      <div className="h-1.5 bg-white/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${lowStock ? "bg-[#ff3300]" : "bg-[#dfff00]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] tracking-[0.2em] uppercase font-bold text-white/40">
        <span>{pct}% claimed</span>
        <span>Numbered & signed</span>
      </div>
    </div>
  );
};
