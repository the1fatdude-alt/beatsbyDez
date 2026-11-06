import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { fetchProducts } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { Marquee } from "../components/Marquee";
import { Countdown } from "../components/Countdown";
import { Boombox } from "../components/Boombox";
import { WelcomeSection } from "../components/WelcomeSection";

const DEZ_LOGO = "/dez-logo.png";
const MARQUEE_TOP = ["BEATSBYDEZ", "NEW DROPS", "LIMITED EDITION", "WORLDWIDE SHIPPING"];

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {});
  }, []);

  const newDrops = products.filter((p) => p.is_new_drop).slice(0, 4);
  const limited = products.filter((p) => p.is_limited).slice(0, 3);

  return (
    <div data-testid="home-page">
      {/* HERO — Producer Dez featured */}
      <section className="relative min-h-[92vh] w-full overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0">
          {/* Background spray-glow */}
          <div className="absolute -top-32 -right-32 w-[60vw] h-[60vw] rounded-full bg-[#dfff00] opacity-[0.07] blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-[50vw] h-[50vw] rounded-full bg-[#ff3300] opacity-[0.08] blur-3xl" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-0 min-h-[92vh] items-center px-4 md:px-8 lg:px-12 py-16">
          <div className="order-2 lg:order-1">
            <p
              className="text-[11px] md:text-xs tracking-[0.4em] uppercase font-bold text-[#dfff00] mb-4 fade-up"
              data-testid="hero-eyebrow"
            >
              ▸ NEW DROP / BEATSBYDEZ
            </p>
            <h1
              className="font-heading text-7xl sm:text-8xl md:text-[9rem] uppercase tracking-tighter leading-[0.82] fade-up"
              data-testid="hero-headline"
            >
              BEATS<br />
              BY<br />
              <span className="text-[#ff3300]">DEZ.</span>
            </h1>
            <p className="text-white/70 max-w-lg text-base md:text-lg mt-6 fade-up">
              Producer. Architect. The dust-cracked vinyl loops and skull-rattling 808s the
              whole game is biting next. One artist. One store. Every drop signed in spray paint.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 fade-up">
              <Link
                to="/shop"
                data-testid="hero-shop-drop-button"
                className="btn-brutal inline-flex items-center justify-center gap-3 bg-[#dfff00] text-black px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
              >
                Shop the Drop <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/artists/dez"
                data-testid="hero-meet-dez-button"
                className="btn-brutal inline-flex items-center justify-center gap-3 border border-white/30 text-white px-8 py-4 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300]"
              >
                Meet The Producer
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 text-xs tracking-[0.2em] uppercase font-bold text-white/40 fade-up">
              <div><span className="block text-2xl font-heading text-white">02</span>VOLUMES</div>
              <div><span className="block text-2xl font-heading text-white">2,500</span>WORLDWIDE</div>
              <div><span className="block text-2xl font-heading text-white">∞</span>HEAT</div>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative w-full max-w-[640px] mx-auto aspect-[16/10]">
              <img
                src={DEZ_LOGO}
                alt="BeatsByDez graffiti"
                data-testid="hero-dez-artwork"
                className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(223,255,0,0.45)]"
              />
            </div>
          </div>
        </div>
      </section>

      <Marquee items={MARQUEE_TOP} />

      <WelcomeSection />

      {/* THE BOOMBOX */}
      <Boombox />

      {/* NEW DROPS */}
      <section className="px-4 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ 01</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-2">
              New Drops
            </h2>
          </div>
          <Link
            to="/shop"
            data-testid="view-all-products-link"
            className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold hover:text-[#ff3300]"
          >
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-white/10">
          {newDrops.map((p) => (
            <div key={p.id} className="border-r border-b border-white/10 -m-px">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* DEZ EDITORIAL BAND */}
      <section className="relative bg-[#0a0a0a] border-y border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="relative aspect-[4/3] lg:aspect-auto bg-black flex items-center justify-center p-10 min-w-0">
            <div className="w-full max-w-[520px] aspect-[16/10]">
              <img
                src={DEZ_LOGO}
                alt="BeatsByDez"
                className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(223,255,0,0.35)]"
              />
            </div>
          </div>
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ THE PRODUCER</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-3">
              ONE NAME.<br /><span className="text-white/40">ONE WALL.</span>
            </h2>
            <p className="text-white/70 text-base mt-6 max-w-md">
              Dez doesn't chase the wave — he builds it. From the basement to the boardroom, every
              beat is signed in spray paint. This isn't a label playing producer. This is the
              producer running the label.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/shop"
                data-testid="featured-shop-button"
                className="btn-brutal inline-flex items-center gap-3 bg-[#ff3300] text-white px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black"
              >
                Shop Everything <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/artists/dez"
                className="btn-brutal inline-flex items-center gap-3 border border-white/30 px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300]"
              >
                Producer Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LIMITED EDITION */}
      <section className="px-4 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ 02</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-2">
              Limited Edition
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-t border-white/10">
          {limited.map((p) => (
            <div key={p.id} className="border-r border-b border-white/10 -m-px">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      <Marquee
        items={["DEZ", "BEATSBYDEZ", "FREE BEATS", "BEATS BY DEZ"]}
        accent
      />

    </div>
  );
}
