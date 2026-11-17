import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Navbar() {
  const { user, cartCount, wishlistIds, setCartDrawerOpen, categories } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const transparentMode = isHome && !scrolled && !searchOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    setMobileOpen(false);
    if (q) {
      navigate(`/shop?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <header
      className={`${
        isHome ? 'fixed inset-x-0 top-0' : 'sticky top-0'
      } z-40 transition-all duration-300 ${
        transparentMode
          ? 'bg-gradient-to-b from-black/55 to-transparent text-white border-b border-white/15'
          : 'bg-white/95 backdrop-blur-md text-[#1C1917] border-b border-[#EAE4DC]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className={`lg:hidden inline-flex items-center justify-center w-10 h-10 -ml-2 transition-colors ${
              transparentMode
                ? 'text-white hover:bg-white/10'
                : 'text-[#1C1917] hover:bg-[#FAF8F5]'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            to="/"
            className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight whitespace-nowrap shrink-0"
          >
            Zari &amp; Loom
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className={`hidden lg:flex items-center gap-7 text-sm font-medium ${
            transparentMode ? 'text-white/90' : 'text-[#4A443F]'
          }`}
        >
          <Link
            to="/shop"
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent ${
              transparentMode
                ? 'hover:text-white hover:border-[#D4B87A]'
                : 'hover:text-[#1C1917] hover:border-[#9A7B4F]'
            }`}
          >
            Shop All
          </Link>
          <Link
            to="/shop?category=silk-sarees"
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent ${
              transparentMode
                ? 'hover:text-white hover:border-[#D4B87A]'
                : 'hover:text-[#1C1917] hover:border-[#9A7B4F]'
            }`}
          >
            Silk Sarees
          </Link>
          <Link
            to="/shop?category=designer-sarees"
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent ${
              transparentMode
                ? 'hover:text-white hover:border-[#D4B87A]'
                : 'hover:text-[#1C1917] hover:border-[#9A7B4F]'
            }`}
          >
            Designer Sarees
          </Link>
          <Link
            to="/shop?category=lehengas"
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent ${
              transparentMode
                ? 'hover:text-white hover:border-[#D4B87A]'
                : 'hover:text-[#1C1917] hover:border-[#9A7B4F]'
            }`}
          >
            Bridal
          </Link>
          <Link
            to="/shop?occasion=festive"
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent ${
              transparentMode
                ? 'hover:text-white hover:border-[#D4B87A]'
                : 'hover:text-[#1C1917] hover:border-[#9A7B4F]'
            }`}
          >
            Occasions
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search collections"
            className={`inline-flex items-center justify-center w-10 h-10 transition-colors ${
              transparentMode ? 'hover:bg-white/10' : 'hover:bg-[#FAF8F5]'
            }`}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <Link
            to={user?.role === 'admin' ? '/admin' : '/account'}
            aria-label={user ? 'My account' : 'Sign in'}
            className={`inline-flex items-center justify-center w-10 h-10 transition-colors ${
              transparentMode ? 'hover:bg-white/10' : 'hover:bg-[#FAF8F5]'
            }`}
          >
            <User className="w-[18px] h-[18px]" />
          </Link>

          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistIds.length} items)`}
            className={`relative inline-flex items-center justify-center w-10 h-10 transition-colors ${
              transparentMode ? 'hover:bg-white/10' : 'hover:bg-[#FAF8F5]'
            }`}
          >
            <Heart className="w-[18px] h-[18px]" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#B85D6E] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label={`Shopping bag (${cartCount} items)`}
            className={`relative inline-flex items-center justify-center w-10 h-10 transition-colors ${
              transparentMode ? 'hover:bg-white/10' : 'hover:bg-[#FAF8F5]'
            }`}
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            {cartCount > 0 && (
              <span
                className={`absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-semibold flex items-center justify-center tabular-nums ${
                  transparentMode ? 'bg-[#D4B87A] text-[#1C1917]' : 'bg-[#1C1917] text-white'
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#EAE4DC] bg-[#FAF8F5] text-[#1C1917] px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="w-4 h-4 text-[#6B6560] shrink-0" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Banarasi, Kanjivaram, Organza, crimson, bridal..."
              className="w-full bg-transparent text-sm text-[#1C1917] placeholder:text-[#8A8279] focus:outline-none py-1.5"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1C1917] text-white text-xs font-medium whitespace-nowrap shrink-0 hover:bg-[#332E2A] transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="p-2 text-[#6B6560] hover:text-[#1C1917]"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex text-[#1C1917]">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto flex flex-col justify-between p-6 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#EAE4DC]">
                <span className="font-display text-2xl font-semibold text-[#1C1917]">
                  Zari &amp; Loom
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-[#1C1917]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-1">
                <p className="text-xs font-medium text-[#8A8279] mb-2">Collections</p>
                <Link
                  to="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-base font-medium text-[#1C1917] border-b border-[#F3EFEA]"
                >
                  Shop All Pieces
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shop?category=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-base text-[#4A443F] hover:text-[#1C1917] border-b border-[#F3EFEA]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 space-y-1">
                <p className="text-xs font-medium text-[#8A8279] mb-2">Occasions</p>
                {['Wedding', 'Festive', 'Party Wear', 'Everyday Wear'].map((occ) => (
                  <Link
                    key={occ}
                    to={`/shop?occasion=${encodeURIComponent(occ.toLowerCase())}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-[#4A443F] hover:text-[#1C1917]"
                  >
                    {occ}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#EAE4DC] space-y-3 text-sm">
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block font-medium text-[#1C1917]"
              >
                {user ? `Account (${user.name})` : 'Customer Sign In'}
              </Link>
              <Link
                to="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="block text-[#4A443F]"
              >
                Wishlist ({wishlistIds.length})
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block text-[#9A7B4F] font-medium"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
