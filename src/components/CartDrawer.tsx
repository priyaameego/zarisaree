import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/format';
import { SafeImage } from './SafeImage';

export function CartDrawer() {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    cartSubtotal,
    cartDiscount,
    shippingFee,
    cartTotal,
    paymentConfig,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const navigate = useNavigate();

  if (!cartDrawerOpen) return null;

  const netMerchandise = cartSubtotal - cartDiscount;
  const remainingForFreeShipping = Math.max(0, paymentConfig.freeShippingThreshold - netMerchandise);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/45 transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        aria-label="Shopping Bag"
        className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#1C1917]" />
            <h2 className="font-display text-2xl font-semibold text-[#1C1917]">Shopping Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close shopping bag"
            className="p-2 text-[#6B6560] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#EAE4DC] text-xs text-[#4A443F]">
            {remainingForFreeShipping > 0 ? (
              <p>
                Add <span className="font-semibold text-[#1C1917] tabular-nums">{formatINR(remainingForFreeShipping)}</span>{' '}
                more for complimentary shipping.
              </p>
            ) : (
              <p className="text-[#1C1917] font-medium">
                Your order qualifies for complimentary insured shipping.
              </p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#F0EBE4]">
          {cart.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-[#C6BEB4] mx-auto mb-4" />
              <p className="font-display text-2xl text-[#1C1917] mb-2">Your bag is empty</p>
              <p className="text-sm text-[#6B6560] mb-6">
                Discover handwoven Banarasi, Kanjivaram, and designer organza pieces.
              </p>
              <Link
                to="/shop"
                onClick={() => setCartDrawerOpen(false)}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors"
              >
                Explore Collections
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}-${item.size}`}
                className="py-4 flex gap-4"
              >
                <Link
                  to={`/product/${item.productSlug}?color=${item.variantId}`}
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-20 h-26 bg-[#FAF8F5] shrink-0 overflow-hidden"
                >
                  <SafeImage
                    src={item.imageUrl}
                    alt={`${item.productName} in ${item.colorName}`}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${item.productSlug}?color=${item.variantId}`}
                      onClick={() => setCartDrawerOpen(false)}
                      className="text-sm font-semibold text-[#1C1917] hover:underline line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId, item.size)}
                      aria-label={`Remove ${item.productName}`}
                      className="p-1 text-[#8A8279] hover:text-[#B85D6E] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#6B6560] mt-1">
                    {item.colorName} <span aria-hidden="true">·</span> {item.size}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#E2DBD1]">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.variantId,
                            item.size,
                            item.quantity - 1
                          )
                        }
                        aria-label="Decrease quantity"
                        className="w-8 h-8 flex items-center justify-center text-[#1C1917] hover:bg-[#FAF8F5]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(
                            item.productId,
                            item.variantId,
                            item.size,
                            item.quantity + 1
                          )
                        }
                        aria-label="Increase quantity"
                        className="w-8 h-8 flex items-center justify-center text-[#1C1917] hover:bg-[#FAF8F5]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="text-sm font-semibold text-[#1C1917]">
                        {formatINR(item.salePrice * item.quantity)}
                      </span>
                      {item.price > item.salePrice && (
                        <span className="block text-xs text-[#8A8279] line-through">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-[#EAE4DC] px-6 py-5 bg-[#FAF8F5] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#6B6560]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#B85D6E]">
                  <span>Savings</span>
                  <span className="tabular-nums">−{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B6560]">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#1C1917] pt-2 border-t border-[#E5DEC9]">
                <span>Estimated Total</span>
                <span className="tabular-nums">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/cart');
                }}
                className="px-4 py-3 border border-[#1C1917] text-[#1C1917] text-sm font-medium hover:bg-white transition-colors whitespace-nowrap"
              >
                View Bag
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="px-4 py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors whitespace-nowrap"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
