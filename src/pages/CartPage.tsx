import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/format';
import { SafeImage } from '../components/SafeImage';

export function CartPage() {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    shippingFee,
    cartTotal,
    paymentConfig,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-12 h-12 text-[#C6BEB4] mx-auto mb-5" />
        <h1 className="font-display text-4xl font-medium text-[#1C1917]">Your Shopping Bag is Empty</h1>
        <p className="text-sm text-[#6B6560] mt-3 max-w-md mx-auto">
          Explore our handwoven Banarasi silks, Kanjivarams, and contemporary organza drapes.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors"
        >
          <span>Browse Collections</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <h1 className="font-display text-4xl font-medium text-[#1C1917] pb-6 border-b border-[#EAE4DC]">
        Shopping Bag
      </h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 divide-y divide-[#EAE4DC]">
          {cart.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}-${item.size}`}
              className="py-6 flex flex-col sm:flex-row gap-5"
            >
              <Link
                to={`/product/${item.productSlug}?color=${item.variantId}`}
                className="w-28 aspect-[3/4] bg-[#FAF8F5] shrink-0 overflow-hidden"
              >
                <SafeImage
                  src={item.imageUrl}
                  alt={`${item.productName} in ${item.colorName}`}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#7D766F]">{item.categoryName}</p>
                    <Link
                      to={`/product/${item.productSlug}?color=${item.variantId}`}
                      className="text-lg font-semibold text-[#1C1917] hover:text-[#9A7B4F]"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-[#5C554F] mt-1">
                      Shade: <span className="font-medium text-[#1C1917]">{item.colorName}</span>
                      <span aria-hidden="true"> · </span>
                      {item.size}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId, item.variantId, item.size)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#7D766F] hover:text-[#B85D6E] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center border border-[#D8CFC2]">
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
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF8F5]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium tabular-nums">
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
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF8F5]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right tabular-nums">
                    <span className="text-base font-semibold text-[#1C1917]">
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
          ))}
        </div>

        <aside className="lg:col-span-4">
          <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-6 space-y-4 sticky top-24">
            <h2 className="font-display text-2xl font-medium text-[#1C1917]">Order Summary</h2>
            <div className="space-y-2.5 text-sm pt-2 border-t border-[#E5DEC9]">
              <div className="flex justify-between text-[#5C554F]">
                <span>Subtotal (MRP)</span>
                <span className="tabular-nums">{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#B85D6E]">
                  <span>Atelier Savings</span>
                  <span className="tabular-nums">−{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5C554F]">
                <span>Insured Shipping</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-[#7D766F]">
                  Complimentary shipping applies automatically at {formatINR(paymentConfig.freeShippingThreshold)}.
                </p>
              )}
              <div className="flex justify-between text-base font-semibold text-[#1C1917] pt-3 border-t border-[#E5DEC9]">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors"
            >
              Proceed to Checkout
            </button>

            <Link
              to="/shop"
              className="block text-center text-xs font-medium text-[#5C554F] hover:text-[#1C1917] pt-1"
            >
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
