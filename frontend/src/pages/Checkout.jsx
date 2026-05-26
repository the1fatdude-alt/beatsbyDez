import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../lib/api";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    shipping_address: "",
    city: "",
    zip_code: "",
    country: "United States",
  });

  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your bag is empty.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          size: it.size,
        })),
      };
      const order = await createOrder(payload);
      clearCart();
      navigate(`/order/${order.order_number}`);
    } catch (err) {
      toast.error("Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div data-testid="checkout-empty" className="px-4 md:px-8 lg:px-12 py-20 text-center">
        <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter">Empty Bag</h1>
        <p className="text-white/60 mt-4">Add something fresh first.</p>
        <button
          onClick={() => navigate("/shop")}
          className="mt-8 bg-white text-black px-6 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
        >
          Browse Store
        </button>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter mb-10">
        Checkout
      </h1>

      <form onSubmit={submit} className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3 space-y-6 border border-white/10 p-6 md:p-10">
          <div>
            <h2 className="font-heading text-2xl uppercase mb-4 tracking-tight">Contact</h2>
            <Input testid="checkout-name" label="Full Name" value={form.customer_name} onChange={update("customer_name")} required />
            <Input testid="checkout-email" label="Email" type="email" value={form.customer_email} onChange={update("customer_email")} required />
          </div>

          <div>
            <h2 className="font-heading text-2xl uppercase mb-4 tracking-tight">Shipping</h2>
            <Input testid="checkout-address" label="Address" value={form.shipping_address} onChange={update("shipping_address")} required />
            <div className="grid grid-cols-2 gap-4">
              <Input testid="checkout-city" label="City" value={form.city} onChange={update("city")} required />
              <Input testid="checkout-zip" label="ZIP / Postal" value={form.zip_code} onChange={update("zip_code")} required />
            </div>
            <Input testid="checkout-country" label="Country" value={form.country} onChange={update("country")} required />
          </div>

          <div>
            <h2 className="font-heading text-2xl uppercase mb-4 tracking-tight">Payment</h2>
            <div className="border border-white/10 p-4 bg-[#0a0a0a] text-sm text-white/60">
              <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#dfff00] mb-2">▸ Demo Mode</p>
              This is a demo storefront. No real payment will be processed. Order will be confirmed instantly.
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="border border-white/10 p-6 sticky top-24">
            <h2 className="font-heading text-2xl uppercase mb-6 tracking-tight">Order Summary</h2>
            <ul className="space-y-3 mb-6 max-h-72 overflow-y-auto">
              {items.map((it) => (
                <li key={`${it.product_id}__${it.size || ""}`} className="flex gap-3 text-sm">
                  <img src={it.image} alt={it.title} className="w-14 h-14 object-cover" />
                  <div className="flex-1">
                    <p className="font-heading uppercase tracking-tight leading-none">{it.title}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {it.quantity} × ${it.price.toFixed(2)}
                      {it.size && ` · ${it.size}`}
                    </p>
                  </div>
                  <p className="text-sm">${(it.price * it.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Subtotal</span>
                <span data-testid="summary-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Shipping</span>
                <span data-testid="summary-shipping">{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                <span className="text-xs tracking-[0.2em] uppercase font-bold">Total</span>
                <span data-testid="summary-total" className="font-heading text-3xl">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              data-testid="place-order-button"
              className="btn-brutal mt-6 w-full bg-[#ff3300] text-white py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const Input = ({ label, testid, ...props }) => (
  <label className="block mb-4">
    <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-white/60 block mb-2">
      {label}
    </span>
    <input
      data-testid={testid}
      {...props}
      className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm focus:border-[#ff3300] outline-none"
    />
  </label>
);
