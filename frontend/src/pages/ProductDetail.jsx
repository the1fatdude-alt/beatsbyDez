import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct } from "../lib/api";
import { useCart } from "../context/CartContext";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { HypeBar } from "../components/HypeBar";

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    fetchProduct(slug)
      .then((p) => {
        setProduct(p);
        if (p.sizes?.length) setSize(p.sizes[0]);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const onAdd = () => {
    if (product.sizes?.length && !size) {
      toast.error("Pick a size first.");
      return;
    }
    addItem(product, { size, quantity: qty });
    toast.success("Added to your bag.");
  };

  if (loading) return <div className="px-4 md:px-8 lg:px-12 py-20 text-white/60">Loading...</div>;
  if (!product)
    return (
      <div className="px-4 md:px-8 lg:px-12 py-20">
        <p className="text-white/60">Product not found.</p>
        <Link to="/shop" className="mt-4 inline-block text-[#ff3300] underline">Back to shop</Link>
      </div>
    );

  return (
    <div data-testid="product-detail-page" className="px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <Link
        to="/shop"
        data-testid="product-back-link"
        className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold text-white/60 hover:text-[#ff3300] mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="grid lg:grid-cols-2 gap-0 border border-white/10">
        <div className="relative aspect-square overflow-hidden bg-black border-b lg:border-b-0 lg:border-r border-white/10">
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
          {product.is_limited && (
            <span className="absolute top-4 left-4 bg-[#ff3300] text-white text-xs tracking-[0.2em] uppercase font-bold px-3 py-1">
              Limited
            </span>
          )}
        </div>

        <div className="p-6 md:p-10 lg:p-14">
          <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">{product.artist}</p>
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-tighter leading-none mt-3">
            {product.title}
          </h1>
          <p className="font-heading text-4xl mt-6" data-testid="product-detail-price">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-white/70 leading-relaxed mt-8">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-[0.2em] uppercase font-bold mb-3">Size</p>
              <div className="flex flex-wrap gap-0 border border-white/10 w-fit">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    data-testid={`size-option-${s}`}
                    onClick={() => setSize(s)}
                    className={`px-5 py-3 text-xs uppercase tracking-[0.2em] font-bold border-r border-white/10 last:border-r-0 transition-colors ${
                      size === s ? "bg-white text-black" : "hover:bg-white/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-white/20">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                data-testid="qty-decrease"
                className="p-3 hover:bg-white/5"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-5 text-sm" data-testid="qty-display">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                data-testid="qty-increase"
                className="p-3 hover:bg-white/5"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={onAdd}
              data-testid="add-to-cart-button"
              className="btn-brutal flex-1 bg-white text-black py-4 px-6 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
            >
              Add to Bag
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-white/50 space-y-2">
            <p>▸ Free shipping on orders over $100</p>
            <p>▸ Authentic merch direct from Sony Music</p>
            <p>▸ 30-day return policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
