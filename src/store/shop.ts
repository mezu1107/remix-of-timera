import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/products";

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (product: Product, opts?: { color?: string; size?: string; quantity?: number }) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (product, opts) =>
        set((state) => {
          const key = `${product.id}-${opts?.color ?? ""}-${opts?.size ?? ""}`;
          const existing = state.items.find((i) => i.id === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === key ? { ...i, quantity: i.quantity + (opts?.quantity ?? 1) } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [
              ...state.items,
              { id: key, product, quantity: opts?.quantity ?? 1, color: opts?.color, size: opts?.size },
            ],
            isOpen: true,
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: "timera-cart" },
  ),
);

type WishlistState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "timera-wishlist" },
  ),
);
