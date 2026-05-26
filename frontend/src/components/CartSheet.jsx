import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CartSheet = () => {
  const { items, open, setOpen, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  const goCheckout = () => {
    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        data-testid="cart-sheet"
        className="bg-[#0a0a0a] border-l border-white/10 text-white p-0 w-full sm:max-w-md rounded-none flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="font-heading text-3xl uppercase tracking-tight text-white">
            Your Bag
          </SheetTitle>
          <SheetDescription className="sr-only">
            Items currently in your shopping bag. Adjust quantities or proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div
              data-testid="cart-empty-state"
              className="h-full flex flex-col items-center justify-center text-center pt-20"
            >
              <p className="font-heading text-4xl uppercase text-white/30">EMPTY</p>
              <p className="text-sm text-white/50 mt-2">Time to shop the latest drop.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li
                  key={`${it.product_id}__${it.size || ""}`}
                  data-testid={`cart-item-${it.slug}`}
                  className="flex gap-4 border-b border-white/10 pb-4"
                >
                  <img src={it.image} alt={it.title} className="w-20 h-20 object-cover" />
                  <div className="flex-1">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-bold">{it.artist}</p>
                    <p className="font-heading uppercase tracking-tight text-lg leading-none mt-1">{it.title}</p>
                    {it.size && <p className="text-xs text-white/60 mt-1">Size: {it.size}</p>}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-white/20">
                        <button
                          onClick={() => updateQuantity(it.product_id, it.size, it.quantity - 1)}
                          data-testid={`cart-decrease-${it.slug}`}
                          className="p-1.5 hover:bg-white/10"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm" data-testid={`cart-qty-${it.slug}`}>{it.quantity}</span>
                        <button
                          onClick={() => updateQuantity(it.product_id, it.size, it.quantity + 1)}
                          data-testid={`cart-increase-${it.slug}`}
                          className="p-1.5 hover:bg-white/10"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-lg">${(it.price * it.quantity).toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(it.product_id, it.size)}
                          data-testid={`cart-remove-${it.slug}`}
                          className="text-white/50 hover:text-[#ff3300]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-white/10 px-6 py-5 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs tracking-[0.2em] uppercase font-bold text-white/60">Subtotal</span>
              <span data-testid="cart-subtotal" className="font-heading text-3xl">${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-white/40">Free shipping on orders over $100. Taxes calculated at checkout.</p>
            <button
              onClick={goCheckout}
              data-testid="cart-checkout-button"
              className="btn-brutal w-full bg-white text-black py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
