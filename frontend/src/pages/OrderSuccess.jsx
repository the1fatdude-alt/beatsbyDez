import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Check } from "lucide-react";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${orderNumber}`)
      .then((res) => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <div className="p-12 text-white/60">Loading...</div>;
  if (!order)
    return (
      <div className="p-12">
        <p className="text-white/60">Order not found.</p>
        <Link to="/" className="text-[#ff3300] underline mt-3 inline-block">Home</Link>
      </div>
    );

  return (
    <div data-testid="order-success-page" className="px-4 md:px-8 lg:px-12 py-12 max-w-3xl mx-auto">
      <div className="border border-white/10 p-8 md:p-12">
        <div className="w-14 h-14 bg-[#dfff00] text-black flex items-center justify-center mb-6">
          <Check className="w-6 h-6" />
        </div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#ff3300] font-bold">Order Confirmed</p>
        <h1 className="font-heading text-5xl md:text-7xl uppercase tracking-tighter leading-none mt-3">
          You're In.
        </h1>
        <p className="text-white/70 mt-4">
          Thanks {order.customer_name}. We've sent a confirmation to{" "}
          <span className="text-white">{order.customer_email}</span>.
        </p>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/60">Order Number</p>
          <p data-testid="order-number" className="font-heading text-3xl mt-1">{order.order_number}</p>
        </div>

        <div className="mt-8">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/60 mb-4">Items</p>
          <ul className="space-y-3">
            {order.items.map((it, i) => (
              <li key={i} className="flex gap-4 border-b border-white/10 pb-3">
                <img src={it.image} alt={it.title} className="w-16 h-16 object-cover" />
                <div className="flex-1">
                  <p className="font-heading uppercase tracking-tight">{it.title}</p>
                  <p className="text-xs text-white/50 mt-1">{it.quantity} × ${it.price.toFixed(2)}{it.size && ` · ${it.size}`}</p>
                </div>
                <p className="text-sm">${it.line_total.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>{order.shipping === 0 ? "FREE" : `$${order.shipping.toFixed(2)}`}</span></div>
          <div className="flex justify-between pt-3 border-t border-white/10 items-baseline">
            <span className="text-xs tracking-[0.2em] uppercase font-bold">Total Paid</span>
            <span className="font-heading text-3xl">${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-10">
          <Link
            to="/shop"
            data-testid="continue-shopping-link"
            className="btn-brutal inline-block bg-white text-black px-7 py-3 text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#ff3300] hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
