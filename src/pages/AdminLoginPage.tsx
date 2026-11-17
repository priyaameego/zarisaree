import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function AdminLoginPage() {
  const { user, refreshAuth, notify } = useStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, adminOnly: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid administrator credentials.');
        return;
      }
      await refreshAuth();
      notify('Signed in to Atelier Admin.', 'success');
      navigate('/admin', { replace: true });
    } catch {
      setError('Unable to reach authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#FAF8F5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white border border-[#EAE4DC] p-8 sm:p-10">
        <div className="flex items-center gap-2.5 text-[#9A7B4F] mb-3">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Atelier Management
          </span>
        </div>
        <h1 className="font-display text-3xl font-medium text-[#1C1917]">
          Administrator Sign In
        </h1>
        <p className="text-sm text-[#6B6560] mt-1.5">
          Sign in with your store administrator email and password to manage catalog inventory and
          customer orders.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 p-3 bg-[#FFF5F5] border border-[#E8B4B8] text-xs text-[#8B1E24]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zariandloom.com"
              className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter administrator password"
              className="w-full border border-[#D8CFC2] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#F0EBE4] text-center">
          <Link to="/" className="text-xs text-[#6B6560] hover:text-[#1C1917]">
            Return to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
