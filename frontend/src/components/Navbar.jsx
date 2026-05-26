import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";

const navItems = [
  { to: "/shop", label: "Shop" },
  { to: "/shop?category=vinyl", label: "Vinyl" },
  { to: "/shop?category=apparel", label: "Apparel" },
  { to: "/artists/dez", label: "Producer" },
];

export const Navbar = () => {
  const { count, setOpen } = useCart();
  const [mobile, setMobile] = useState(false);

  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10"
    >
      <div className="px-4 md:px-8 lg:px-12 flex items-center justify-between h-16">
        <Link
          to="/"
          data-testid="navbar-logo"
          className="font-heading text-2xl md:text-3xl tracking-tight uppercase"
        >
          Sony Music<span className="text-[#ff3300]">.</span>
          <span className="text-white/40 text-xs ml-2 tracking-[0.3em]">HIPHOP</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((it) => (
            <NavLink
              key={it.label}
              to={it.to}
              data-testid={`nav-link-${it.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-xs tracking-[0.2em] uppercase font-semibold transition-colors ${
                  isActive ? "text-[#ff3300]" : "text-white hover:text-[#ff3300]"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            data-testid="navbar-cart-button"
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 border border-white/20 px-4 py-2 hover:border-[#ff3300] transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs tracking-[0.2em] uppercase font-bold">Bag</span>
            {count > 0 && (
              <span
                data-testid="cart-count-badge"
                className="absolute -top-2 -right-2 bg-[#ff3300] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center"
              >
                {count}
              </span>
            )}
          </button>
          <button
            data-testid="navbar-mobile-toggle"
            className="md:hidden p-2 border border-white/20"
            onClick={() => setMobile((m) => !m)}
          >
            {mobile ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="md:hidden border-t border-white/10 bg-black px-4 py-6 flex flex-col gap-4">
          {navItems.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              data-testid={`mobile-nav-link-${it.label.toLowerCase()}`}
              onClick={() => setMobile(false)}
              className="text-xs tracking-[0.2em] uppercase font-semibold"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
