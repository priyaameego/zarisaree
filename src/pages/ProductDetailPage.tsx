import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Heart, Minus, Plus, ShieldCheck, Star, Truck, ZoomIn, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import { formatDate, formatINR } from '../utils/format';
import { SafeImage } from '../components/SafeImage';
import { ProductCard } from '../components/ProductCard';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, setCartDrawerOpen, isWishlisted, toggleWishlist, notify } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [hoverZoom, setHoverZoom] = useState(false);

  // Review form
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        const prod = data.product as Product;
        setProduct(prod);
        setRelated(data.related || []);
        const colorParam = searchParams.get('color');
        const matchedVariant =
          prod.variants.find((v) => v.id === colorParam) || prod.variants[0];
        setSelectedVariantId(matchedVariant?.id || '');
        setSelectedImageIdx(0);
        setSelectedSize(prod.sizes[0] || 'Free Size');
        setQuantity(1);
        return fetch(`/api/reviews?productId=${encodeURIComponent(prod.id)}`).then((r) => r.json());
      })
      .then((revData) => {
        if (revData) setReviews(revData.reviews || []);
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
        <div className="lg:col-span-7 aspect-[3/4] bg-[#F3EFEA]" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-4 w-32 bg-[#F3EFEA]" />
          <div className="h-10 w-3/4 bg-[#F3EFEA]" />
          <div className="h-6 w-1/3 bg-[#F3EFEA]" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-[#1C1917]">Piece Not Found</h1>
        <p className="text-sm text-[#6B6560] mt-3">
          This garment may have been archived or moved.
        </p>
        <Link
          to="/shop"
          className="inline-block mt-6 px-6 py-3 bg-[#1C1917] text-white text-sm font-medium"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const galleryImages = activeVariant?.images || [];
  const mainImage = galleryImages[selectedImageIdx] || galleryImages[0] || '';
  const wishlisted = isWishlisted(product.id);
  const inStock = (activeVariant?.stock || 0) > 0;

  const handleColorSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    setSelectedImageIdx(0);
    setQuantity(1);
    const next = new URLSearchParams(searchParams);
    next.set('color', variantId);
    setSearchParams(next, { replace: true });
  };

  const handleAddToCart = async () => {
    if (!activeVariant) return;
    const ok = await addToCart(product, activeVariant.id, selectedSize, quantity);
    if (ok) setCartDrawerOpen(true);
  };

  const handleBuyNow = async () => {
    if (!activeVariant) return;
    const ok = await addToCart(product, activeVariant.id, selectedSize, quantity);
    if (ok) navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revTitle.trim() || !revComment.trim()) return;
    setSubmittingRev(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          authorName: revName,
          rating: revRating,
          title: revTitle,
          comment: revComment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        setRevName('');
        setRevTitle('');
        setRevComment('');
        setRevRating(5);
        notify('Your review has been published.', 'success');
      } else {
        notify(data.error || 'Could not submit review.', 'error');
      }
    } catch {
      notify('Could not submit review.', 'error');
    } finally {
      setSubmittingRev(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#7D766F] mb-8">
        <Link to="/" className="hover:text-[#1C1917]">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-[#1C1917]">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1C1917] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Contiguous Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Color-Linked Image Gallery with Zoom */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            {galleryImages.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible sm:w-20 shrink-0">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={`${activeVariant?.id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 sm:w-20 aspect-[3/4] bg-[#FAF8F5] overflow-hidden border transition-all shrink-0 ${
                      idx === selectedImageIdx
                        ? 'border-[#1C1917] ring-1 ring-[#1C1917]'
                        : 'border-[#EAE4DC] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      alt={`${product.name} ${activeVariant?.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div
              className="relative flex-1 aspect-[3/4] bg-[#FAF8F5] overflow-hidden cursor-zoom-in"
              onMouseEnter={() => setHoverZoom(true)}
              onMouseLeave={() => setHoverZoom(false)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setZoomOrigin({ x, y });
              }}
              onClick={() => setZoomOpen(true)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeVariant?.id}-${mainImage}`}
                  initial={{ opacity: 0.5, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.5 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full"
                >
                  <SafeImage
                    src={mainImage}
                    alt={`${product.name} in ${activeVariant?.name}`}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              {hoverZoom && mainImage && (
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute inset-0 bg-no-repeat pointer-events-none"
                  style={{
                    backgroundImage: `url("${mainImage}")`,
                    backgroundSize: '185%',
                    backgroundPosition: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  }}
                />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomOpen(true);
                }}
                aria-label="Open full screen zoom"
                className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 hover:bg-white flex items-center justify-center text-[#1C1917] shadow-sm"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#7D766F]">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>{product.fabric}</span>
              {activeVariant?.sku && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{activeVariant.sku}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1917] mt-2 [text-wrap:balance]">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-sm text-[#6B6560] mt-1">{product.subtitle}</p>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-semibold text-[#1C1917]">
                {formatINR(product.salePrice)}
              </span>
              {product.discountPercent > 0 && (
                <>
                  <span className="text-base text-[#8A8279] line-through">
                    {formatINR(product.price)}
                  </span>
                  <span className="text-xs font-semibold text-[#B85D6E]">
                    Save {product.discountPercent}% ({formatINR(product.price - product.salePrice)})
                  </span>
                </>
              )}
            </div>

            <p className="mt-2 text-xs font-medium">
              {inStock ? (
                <span className="text-[#2F6B48]">
                  In Stock — {activeVariant.stock} piece{activeVariant.stock === 1 ? '' : 's'} ready in{' '}
                  {activeVariant.name}
                </span>
              ) : (
                <span className="text-[#B85D6E]">
                  Currently Out of Stock in {activeVariant?.name}
                </span>
              )}
            </p>
          </div>

          {/* Color Variations */}
          <div className="pt-5 border-t border-[#EAE4DC]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                Color Shade
              </span>
              <span className="text-xs text-[#5C554F] font-medium">{activeVariant?.name}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.variants.map((variant) => {
                const isSelected = variant.id === activeVariant?.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => handleColorSelect(variant.id)}
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2 border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[#1C1917] bg-[#FAF8F5] text-[#1C1917]'
                        : 'border-[#E2DBD1] bg-white text-[#5C554F] hover:border-[#1C1917]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: variant.hex }}
                    />
                    <span>{variant.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size / Option Selector */}
          {product.sizes.length > 0 && (
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-2.5">
                Size / Drape Specification
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-xs font-medium border transition-colors ${
                      selectedSize === size
                        ? 'border-[#1C1917] bg-[#1C1917] text-white'
                        : 'border-[#D8CFC2] text-[#1C1917] hover:border-[#1C1917]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-[#D8CFC2] h-12">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!inStock}
                  aria-label="Decrease quantity"
                  className="w-11 h-full flex items-center justify-center text-[#1C1917] hover:bg-[#FAF8F5] disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(activeVariant?.stock || 1, q + 1))
                  }
                  disabled={!inStock || quantity >= (activeVariant?.stock || 1)}
                  aria-label="Increase quantity"
                  className="w-11 h-full flex items-center justify-center text-[#1C1917] hover:bg-[#FAF8F5] disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 h-12 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inStock ? 'Add to Shopping Bag' : 'Out of Stock'}
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="w-12 h-12 border border-[#D8CFC2] hover:border-[#1C1917] flex items-center justify-center transition-colors shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${
                    wishlisted ? 'fill-[#B85D6E] text-[#B85D6E]' : 'text-[#1C1917]'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!inStock}
              className="w-full h-12 border border-[#1C1917] text-[#1C1917] text-sm font-medium hover:bg-[#FAF8F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buy Now — Express Checkout
            </button>
          </div>

          {/* Product Details & Care */}
          <div className="pt-6 border-t border-[#EAE4DC] space-y-5 text-sm">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-2">
                About This Piece
              </h2>
              <p className="text-[#5C554F] leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F0EBE4]">
              <div>
                <p className="text-xs text-[#8A8279]">Fabric</p>
                <p className="font-medium text-[#1C1917] mt-0.5">{product.fabric}</p>
              </div>
              <div>
                <p className="text-xs text-[#8A8279]">Occasions</p>
                <p className="font-medium text-[#1C1917] mt-0.5">
                  {product.occasions.join(', ') || 'All Occasions'}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-1.5">
                Care Instructions
              </h2>
              <p className="text-[#5C554F] text-sm">{product.careInstructions}</p>
            </div>

            <div className="bg-[#FAF8F5] p-4 space-y-2 text-xs text-[#5C554F]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#9A7B4F]" />
                <span>Complimentary shipping across India on orders ₹4,999+</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9A7B4F]" />
                <span>Cash on Delivery &amp; secure online payment supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Reviews */}
      <section className="mt-20 pt-12 border-t border-[#EAE4DC]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl font-medium text-[#1C1917]">
              Customer Reviews
            </h2>
            <p className="text-sm text-[#6B6560] mt-2">
              {reviews.length === 0
                ? 'Be the first client to share a review for this weave.'
                : `${reviews.length} review${reviews.length === 1 ? '' : 's'} submitted for this piece.`}
            </p>

            <form
              onSubmit={handleReviewSubmit}
              className="mt-6 p-6 bg-[#FAF8F5] border border-[#EAE4DC] space-y-4"
            >
              <h3 className="text-sm font-semibold text-[#1C1917]">Write a Review</h3>
              <div>
                <label className="block text-xs text-[#5C554F] mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5C554F] mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRevRating(s)}
                      aria-label={`Rate ${s} stars`}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= revRating ? 'fill-[#9A7B4F] text-[#9A7B4F]' : 'text-[#D5CEC4]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#5C554F] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5C554F] mb-1">Your Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
              <button
                type="submit"
                disabled={submittingRev}
                className="px-5 py-2.5 bg-[#1C1917] text-white text-xs font-medium hover:bg-[#332E2A] disabled:opacity-50"
              >
                {submittingRev ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="border border-[#EAE4DC] p-8 text-center text-sm text-[#6B6560]">
                No reviews yet for {product.name}.
              </div>
            ) : (
              reviews.map((rev) => (
                <article key={rev.id} className="border border-[#EAE4DC] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? 'fill-[#9A7B4F] text-[#9A7B4F]' : 'text-[#E5DEC9]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#8A8279]">{formatDate(rev.createdAt)}</span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1C1917] mt-2">{rev.title}</h4>
                  <p className="text-sm text-[#5C554F] mt-1.5 leading-relaxed">{rev.comment}</p>
                  <p className="text-xs font-medium text-[#1C1917] mt-3">— {rev.authorName}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#EAE4DC]">
          <h2 className="font-display text-3xl font-medium text-[#1C1917] mb-8">
            You May Also Adore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom view"
            className="absolute top-5 right-5 w-11 h-11 bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={mainImage}
            alt={`${product.name} zoom view`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
