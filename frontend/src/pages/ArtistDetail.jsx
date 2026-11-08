import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchArtist, fetchProducts } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const DEZ_PORTRAIT =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/5btnld6i_Snapchat-1994296522.jpg";
const DEZ_STUDIO =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/m0zgehx2_7bc86a47-de2b-4392-b5a0-e74e5d409500.jpg";

const CREDITS = [
  { era: "1994 — present", name: "Lifelong craft" },
  { era: "Origins", name: "Elevation Nation" },
  { era: "Florida Treasure Coast", name: "US-1 Label" },
  { era: "Present", name: "E-Productions × Mo Budmans Studios" },
];

export default function ArtistDetail() {
export default function ArtistDetail() {
  const bioText = `For Dez, music isn’t just a career path or a creative outlet—it is a lifelong obsession. Since 1994, they have dedicated their life entirely to the craft, driven by a simple, unyielding truth: this is the only thing I know. From the complex chords of a jazz and gospel piano to the sharp delivery of an elite emcee, Dez has spent over three decades evolving into a complete, full-circle musical force capable of holding their own on any level.

  That journey took shape early on with Elevation Nation, laying the foundational groundwork for a lifetime of sharp execution. Moving his creative energy down to Florida’s Treasure Coast, he brought vital production and artistic support to the US-1 label, sharpening a signature sonic blueprint. Today, that relentless drive continues in the lab, currently working with E-Productions at Mo Budmans Studios.

  These eras and alliances have forged a style that seamlessly blends the soulful, sophisticated harmonies of gospel and jazz with the raw, gritty aesthetic of classic 80s and 90s hip-hop. Whether commanding a room from the keys, laying down a formidable verse, or manipulating hardware behind the boards, every element of their work carries a distinct, authentic weight.

  This multi-dimensional artistry naturally demanded a larger canvas, leading to the creation of Beats by Dez—an independent music and clothing brand where sound and street culture collide. As the chief producer, lyricist, and visual designer, Dez translates over thirty years of musical history into bold, graffiti-inspired apparel and striking visual art, proving that true independent legacy is built, not given.`;

  return (
    <div className="artist-detail">
      <p>{bioText}</p>
    </div>
  );
}
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-white/60">Loading...</div>;
  if (!artist)
    return (
      <div className="p-12">
        <p>Producer not found.</p>
        <Link to="/" className="text-[#ff3300] underline">Back home</Link>
      </div>
    );

  const paragraphs = (artist.bio || "").split(/\n\n+/).filter(Boolean);
  const pullQuote = "Since 1994 — this is the only thing I know.";

  return (
    <div data-testid="artist-detail-page">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/10">
        <div className="absolute -top-24 -right-24 w-[60vw] h-[60vw] rounded-full bg-[#dfff00] opacity-[0.07] blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[50vw] h-[50vw] rounded-full bg-[#ff3300] opacity-[0.08] blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-0 items-center px-4 md:px-8 lg:px-12 py-16 md:py-24">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ The Producer</p>
            <h1 className="font-heading text-7xl md:text-9xl uppercase tracking-tighter leading-[0.85] mt-3">
              {artist.name}<span className="text-[#ff3300]">.</span>
            </h1>
            <p className="font-heading text-xl md:text-2xl uppercase tracking-tight text-white/70 mt-6 max-w-md">
              {pullQuote}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/shop"
                data-testid="artist-shop-cta"
                className="btn-brutal inline-flex items-center gap-3 bg-[#dfff00] text-black px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
              >
                Shop The Catalog
              </Link>
              <a
                href="#bio"
                className="btn-brutal inline-flex items-center gap-3 border border-white/30 px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:border-[#ff3300] hover:text-[#ff3300]"
              >
                Read The Story
              </a>
            </div>
          </div>
          <div className="relative flex items-center justify-center mt-10 lg:mt-0">
            <div className="w-full max-w-[640px] aspect-[16/10]">
              <img
                src="/dez-logo.png"
                alt={artist.name}
                className="w-full h-full object-contain drop-shadow-[0_0_60px_rgba(223,255,0,0.4)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BIOGRAPHY */}
      <section
        id="bio"
        data-testid="artist-bio-section"
        className="px-4 md:px-8 lg:px-12 py-16 md:py-24 border-b border-white/10"
      >
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 max-w-6xl mx-auto">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ Biography</p>
            <h2 className="font-heading text-5xl md:text-7xl uppercase tracking-tight leading-none mt-3">
              Three<br />Decades<br /><span className="text-white/40">Deep.</span>
            </h2>
            <div className="mt-8 space-y-3 border-l-2 border-[#dfff00]/40 pl-4">
              {CREDITS.map((c) => (
                <div key={c.name} data-testid={`credit-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <p className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#dfff00]">{c.era}</p>
                  <p className="font-heading text-lg uppercase tracking-tight">{c.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {paragraphs.map((p, i) => (
              <p
                key={`${i}-${p.slice(0, 24)}`}
                data-testid={`bio-paragraph-${i}`}
                className={
                  i === 0
                    ? "text-lg md:text-xl text-white leading-relaxed first-letter:text-6xl md:first-letter:text-8xl first-letter:font-heading first-letter:uppercase first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-[#ff3300]"
                    : "text-base md:text-lg text-white/75 leading-relaxed"
                }
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* THE MAN / THE LAB */}
      <section className="px-4 md:px-8 lg:px-12 py-16 border-b border-white/10">
        <div className="grid lg:grid-cols-2 gap-0 border-l border-t border-white/10">
          <div className="relative aspect-[4/5] lg:aspect-square border-r border-b border-white/10 -m-px overflow-hidden">
            <img
              src={DEZ_PORTRAIT}
              alt="Dez portrait"
              data-testid="artist-portrait"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-black/60 px-2 py-1">
              / The Man
            </div>
          </div>
          <div className="relative aspect-[4/5] lg:aspect-square border-r border-b border-white/10 -m-px overflow-hidden">
            <img
              src={DEZ_STUDIO}
              alt="Dez's studio"
              data-testid="artist-studio"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-black/60 px-2 py-1">
              / The Lab
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section className="px-4 md:px-8 lg:px-12 py-16">
        <h2 className="font-heading text-4xl md:text-6xl uppercase tracking-tight mb-8">The Catalog</h2>
        {products.length === 0 ? (
          <p className="text-white/60 text-sm">No products yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-l border-t border-white/10">
            {products.map((p) => (
              <div key={p.id} className="border-r border-b border-white/10 -m-px">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
