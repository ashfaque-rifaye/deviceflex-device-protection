// Buy-flow cart. Small on purpose: the flow only ever holds one line, but the
// protection tier and accessories chosen in "Get add-ons" have to survive the
// hop to the cart — that hand-off is the whole point of the attach story.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { TIERS, type Tier } from "@/data/deviceflex";

const KEY = "att_cart_v1";

export type CartAccessory = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image?: string;
};

export type CartState = {
  /** The device line the flow is built around. */
  device: {
    name: string;
    brand: string;
    color: string;
    storage: string;
    monthly: number;
    image: string;
  };
  plan: { name: string; monthly: number };
  protection: Tier["id"] | null;
  /** Set when the member explicitly declined protection in the modal. */
  protectionDeclined: boolean;
  accessories: CartAccessory[];
};

const INITIAL: CartState = {
  device: {
    name: "iPhone 17 Pro Max",
    brand: "Apple",
    color: "Cosmic Orange",
    storage: "256GB",
    monthly: 33.34,
    image: "/att/devices/apple-iphone-17-pro-max/cosmic-orange-hero.webp",
  },
  plan: { name: "AT&T Extra 2.0", monthly: 70 },
  protection: null,
  protectionDeclined: false,
  accessories: [],
};

type CartCtx = {
  cart: CartState;
  protectionTier: Tier | undefined;
  setProtection: (id: Tier["id"] | null) => void;
  declineProtection: () => void;
  addAccessory: (a: CartAccessory) => void;
  removeAccessory: (id: string) => void;
  /** Item count for the header badge. */
  count: number;
  monthlyTotal: number;
  reset: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within <CartProvider>");
  return c;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(INITIAL);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CartState>;
        setCart({ ...INITIAL, ...parsed, device: INITIAL.device, plan: INITIAL.plan });
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const protectionTier = TIERS.find((t) => t.id === cart.protection);

  const setProtection = (id: Tier["id"] | null) =>
    setCart((c) => ({ ...c, protection: id, protectionDeclined: false }));

  const declineProtection = () =>
    setCart((c) => ({ ...c, protection: null, protectionDeclined: true }));

  const addAccessory = (a: CartAccessory) =>
    setCart((c) =>
      c.accessories.some((x) => x.id === a.id) ? c : { ...c, accessories: [...c.accessories, a] },
    );

  const removeAccessory = (id: string) =>
    setCart((c) => ({ ...c, accessories: c.accessories.filter((a) => a.id !== id) }));

  const reset = () => setCart(INITIAL);

  const monthlyTotal =
    cart.device.monthly + cart.plan.monthly + (protectionTier?.price ?? 0) + 3.99;

  const count = 1 + (cart.protection ? 1 : 0) + cart.accessories.length;

  return (
    <Ctx.Provider
      value={{
        cart,
        protectionTier,
        setProtection,
        declineProtection,
        addAccessory,
        removeAccessory,
        count,
        monthlyTotal,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
