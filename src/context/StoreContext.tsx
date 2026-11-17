import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItem, Category, PaymentGatewayConfig, Product, UserSession } from '../types';

interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error' | 'info';
}

interface StoreContextValue {
  user: UserSession | null;
  authLoading: boolean;
  categories: Category[];
  cart: CartItem[];
  wishlistIds: string[];
  paymentConfig: PaymentGatewayConfig;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  shippingFee: number;
  cartTotal: number;
  refreshAuth: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshCartAndWishlist: () => Promise<void>;
  addToCart: (product: Product, variantId: string, size: string, quantity?: number) => Promise<boolean>;
  updateCartQuantity: (productId: string, variantId: string, size: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, variantId: string, size: string) => Promise<void>;
  clearLocalCart: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  logout: () => Promise<void>;
  notify: (text: string, tone?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const DEFAULT_PAYMENT_CONFIG: PaymentGatewayConfig = {
  provider: 'builtin',
  onlineEnabled: true,
  mode: 'configurable_test',
  freeShippingThreshold: 4999,
  standardShippingFee: 250,
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(DEFAULT_PAYMENT_CONFIG);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, tone: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // handled gracefully
    }
  }, []);

  const refreshCartAndWishlist = useCallback(async () => {
    try {
      const [cartRes, wishRes] = await Promise.all([fetch('/api/cart'), fetch('/api/wishlist')]);
      if (cartRes.ok) {
        const c = await cartRes.json();
        setCart(c.items || []);
      }
      if (wishRes.ok) {
        const w = await wishRes.json();
        setWishlistIds(w.productIds || []);
      }
    } catch {
      // ignore transient network failure
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    refreshCategories();
    refreshCartAndWishlist();
    fetch('/api/payment-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPaymentConfig(data);
      })
      .catch(() => {});
  }, [refreshAuth, refreshCategories, refreshCartAndWishlist]);

  const persistCart = useCallback(async (nextItems: CartItem[]) => {
    setCart(nextItems);
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextItems }),
      });
    } catch {
      // ignore
    }
  }, []);

  const addToCart = useCallback(
    async (product: Product, variantId: string, size: string, quantity = 1): Promise<boolean> => {
      const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
      if (!variant || variant.stock <= 0) {
        notify('This shade is currently out of stock.', 'error');
        return false;
      }

      const existingIdx = cart.findIndex(
        (item) => item.productId === product.id && item.variantId === variant.id && item.size === size
      );

      let nextCart: CartItem[];
      if (existingIdx !== -1) {
        const current = cart[existingIdx];
        const desiredQty = current.quantity + quantity;
        if (desiredQty > variant.stock) {
          notify(`Only ${variant.stock} available in ${variant.name}.`, 'error');
          return false;
        }
        nextCart = cart.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: desiredQty, maxStock: variant.stock }
            : item
        );
      } else {
        const clampedQty = Math.min(quantity, variant.stock);
        const newItem: CartItem = {
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          categoryName: product.categoryName,
          variantId: variant.id,
          colorName: variant.name,
          colorHex: variant.hex,
          size,
          imageUrl: variant.images[0] || '',
          price: product.price,
          salePrice: product.salePrice,
          quantity: clampedQty,
          maxStock: variant.stock,
        };
        nextCart = [...cart, newItem];
      }

      await persistCart(nextCart);
      notify(`Added ${product.name} (${variant.name}) to bag.`, 'success');
      return true;
    },
    [cart, notify, persistCart]
  );

  const updateCartQuantity = useCallback(
    async (productId: string, variantId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        const next = cart.filter(
          (i) => !(i.productId === productId && i.variantId === variantId && i.size === size)
        );
        await persistCart(next);
        return;
      }
      const next = cart.map((item) => {
        if (item.productId === productId && item.variantId === variantId && item.size === size) {
          const clamped = Math.min(quantity, item.maxStock);
          if (quantity > item.maxStock) {
            notify(`Maximum available stock is ${item.maxStock}.`, 'info');
          }
          return { ...item, quantity: clamped };
        }
        return item;
      });
      await persistCart(next);
    },
    [cart, notify, persistCart]
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId: string, size: string) => {
      const next = cart.filter(
        (i) => !(i.productId === productId && i.variantId === variantId && i.size === size)
      );
      await persistCart(next);
    },
    [cart, persistCart]
  );

  const clearLocalCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      try {
        const res = await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          const data = await res.json();
          setWishlistIds(data.productIds || []);
          notify(data.wishlisted ? 'Saved to your wishlist.' : 'Removed from wishlist.', 'info');
        }
      } catch {
        notify('Unable to update wishlist right now.', 'error');
      }
    },
    [notify]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    await refreshCartAndWishlist();
    notify('Signed out successfully.', 'info');
  }, [notify, refreshCartAndWishlist]);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const netMerchandise = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const cartDiscount = Math.max(0, cartSubtotal - netMerchandise);
  const shippingFee =
    netMerchandise === 0 || netMerchandise >= paymentConfig.freeShippingThreshold
      ? 0
      : paymentConfig.standardShippingFee;
  const cartTotal = netMerchandise + shippingFee;

  return (
    <StoreContext.Provider
      value={{
        user,
        authLoading,
        categories,
        cart,
        wishlistIds,
        paymentConfig,
        cartDrawerOpen,
        setCartDrawerOpen,
        cartCount,
        cartSubtotal,
        cartDiscount,
        shippingFee,
        cartTotal,
        refreshAuth,
        refreshCategories,
        refreshCartAndWishlist,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearLocalCart,
        toggleWishlist,
        isWishlisted,
        logout,
        notify,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 text-sm font-medium shadow-lg border transition-all duration-200 ${
                t.tone === 'error'
                  ? 'bg-[#FFF5F5] border-[#E8B4B8] text-[#8B1E24]'
                  : t.tone === 'success'
                    ? 'bg-[#1C1917] border-[#1C1917] text-white'
                    : 'bg-[#FAF8F5] border-[#E5DEC9] text-[#1C1917]'
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
