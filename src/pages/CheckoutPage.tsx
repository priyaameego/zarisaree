import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Lock, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/format';
import { SafeImage } from '../components/SafeImage';

export function CheckoutPage() {
  const {
    user,
    cart,
    cartSubtotal,
    cartDiscount,
    shippingFee,
    cartTotal,
    paymentConfig,
    clearLocalCart,
    notify,
  } = useStore();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');

  // Online payment modal / step for configurable gateway
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [cardLast4, setCardLast4] = useState('4242');
  const [upiOrCardHolder, setUpiOrCardHolder] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-[#1C1917]">No Items to Checkout</h1>
        <p className="text-sm text-[#6B6560] mt-3">
          Add a saree or ethnic ensemble to your shopping bag before checking out.
        </p>
        <Link
          to="/shop"
          className="inline-block mt-6 px-7 py-3 bg-[#1C1917] text-white text-sm font-medium"
        >
          Browse Store
        </Link>
      </div>
    );
  }

  const placeOrder = async (paymentRef = '') => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          city,
          state: stateName,
          postalCode,
          notes,
          paymentMethod,
          paymentReference: paymentRef,
          items: cart.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            size: i.size,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Unable to complete order.';
        setErrorMessage(msg);
        notify(msg, 'error');
        return;
      }

      clearLocalCart();
      setGatewayModalOpen(false);
      notify(`Order ${data.order.orderNumber} confirmed!`, 'success');
      navigate(`/order-confirmation/${data.order.orderNumber}`);
    } catch {
      setErrorMessage('Network error while placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !customerName.trim() ||
      customerPhone.trim().length < 7 ||
      !customerEmail.includes('@') ||
      !shippingAddress.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !postalCode.trim()
    ) {
      setErrorMessage('Please fill in all required contact and delivery address fields.');
      return;
    }

    if (paymentMethod === 'online') {
      setUpiOrCardHolder(customerName);
      setGatewayModalOpen(true);
      return;
    }

    await placeOrder('CASH_ON_DELIVERY');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="pb-6 border-b border-[#EAE4DC] flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#9A7B4F]">
            Secure Checkout
          </p>
          <h1 className="font-display text-4xl font-medium text-[#1C1917] mt-1">
            Delivery &amp; Payment
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B6560]">
          <Lock className="w-4 h-4 text-[#9A7B4F]" />
          <span>Verified Inventory Reservation</span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 bg-[#FFF5F5] border border-[#E8B4B8] text-sm text-[#8B1E24]"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          {/* Customer Contact */}
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-medium text-[#1C1917]">
              1. Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Recipient full name"
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98201 00000"
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
            </div>
          </section>

          {/* Delivery Address */}
          <section className="pt-6 border-t border-[#EAE4DC] space-y-4">
            <h2 className="font-display text-2xl font-medium text-[#1C1917]">
              2. Delivery Address
            </h2>
            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                Street Address, Apartment / Suite *
              </label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="House no., street name, landmark"
                className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">State *</label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  PIN / Postal Code *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#1C1917]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                Delivery or Tailoring Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any preferred delivery window or gift note..."
                className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="pt-6 border-t border-[#EAE4DC] space-y-4">
            <h2 className="font-display text-2xl font-medium text-[#1C1917]">
              3. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-5 text-left border transition-colors ${
                  paymentMethod === 'cod'
                    ? 'border-[#1C1917] bg-[#FAF8F5]'
                    : 'border-[#D8CFC2] hover:border-[#1C1917]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Truck className="w-5 h-5 text-[#9A7B4F]" />
                  {paymentMethod === 'cod' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1C1917]" />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1C1917] mt-3">Cash on Delivery (COD)</p>
                <p className="text-xs text-[#6B6560] mt-1">
                  Pay {formatINR(cartTotal)} by cash or UPI upon delivery.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`p-5 text-left border transition-colors ${
                  paymentMethod === 'online'
                    ? 'border-[#1C1917] bg-[#FAF8F5]'
                    : 'border-[#D8CFC2] hover:border-[#1C1917]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-5 h-5 text-[#9A7B4F]" />
                  {paymentMethod === 'online' && (
                    <CheckCircle2 className="w-4 h-4 text-[#1C1917]" />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1C1917] mt-3">
                  Online Payment Gateway
                </p>
                <p className="text-xs text-[#6B6560] mt-1">
                  UPI, Credit/Debit Card, or NetBanking (
                  {paymentConfig.mode === 'live'
                    ? `${paymentConfig.provider} live`
                    : 'Configurable test gateway'}
                  ).
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-5">
          <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-6 sm:p-7 space-y-5 sticky top-24">
            <h2 className="font-display text-2xl font-medium text-[#1C1917]">
              Bag Summary ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            <div className="divide-y divide-[#EAE4DC] max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}-${item.size}`}
                  className="py-3 flex gap-3.5"
                >
                  <div className="w-16 h-20 bg-white shrink-0 overflow-hidden">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C1917] truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-[#6B6560] mt-0.5">
                      {item.colorName} · Qty {item.quantity}
                    </p>
                    <p className="text-xs font-semibold text-[#1C1917] mt-1.5 tabular-nums">
                      {formatINR(item.salePrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E5DEC9] space-y-2 text-sm">
              <div className="flex justify-between text-[#5C554F]">
                <span>Subtotal (MRP)</span>
                <span className="tabular-nums">{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#B85D6E]">
                  <span>Discount Savings</span>
                  <span className="tabular-nums">−{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5C554F]">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {shippingFee === 0 ? 'Complimentary' : formatINR(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-[#1C1917] pt-3 border-t border-[#E5DEC9]">
                <span>Total Payable</span>
                <span className="tabular-nums">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Placing Order...'
                : paymentMethod === 'cod'
                  ? `Place COD Order (${formatINR(cartTotal)})`
                  : `Continue to Payment (${formatINR(cartTotal)})`}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-[#7D766F]">
              <ShieldCheck className="w-4 h-4 text-[#9A7B4F]" />
              <span>Stock is verified atomically before confirming your order.</span>
            </p>
          </div>
        </aside>
      </form>

      {/* Configurable Online Payment Gateway Authorization Modal */}
      {gatewayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE4DC] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#9A7B4F] font-medium">
                  Zari &amp; Loom Payment Gateway
                </p>
                <h3 className="font-display text-2xl font-medium text-[#1C1917] mt-0.5">
                  Authorize {formatINR(cartTotal)}
                </h3>
              </div>
              <Lock className="w-5 h-5 text-[#9A7B4F]" />
            </div>

            <p className="text-xs text-[#6B6560] bg-[#FAF8F5] p-3 border border-[#EAE4DC]">
              {paymentConfig.mode === 'live'
                ? `Connected to ${paymentConfig.provider}. Confirm authorization to finalize your order.`
                : 'Gateway test mode active. Configure PAYMENT_GATEWAY_PROVIDER and keys in server environment for live Razorpay or Stripe charges.'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1">
                  Cardholder / Account Name
                </label>
                <input
                  type="text"
                  value={upiOrCardHolder}
                  onChange={(e) => setUpiOrCardHolder(e.target.value)}
                  className="w-full border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1">
                  Test Card Last 4 Digits / UPI Reference
                </label>
                <input
                  type="text"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  className="w-full border border-[#D8CFC2] px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-[#1C1917]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setGatewayModalOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 border border-[#D8CFC2] text-sm font-medium text-[#1C1917]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  placeOrder(
                    `GW-${paymentConfig.provider.toUpperCase()}-${cardLast4 || '4242'}-${Date.now().toString().slice(-4)}`
                  )
                }
                className="flex-1 py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Authorize & Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
