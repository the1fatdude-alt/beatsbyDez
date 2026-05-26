import { Link } from "react-router-dom";

export const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group block border border-white/10 hover:border-[#ff3300] transition-colors duration-300 bg-[#0a0a0a]"
    >
      <div className="relative aspect-square overflow-hidden bg-black">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.is_limited && (
          <span className="absolute top-3 left-3 bg-[#ff3300] text-white text-[10px] tracking-[0.2em] uppercase font-bold px-2 py-1">
            Limited
          </span>
        )}
        {product.is_new_drop && !product.is_limited && (
          <span className="absolute top-3 left-3 bg-[#dfff00] text-black text-[10px] tracking-[0.2em] uppercase font-bold px-2 py-1">
            New Drop
          </span>
        )}
      </div>
      <div className="p-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">
            {product.artist}
          </p>
          <h3 className="font-heading text-xl uppercase tracking-tight mt-1 leading-none group-hover:text-[#ff3300] transition-colors">
            {product.title}
          </h3>
        </div>
        <p className="font-heading text-xl tracking-tight" data-testid={`product-price-${product.slug}`}>
          ${product.price.toFixed(0)}
        </p>
      </div>
    </Link>
  );
};
