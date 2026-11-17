import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const { wishlistIds } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="pb-6 border-b border-[#EAE4DC]">
        <p className="text-xs font-medium uppercase tracking-widest text-[#B85D6E]">
          Saved Trousseau
        </p>
        <h1 className="font-display text-4xl font-medium text-[#1C1917] mt-1">
          Your Wishlist ({wishlistedProducts.length})
        </h1>
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="aspect-[3/4] bg-[#FAF8F5] animate-pulse" />
          ))}
        </div>
      ) : wishlistedProducts.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="w-10 h-10 text-[#C6BEB4] mx-auto mb-4" />
          <h2 className="font-display text-3xl text-[#1C1917]">No Saved Pieces Yet</h2>
          <p className="text-sm text-[#6B6560] mt-2">
            Tap the heart icon on any saree or ensemble to bookmark it for later.
          </p>
          <Link
            to="/shop"
            className="inline-block mt-6 px-7 py-3 bg-[#1C1917] text-white text-sm font-medium"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
