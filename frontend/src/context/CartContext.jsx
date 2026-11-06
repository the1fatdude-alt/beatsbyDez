import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "sm_hh_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, { size = null, quantity = 1 } = {}) => {
    setItems((prev) => {
      const key = `${product.id}__${size || ""}`;
      const existing = prev.find((it) => `${it.product_id}__${it.size || ""}` === key);
      if (existing && product.kind === "beat") return prev;
      if (existing) {
        return prev.map((it) =>
          `${it.product_id}__${it.size || ""}` === key
            ? { ...it, quantity: it.quantity + quantity }
            : it
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          title: product.title,
          artist: product.artist,
          price: product.price,
          image: product.image,
          kind: product.kind || "merch",
          size,
          quantity,
        },
      ];
    });
    setOpen(true);
  };

  const updateQuantity = (product_id, size, quantity) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.product_id === product_id && (it.size || "") === (size || "")
            ? { ...it, quantity: Math.max(0, quantity) }
            : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const removeItem = (product_id, size) => {
    setItems((prev) =>
      prev.filter(
        (it) => !(it.product_id === product_id && (it.size || "") === (size || ""))
      )
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * it.quantity, 0),
    [items]
  );
  const merchSubtotal = useMemo(
    () => items.filter((it) => it.kind !== "beat").reduce((s, it) => s + it.price * it.quantity, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart, subtotal, merchSubtotal, count, open, setOpen }),
    [items, subtotal, merchSubtotal, count, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
