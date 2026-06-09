import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "vinyl", label: "Vinyl" },
  { value: "cd", label: "CDs" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams, { replace: true });
  }, [category]);

  const filtered = useMemo(() => {
    if (category === "all") return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  return (
    <div data-testid="shop-page" className="px-4 md:px-8 lg:px-12 pt-12 pb-24">
      <div className="border-b border-white/10 pb-8 mb-10">
        <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">/ Store</p>
        <h1 className="font-heading text-6xl md:text-8xl uppercase tracking-tighter leading-none mt-3">
          Shop The Drop
        </h1>
        <p className="text-white/60 mt-4 max-w-xl">
          Vinyl, apparel, accessories. Straight from Dez's catalog. Every drop signed in spray paint.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-0 mb-10 border border-white/10">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            data-testid={`shop-filter-${c.value}`}
            onClick={() => setCategory(c.value)}
            className={`px-5 py-3 text-xs tracking-[0.2em] uppercase font-bold border-r border-white/10 last:border-r-0 transition-colors ${
              category === c.value
                ? "bg-[#ff3300] text-white"
                : "bg-transparent text-white hover:bg-white/5"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-white/60 text-sm">Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p data-testid="shop-empty" className="text-white/60 text-sm">
          No products found in this category.
        </p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-l border-t border-white/10">
          {filtered.map((p) => (
            <div key={p.id} className="border-r border-b border-white/10 -m-px">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
