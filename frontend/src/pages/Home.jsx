import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { fetchProducts } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { Marquee } from "../components/Marquee";
import { Countdown } from "../components/Countdown";
import { Boombox } from "../components/Boombox";

const DEZ_LOGO =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/c32fw61l_Gemini_Generated_Image_-EDIT.jpg";
const DEZ_STUDIO =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/m0zgehx2_7bc86a47-de2b-4392-b5a0-e74e5d409500.jpg";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => {});
  }, []);

  const newDrops = products.filter((p) => p.is_new_drop).slice(0, 4);
  const limited = products.filter((p) => p.is_limited).slice(0, 3);
  const lungPunch = products.find((p) => p.slug === "lung-punch-vinyl");

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
            <div className="relative aspect-square max-w-[640px] mx-auto rounded-[40px] overflow-hidden border border-white/10">
              <img
                src={DEZ_LOGO}
                alt="BeatsByDez graffiti"
                data-testid="hero-dez-artwork"
                className="w-full h-full object-cover drop-shadow-[0_0_60px_rgba(223,255,0,0.25)]"
              />
            </div>
          </div>
        </div>
      </section>

      <Marquee
        items={["BEATSBYDEZ", "NEW DROPS", "LIMITED EDITION", "WORLDWIDE SHIPPING"]}
      />

      {/* THE BOOMBOX */}
      <Boombox />

      {/* LUNG PUNCH — featured drop with countdown */}
      {lungPunch && (
        <section className="relative bg-black border-b border-white/10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[40vw] h-[40vw] rounded-full bg-[#ff3300] opacity-[0.10] blur-3xl" />
          <div className="grid lg:grid-cols-2 items-center gap-0 relative">
            <div className="relative aspect-square lg:aspect-auto lg:h-[640px] bg-[#0a0a0a] flex items-center justify-center p-10 border-r border-white/10">
              <img
                src={lungPunch.image}
                alt={lungPunch.title}
                className="w-full max-w-[520px] object-contain drop-shadow-[0_0_60px_rgba(255,51,0,0.25)]"
              />
            </div>
            <div className="p-8 md:p-16 flex flex-col justify-center">
              <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">
                ▸ THE NEW PROJECT
              </p>
              <h2 className="font-heading text-6xl md:text-8xl uppercase tracking-tighter leading-[0.85] mt-3">
                LUNG<br /><span className="text-[#dfff00]">PUNCH.</span>
              </h2>
              <p className="text-white/70 text-base mt-6 max-w-md">
                Twelve tracks of pure smoke and bass. Red-and-black splatter vinyl, numbered
                jacket, signed by Dez. Once they're gone, they're gone.
              </p>

              <div className="mt-8 border border-white/10 bg-[#0a0a0a] p-5">
                <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/50 mb-3">
                  Drop closes in
                </p>
                <Countdown endsAt={lungPunch.drop_ends_at} testid="home-lungpunch-countdown" />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to={`/product/${lungPunch.slug}`}
                  data-testid="home-lungpunch-shop-button"
                  className="btn-brutal inline-flex items-center justify-center gap-3 bg-[#ff3300] text-white px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black"
                >
                  Cop The Vinyl <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="inline-flex items-center justify-center px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold text-white/60 border border-white/10">
                  {lungPunch.sold_count}/{lungPunch.total_supply} sold
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <div className="grid lg:grid-cols-2 items-stretch">
          <div className="relative aspect-[4/3] lg:aspect-auto bg-black flex items-center justify-center p-10">
            <div className="w-full max-w-[480px] aspect-square rounded-[32px] overflow-hidden border border-white/10">
              <img
                src={DEZ_LOGO}
                alt="BeatsByDez"
                className="w-full h-full object-cover"
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
        items={["DEZ", "BEATSBYDEZ", "LUNG PUNCH", "BEATS BY DEZ"]}
        accent
      />

      {/* FROM THE STUDIO */}
      <section className="bg-[#0a0a0a] border-y border-white/10">
        <div className="grid lg:grid-cols-2 items-stretch">
          <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
            <img
              src={DEZ_STUDIO}
              alt="Dez's studio"
              data-testid="home-studio-photo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
          </div>
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ FROM THE STUDIO</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-3">
              WHERE THE<br /><span className="text-white/40">WORK HAPPENS.</span>
            </h2>
            <p className="text-white/70 text-base mt-6 max-w-md">
              Two KRK monitors. A worn-in MIDI controller. One flickering light. This is the
              room every drop on this site was born in. No labels, no committees — just Dez
              and the wall.
            </p>
            <Link
              to="/artists/dez"
              data-testid="home-meet-dez-link"
              className="btn-brutal mt-8 inline-flex items-center gap-3 w-fit border border-white/30 px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300]"
            >
              Meet The Producer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
