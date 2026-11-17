import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/format';
import { SafeImage } from './SafeImage';
import { Tilt3DCard } from './Tilt3DCard';

export function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist } = useStore();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const activeVariant = product.variants[selectedVariantIdx] || product.variants[0];
  const primaryImage = activeVariant?.images[0] || '';
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.totalStock === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col"
    >
      <Tilt3DCard maxTilt={6} className="relative aspect-[3/4] bg-[#FAF8F5] overflow-hidden">
        <Link
          to={`/product/${product.slug}${activeVariant ? `?color=${activeVariant.id}` : ''}`}
          className="block w-full h-full"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={primaryImage}
              initial={{ opacity: 0.65 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.65 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              <SafeImage
                src={primaryImage}
                alt={`${product.name} in ${activeVariant?.name || 'signature shade'}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            </motion.div>
          </AnimatePresence>
        </Link>

        {outOfStock ? (
          <span className="absolute top-3 left-3 bg-white/92 px-2.5 py-1 text-[11px] font-medium text-[#6B6560]">
            Sold Out
          </span>
        ) : product.discountPercent > 0 ? (
          <span className="absolute top-3 left-3 bg-white/92 px-2.5 py-1 text-[11px] font-medium text-[#B85D6E] tabular-nums">
            {product.discountPercent}% Off
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-2.5 right-2.5 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center text-[#1C1917] transition-colors z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? 'fill-[#B85D6E] text-[#B85D6E]' : 'text-[#1C1917]'
            }`}
          />
        </button>
      </Tilt3DCard>

      <div className="pt-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#7D766F]">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.fabric}</span>
          </div>

          <Link
            to={`/product/${product.slug}${activeVariant ? `?color=${activeVariant.id}` : ''}`}
            className="mt-1 block text-base font-semibold text-[#1C1917] hover:text-[#9A7B4F] transition-colors line-clamp-1"
          >
            {product.name}
          </Link>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[15px] font-semibold text-[#1C1917]">
              {formatINR(product.salePrice)}
            </span>
            {product.discountPercent > 0 && (
              <span className="text-xs text-[#8A8279] line-through">
                {formatINR(product.price)}
              </span>
            )}
          </div>

          {product.variants.length > 1 && (
            <div className="flex items-center gap-1.5" aria-label="Available colors">
              {product.variants.map((variant, idx) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  title={variant.name}
                  aria-label={`Select ${variant.name}`}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    idx === selectedVariantIdx
                      ? 'border-[#1C1917] scale-110 ring-1 ring-[#1C1917] ring-offset-1'
                      : 'border-[#D5CEC4] hover:scale-105'
                  }`}
                  style={{ backgroundColor: variant.hex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
