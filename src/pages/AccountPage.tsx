import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Package, Search } from 'lucide-react';
import type { Order } from '../types';
import { useStore } from '../context/StoreContext';
import { formatDate, formatINR } from '../utils/format';

export function AccountPage() {
  const { user, refreshAuth, refreshCartAndWishlist, logout, notify } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Guest order tracking lookup
  const [lookupOrderNumber, setLookupOrderNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    fetch('/api/orders/my')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login' ? { email, password } : { name, email, phone, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Authentication failed.', 'error');
        return;
      }
      await refreshAuth();
      await refreshCartAndWishlist();
      notify(mode === 'login' ? 'Welcome back!' : 'Account created successfully.', 'success');
    } catch {
      notify('Unable to sign in right now.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);
    if (!lookupOrderNumber.trim()) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(lookupOrderNumber.trim())}`);
      if (!res.ok) {
        setLookupError('No order found with that Order ID.');
        return;
      }
      const data = await res.json();
      setLookupResult(data.order);
    } catch {
      setLookupError('Unable to check order status right now.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          {user ? (
            <div className="space-y-8">
              <div className="pb-6 border-b border-[#EAE4DC] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9A7B4F] font-medium">
                    Client Account
                  </p>
                  <h1 className="font-display text-4xl font-medium text-[#1C1917] mt-1">
                    {user.name}
                  </h1>
                  <p className="text-sm text-[#6B6560] mt-1">{user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium whitespace-nowrap"
                    >
                      Open Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#D8CFC2] text-xs font-medium text-[#1C1917] hover:border-[#1C1917]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-medium text-[#1C1917] mb-4">
                  Your Orders
                </h2>
                {loadingOrders ? (
                  <p className="text-sm text-[#6B6560]">Loading order history...</p>
                ) : orders.length === 0 ? (
                  <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-8 text-center">
                    <Package className="w-8 h-8 text-[#C6BEB4] mx-auto mb-3" />
                    <p className="text-sm text-[#5C554F]">
                      You have not placed any orders under this account yet.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block mt-4 px-5 py-2.5 bg-[#1C1917] text-white text-xs font-medium"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-[#EAE4DC] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1C1917] tabular-nums">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-[#6B6560] mt-1">
                            {formatDate(order.createdAt)} · {order.items.length} item(s) ·{' '}
                            {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                          </p>
                        </div>
                        <div className="flex items-center gap-5">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#1C1917] tabular-nums">
                              {formatINR(order.totalAmount)}
                            </p>
                            <p className="text-xs font-medium text-[#9A7B4F]">{order.status}</p>
                          </div>
                          <Link
                            to={`/order-confirmation/${order.orderNumber}`}
                            className="px-4 py-2 border border-[#D8CFC2] text-xs font-medium hover:border-[#1C1917]"
                          >
                            View Receipt
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-6 sm:p-10">
              <div className="flex gap-6 border-b border-[#E5DEC9] pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                    mode === 'login'
                      ? 'border-[#1C1917] text-[#1C1917]'
                      : 'border-transparent text-[#7D766F]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                    mode === 'register'
                      ? 'border-[#1C1917] text-[#1C1917]'
                      : 'border-transparent text-[#7D766F]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-[#4A443F] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A443F] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A443F] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] disabled:opacity-50"
                >
                  {submitting
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Order Status Lookup */}
        <aside className="lg:col-span-5">
          <div className="border border-[#EAE4DC] p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#9A7B4F] font-medium">
                Track Order
              </p>
              <h2 className="font-display text-2xl font-medium text-[#1C1917] mt-1">
                Check Order Status
              </h2>
              <p className="text-xs text-[#6B6560] mt-1">
                Enter your unique Order ID (e.g. ZL-2026-1001) to view real-time status.
              </p>
            </div>

            <form onSubmit={handleOrderLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8279] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={lookupOrderNumber}
                  onChange={(e) => setLookupOrderNumber(e.target.value)}
                  placeholder="ZL-2026-1001"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#D8CFC2] text-sm tabular-nums focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1C1917] text-white text-xs font-medium whitespace-nowrap"
              >
                Track
              </button>
            </form>

            {lookupError && <p className="text-xs text-[#B85D6E]">{lookupError}</p>}

            {lookupResult && (
              <div className="bg-[#FAF8F5] border border-[#E5DEC9] p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1C1917] tabular-nums">
                    {lookupResult.orderNumber}
                  </span>
                  <span className="font-semibold text-[#9A7B4F]">{lookupResult.status}</span>
                </div>
                <p className="text-xs text-[#6B6560]">
                  {lookupResult.customerName} · {formatINR(lookupResult.totalAmount)}
                </p>
                <Link
                  to={`/order-confirmation/${lookupResult.orderNumber}`}
                  className="inline-block text-xs font-medium text-[#1C1917] underline pt-1"
                >
                  Open Full Receipt
                </Link>
              </div>
            )}

            <div className="pt-4 border-t border-[#F0EBE4] text-xs text-[#6B6560] flex items-center justify-between">
              <span>Store Administrator?</span>
              <Link to="/admin/login" className="text-[#9A7B4F] font-medium hover:underline">
                Go to Admin Portal
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
