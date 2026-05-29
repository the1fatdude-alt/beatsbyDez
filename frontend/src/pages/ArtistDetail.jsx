import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchArtist, fetchProducts } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const DEZ_PORTRAIT =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/5btnld6i_Snapchat-1994296522.jpg";
const DEZ_STUDIO =
  "https://customer-assets.emergentagent.com/job_music-commerce-hub/artifacts/m0zgehx2_7bc86a47-de2b-4392-b5a0-e74e5d409500.jpg";

export default function ArtistDetail() {
  const params = useParams();
  const slug = params.slug || "dez";
  const [artist, setArtist] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchArtist(slug)
      .then((a) => {
        setArtist(a);
        return fetchProducts({ artist: a.name });
      })
      .then(setProducts)
      .catch(() => setArtist(null))
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

  return (
    <div data-testid="artist-detail-page">
      <section className="relative min-h-[80vh] overflow-hidden bg-[#0a0a0a] border-b border-white/10">
        <div className="absolute -top-24 -right-24 w-[60vw] h-[60vw] rounded-full bg-[#dfff00] opacity-[0.07] blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[50vw] h-[50vw] rounded-full bg-[#ff3300] opacity-[0.08] blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-0 items-center px-4 md:px-8 lg:px-12 py-16">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#dfff00] font-bold">/ The Producer</p>
            <h1 className="font-heading text-7xl md:text-9xl uppercase tracking-tighter leading-[0.85] mt-3">
              {artist.name}<span className="text-[#ff3300]">.</span>
            </h1>
            <p className="text-white/80 max-w-xl mt-6 text-base md:text-lg leading-relaxed">{artist.bio}</p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/shop"
                className="btn-brutal inline-flex items-center gap-3 bg-[#dfff00] text-black px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
              >
                Shop The Catalog
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-[560px] aspect-square rounded-[40px] overflow-hidden border border-white/10">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover drop-shadow-[0_0_80px_rgba(223,255,0,0.2)]"
              />
            </div>
          </div>
        </div>
      </section>

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
