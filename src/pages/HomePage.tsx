import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { Tilt3DCard } from '../components/Tilt3DCard';
import { KenBurnsHero } from '../components/KenBurnsHero';
import { SculptedArchiveSection } from '../components/SculptedArchiveSection';
import { ImageStreamHero, type StreamImage } from '../components/ui/image-stream-hero';
import {
  StaggerShowcase,
  StaggerTestimonials,
  type StaggerLookbookItem,
} from '../components/ui/stagger-testimonials';
import ScrollMorphHero from '../components/ui/scroll-morph-hero';
import ScrollExpandMedia from '../components/ui/scroll-expansion-hero';
import { formatDate } from '../utils/format';

const OCCASIONS = [
  {
    name: 'Wedding',
    subtitle: 'Bridal Kanjivarams & Zardozi',
    image: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
    slug: 'wedding',
  },
  {
    name: 'Festive',
    subtitle: 'Luminous Silks & Zari Borders',
    image: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
    slug: 'festive',
  },
  {
    name: 'Party Wear',
    subtitle: 'Hand-Painted Organza & Rose Silk',
    image: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
    slug: 'party-wear',
  },
  {
    name: 'Everyday Wear',
    subtitle: 'Breathable Chanderi & Tailoring',
    image: '/src/assets/images/saree_chanderi_beige_1794850470161.jpg',
    slug: 'everyday-wear',
  },
];

const ART_IN_MOTION_ITEMS: StaggerLookbookItem[] = [
  {
    id: 'circle-heritage',
    kicker: 'Varanasi Looms',
    title: 'The Heritage',
    subtitle: 'Kadwa Zari Brocade',
    imgSrc: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
    to: '/shop?category=silk-sarees',
  },
  {
    id: 'circle-korvai',
    kicker: 'Kanchipuram',
    title: 'Korvai Gold',
    subtitle: 'Pure Mulberry Zari',
    imgSrc: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
    to: '/shop?category=sarees',
  },
  {
    id: 'circle-emerald',
    kicker: 'Temple Border',
    title: 'Emerald Weave',
    subtitle: 'Three-Ply Mulberry Silk',
    imgSrc: '/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg',
    to: '/shop?color=Forest%20Emerald',
  },
  {
    id: 'circle-pitloom',
    kicker: 'Artisan Craft',
    title: 'Pit-Loom Thread',
    subtitle: 'Hand-Spun Zari',
    imgSrc: '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
    to: '/shop',
  },
  {
    id: 'circle-organza',
    kicker: 'Botanical Edit',
    title: 'Blush Organza',
    subtitle: 'Scalloped Pearl Edge',
    imgSrc: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
    to: '/shop?category=designer-sarees',
  },
];

const LOOKBOOK_PANELS: StaggerLookbookItem[] = [
  {
    id: 'look-chanderi',
    kicker: 'Made in India',
    title: 'Warm Sand Chanderi',
    subtitle: 'Copper Zari Tissue',
    imgSrc: '/src/assets/images/saree_chanderi_beige_1794850470161.jpg',
    to: '/shop?color=Warm%20Sand',
  },
  {
    id: 'look-pink-power',
    kicker: 'Rosewood Silk',
    title: 'Dusty Rose Katan',
    subtitle: 'Handwoven Floral Jaal',
    imgSrc: '/src/assets/images/saree_banarasi_rose_1794850467928.jpg',
    to: '/shop?color=Dusty%20Rose',
  },
  {
    id: 'look-blush',
    kicker: 'Contemporary Drape',
    title: 'Scalloped Organza',
    subtitle: 'Hand-Painted Florals',
    imgSrc: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
    to: '/shop?category=designer-sarees',
  },
  {
    id: 'look-sage',
    kicker: 'Sunlit Atelier',
    title: 'Sage Ivory Silk',
    subtitle: 'Featherlight Drape',
    imgSrc: '/src/assets/images/saree_organza_sage_1794850470074.jpg',
    to: '/shop?color=Sage%20Ivory',
  },
  {
    id: 'look-bridal',
    kicker: 'Couture Trousseau',
    title: 'Rosewood Zardozi',
    subtitle: 'Bridal Lehenga Set',
    imgSrc: '/src/assets/images/cat_bridal_lehenga_1794850471326.jpg',
    to: '/shop?category=lehengas',
  },
];

const NEW_COLLECTION_STREAM_IMAGES: StreamImage[] = [
  {
    src: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
    alt: 'Crimson Banarasi Katan silk saree',
  },
  {
    src: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
    alt: 'Pure gold Kanjivaram mulberry silk saree',
  },
  {
    src: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
    alt: 'Hand-painted blush organza saree',
  },
  {
    src: '/src/assets/images/cat_bridal_lehenga_1794850471326.jpg',
    alt: 'Rosewood bridal zardozi lehenga',
  },
  {
    src: '/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg',
    alt: 'Forest emerald temple border Kanjivaram',
  },
  {
    src: '/src/assets/images/saree_banarasi_rose_1794850467928.jpg',
    alt: 'Dusty rose handwoven floral jaal saree',
  },
  {
    src: '/src/assets/images/cat_anarkali_suit_1794850472099.jpg',
    alt: 'Ivory and gold embroidered silk Anarkali suit',
  },
  {
    src: '/src/assets/images/saree_chanderi_beige_1794850470161.jpg',
    alt: 'Warm sand Chanderi silk tissue saree',
  },
  {
    src: '/src/assets/images/saree_organza_sage_1794850470074.jpg',
    alt: 'Sage ivory silk organza drape',
  },
  {
    src: '/src/assets/images/cat_festive_kurti_1794850472253.jpg',
    alt: 'Festive hand-embroidered silk kurti set',
  },
  {
    src: '/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg',
    alt: 'Ivory and antique gold pure Kanjivaram editorial drape',
  },
  {
    src: '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
    alt: 'Master weaver crafting silk zari on wooden handloom',
  },
];

export function HomePage() {
  const { categories, notify } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollectionTab, setActiveCollectionTab] = useState<'featured' | 'new' | 'bestseller'>(
    'featured'
  );

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  // Review composer state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/reviews').then((r) => r.json()),
    ])
      .then(([prodData, revData]) => {
        const list = (prodData.products || []) as Product[];
        setProducts(list);
        if (list.length > 0) setReviewProductId(list[0].id);
        setReviews(revData.reviews || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  const displayedTabProducts =
    activeCollectionTab === 'new'
      ? newArrivals.length > 0
        ? newArrivals
        : products.slice(0, 4)
      : activeCollectionTab === 'bestseller'
        ? bestSellers.length > 0
          ? bestSellers
          : products.slice(0, 4)
        : featuredProducts.length > 0
          ? featuredProducts
          : products.slice(0, 4);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus(data.message);
        setNewsletterEmail('');
      } else {
        notify(data.error || 'Unable to subscribe.', 'error');
      }
    } catch {
      notify('Unable to subscribe right now.', 'error');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId || !reviewAuthor.trim() || !reviewTitle.trim() || !reviewComment.trim()) {
      notify('Please fill in all review fields.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: reviewProductId,
          authorName: reviewAuthor,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        setReviewAuthor('');
        setReviewTitle('');
        setReviewComment('');
        setReviewRating(5);
        setShowReviewForm(false);
        notify('Thank you for sharing your review.', 'success');
      } else {
        notify(data.error || 'Could not save review.', 'error');
      }
    } catch {
      notify('Could not submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="overflow-x-clip">
      {/* 1. Scroll-Expansion Hero with Saree Drape Zoom & Text Blend */}
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg"
        bgImageSrc="/src/assets/images/story_handloom_weaving_1794850472133.jpg"
        title="Royal Saree Atelier"
        date="Woven in Pure Zari"
        scrollToExpand="Scroll to Expand Heirloom Drape"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4B87A]">
            The Heritage Manifesto
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-medium text-white [text-wrap:balance]">
            Six Yards of Pure Grace, Handcrafted for Generations
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Every Zari &amp; Loom creation is hand-spun on heritage wooden pit-looms across Varanasi and Kanchipuram, 
            marrying centuries of weaving artistry with contemporary luxury drape styling.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/shop?category=silk-sarees"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D4B87A] text-[#1C1917] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors shadow-lg"
            >
              <span>Explore Silk Sarees</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/shop?category=designer-sarees"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              <span>Designer Organza</span>
            </Link>
          </div>
        </div>
      </ScrollExpandMedia>

      {/* 2. Arched 3D Tilt Categories Showcase */}
      <section className="bg-[#FAF8F5] py-16 lg:py-24 border-b border-[#EAE4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-2xl mx-auto mb-14"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9A7B4F]">
              Curated Wardrobe
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-medium text-[#1C1917] mt-2 [text-wrap:balance]">
              New Collections for Women
            </h2>
            <p className="mt-3 text-sm text-[#6B6560]">
              Explore six-yard heirloom drapes, tailored silk Anarkalis, and hand-embroidered
              trousseau ensembles.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <Link to={`/shop?category=${cat.slug}`} className="group block text-center">
                  <Tilt3DCard
                    maxTilt={10}
                    className="aspect-[3/4] rounded-t-[160px] bg-white p-1.5 border border-[#E8E1D7] overflow-hidden shadow-sm"
                  >
                    <div className="w-full h-full rounded-t-[154px] overflow-hidden bg-[#F3EFEA]">
                      <SafeImage
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                      />
                    </div>
                  </Tilt3DCard>
                  <h3 className="mt-3.5 font-display text-xl font-medium text-[#1C1917] group-hover:text-[#9A7B4F] transition-colors">
                    {cat.name}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-14 lg:mt-16">
            <ImageStreamHero
              images={NEW_COLLECTION_STREAM_IMAGES}
              cards={9}
              speed={20}
              axis={56}
              className="h-[460px] sm:h-[540px] w-full border border-[#E5DEC9] bg-[#FAF8F5]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,248,245,0.92)_0%,rgba(250,248,245,0.68)_38%,rgba(250,248,245,0.08)_76%)]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-between py-10 sm:py-12 px-5 text-center">
                <div className="max-w-xl">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#B85D6E]">
                    New Arrivals Stream
                  </p>
                  <h3 className="font-display text-3xl sm:text-5xl font-medium tracking-tight text-[#1C1917] mt-2 [text-wrap:balance]">
                    Fresh Loom Editions, Front &amp; Centre.
                  </h3>
                </div>

                <div className="max-w-md space-y-5">
                  <p className="text-xs sm:text-sm text-[#4A443F] leading-relaxed">
                    Every newly woven Kanjivaram, Banarasi, organza drape, and bridal ensemble in
                    continuous perspective motion.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to="/shop?sort=latest"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C1917] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#332E2A] transition-colors whitespace-nowrap"
                    >
                      <span>Explore New Arrivals</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/shop?category=silk-sarees"
                      className="inline-flex items-center px-5 py-3 bg-white/90 border border-[#D8CFC2] text-[#1C1917] text-xs font-medium uppercase tracking-wider hover:border-[#1C1917] transition-colors whitespace-nowrap"
                    >
                      Silk Sarees
                    </Link>
                  </div>
                </div>
              </div>
            </ImageStreamHero>
          </div>
        </div>
      </section>

      {/* 3. Staggered Editorial Lookbook Deck ("Every Angle of Drape") */}
      <section className="relative bg-[#F5EFEB] py-16 lg:py-24 border-y border-[#E3D9CE]/70 overflow-hidden">
        {/* Subtle radial luxury glow in background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,184,122,0.12),transparent_70%)] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-8"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#B85D6E]">
              Seasonal Lookbook
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-medium text-[#1C1917] mt-1.5">
              Every Angle of Drape
            </h2>
            <p className="mt-2.5 text-sm text-[#6B6560]">
              Click any side look, swipe with hand, or use controls to rotate through our curated drape editions.
            </p>
          </motion.div>

          <StaggerShowcase items={LOOKBOOK_PANELS} variant="poster" />
        </div>
      </section>

      {/* 4. Staggered Circular Cards Stage ("Art In Motion") */}
      <section className="bg-[#161210] text-white py-20 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="text-center max-w-xl mx-auto mb-10"
          >
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#D4B87A]">
              Circular Weave Showcase
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-medium mt-2">
              Art in Motion
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Explore our signature Banarasi, Kanjivaram, and hand-painted organza weaves in a
              staggered circular gallery.
            </p>
          </motion.div>

          <StaggerShowcase items={ART_IN_MOTION_ITEMS} variant="circle" dark />
        </div>
      </section>

      {/* 4B. Sculpted Silhouettes Gallery (Arch / Square / Petal / Circle / Oval) */}
      <SculptedArchiveSection />

      {/* 5. Signature Loom Editions (Interactive Catalog with 3D Scroll Morph Animation) */}
      <section className="bg-[#FAF6F0] border-b border-[#DDD3C4] overflow-hidden">
        {/* Scroll-Morph 3D Morphing Stage (Scatter -> Circle -> Rainbow Arc -> Shuffle) */}
        <ScrollMorphHero
          badgeText="Interactive Catalog"
          headingText="Signature Loom Editions"
          subheadingText="Scroll down to morph our 20-piece curated heritage archive into an interactive 3D arc. Hover any edition to flip and inspect the weave."
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 border-t border-[#DDD3C4]/70">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9A7B4F]">
                Curated Gallery
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#1C1917] mt-1">
                Browse by Category
              </h3>
            </div>

            <div className="inline-flex bg-[#FAF8F5] p-1 border border-[#E5DEC9] self-start">
              <button
                type="button"
                onClick={() => setActiveCollectionTab('featured')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCollectionTab === 'featured'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#5C554F] hover:text-[#1C1917]'
                }`}
              >
                Featured
              </button>
              <button
                type="button"
                onClick={() => setActiveCollectionTab('new')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCollectionTab === 'new'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#5C554F] hover:text-[#1C1917]'
                }`}
              >
                New Arrivals
              </button>
              <button
                type="button"
                onClick={() => setActiveCollectionTab('bestseller')}
                className={`px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCollectionTab === 'bestseller'
                    ? 'bg-[#1C1917] text-white'
                    : 'text-[#5C554F] hover:text-[#1C1917]'
                }`}
              >
                Best Sellers
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((n) => (
                <div key={n} className="space-y-3 animate-pulse">
                  <div className="aspect-[3/4] bg-[#ECE6DE]" />
                  <div className="h-3 w-24 bg-[#ECE6DE]" />
                  <div className="h-4 w-48 bg-[#ECE6DE]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {displayedTabProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 border border-[#1C1917] text-sm font-medium text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors"
            >
              <span>Shop Complete Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Shop by Occasion */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-22">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          className="mb-10"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9A7B4F]">
            Dressed for the Moment
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1917] mt-1.5">
            Shop by Occasion
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {OCCASIONS.map((occ, idx) => (
            <motion.div
              key={occ.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: idx * 0.07 }}
            >
              <Tilt3DCard maxTilt={7} className="aspect-[3/4] bg-[#FAF8F5] overflow-hidden">
                <Link
                  to={`/shop?occasion=${occ.slug}`}
                  className="group relative w-full h-full block"
                >
                  <SafeImage
                    src={occ.image}
                    alt={`${occ.name} saree collection`}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <h3 className="font-display text-2xl font-medium">{occ.name}</h3>
                    <p className="text-xs text-white/85 mt-1">{occ.subtitle}</p>
                  </div>
                </Link>
              </Tilt3DCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. Tradition That Lives On — Craftsmanship Split */}
      <section className="bg-[#FAF8F5] border-y border-[#EAE4DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="lg:col-span-6 min-h-[340px]"
            >
              <Tilt3DCard maxTilt={5} className="h-full overflow-hidden bg-[#ECE6DE]">
                <SafeImage
                  src="/src/assets/images/story_handloom_weaving_1794850472133.jpg"
                  alt="Artisan weaving silk and gold zari on a wooden handloom"
                  className="w-full h-full object-cover"
                />
              </Tilt3DCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9A7B4F]">
                The Atelier Standard
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1917] mt-2 [text-wrap:balance]">
                Tradition That Lives On
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#5C554F] leading-relaxed">
                Every weave in our collection lists its exact silk composition, origin craft, and
                care guidance so you can invest in garments made to last for generations.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#E5DEC9]">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#9A7B4F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">Complimentary Shipping</h3>
                    <p className="text-xs text-[#6B6560] mt-1">
                      Insured doorstep delivery across India on orders of ₹4,999 and above.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#9A7B4F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">Flexible Payment</h3>
                    <p className="text-xs text-[#6B6560] mt-1">
                      Pay online securely or choose Cash on Delivery at checkout.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#9A7B4F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">Color-True Galleries</h3>
                    <p className="text-xs text-[#6B6560] mt-1">
                      Switch shades on any product to inspect each dye and zari tone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#9A7B4F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1917]">Dedicated Care Notes</h3>
                    <p className="text-xs text-[#6B6560] mt-1">
                      Detailed dry-cleaning and muslin storage instructions with every piece.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. Customer Reviews & Ratings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#B85D6E]">
              Client Impressions
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#1C1917] mt-1.5">
              Customer Reviews &amp; Ratings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewForm((v) => !v)}
            className="px-5 py-2.5 border border-[#1C1917] text-xs font-medium text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            {showReviewForm ? 'Close Review Form' : 'Write a Review'}
          </button>
        </div>

        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="mb-10 p-6 sm:p-8 bg-[#FAF8F5] border border-[#EAE4DC] space-y-4 max-w-2xl"
          >
            <h3 className="font-display text-2xl font-medium text-[#1C1917]">
              Share Your Experience
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  Select Piece
                </label>
                <select
                  value={reviewProductId}
                  onChange={(e) => setReviewProductId(e.target.value)}
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">Rating</label>
                <div className="flex items-center gap-1.5 py-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating
                            ? 'fill-[#9A7B4F] text-[#9A7B4F]'
                            : 'text-[#D5CEC4]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A443F] mb-1.5">Headline</label>
                <input
                  type="text"
                  required
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your impression"
                  className="w-full bg-white border border-[#D8CFC2] px-3 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1.5">
                Review Details
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us about the weave, drape, and color..."
                className="w-full bg-white border border-[#D8CFC2] px-3 py-2.5 text-sm focus:outline-none focus:border-[#1C1917]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-[#1C1917] text-white text-sm font-medium hover:bg-[#332E2A] disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Publish Review'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="border border-[#EAE4DC] bg-[#FAF8F5] p-8 sm:p-10 text-center">
            <p className="font-display text-2xl text-[#1C1917]">
              No customer reviews published yet
            </p>
            <p className="text-sm text-[#6B6560] mt-2 max-w-md mx-auto">
              Verified reviews submitted by shoppers on our pieces appear here automatically. Be the
              first to share your experience.
            </p>
          </div>
        ) : reviews.length >= 3 ? (
          <StaggerTestimonials
            items={reviews.map((rev) => ({
              id: rev.id,
              quote: rev.comment,
              by: `${rev.authorName} · ${rev.productName}`,
              rating: rev.rating,
              imgSrc: '/src/assets/images/saree_banarasi_rose_1794850467928.jpg',
            }))}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((rev) => (
              <article
                key={rev.id}
                className="border border-[#EAE4DC] bg-white p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? 'fill-[#9A7B4F] text-[#9A7B4F]' : 'text-[#E5DEC9]'
                        }`}
                      />
                    ))}
                  </div>
                  <h3 className="text-base font-semibold text-[#1C1917]">{rev.title}</h3>
                  <p className="mt-2 text-sm text-[#5C554F] leading-relaxed">{rev.comment}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-[#F3EFEA] text-xs text-[#7D766F]">
                  <span className="font-semibold text-[#1C1917]">{rev.authorName}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{rev.productName}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{formatDate(rev.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 9. Crimson Silk Finale & Newsletter */}
      <section className="relative bg-[#2D060B] text-white overflow-hidden py-24 lg:py-36 min-h-[500px] flex items-center justify-center">
        {/* Full Bride Editorial Video-like Animation Layer */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1.02, 1.14, 1.02],
              y: [0, -16, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full"
          >
            <SafeImage
              src="/src/assets/images/cat_bridal_lehenga_1794850471326.jpg"
              alt="Royal Indian Bride in Handcrafted Heritage Zardozi Lehenga"
              className="w-full h-full object-cover object-[center_32%]"
            />
          </motion.div>
          {/* Cinematic video overlay vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C0306]/95 via-[#3B070E]/60 to-[#1C0306]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(20,2,4,0.75)_80%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D4B87A]/30 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4B87A] animate-pulse" />
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#E6D3A8]">
              Zari &amp; Loom Bridal Atelier
            </p>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-medium tracking-tight text-white drop-shadow-md [text-wrap:balance]">
            Receive New Loom Editions First
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/90 max-w-lg mx-auto font-light leading-relaxed drop-shadow-sm">
            Join our private dispatch for seasonal bridal previews, hand-painted organza drops,
            and master weaver stories.
          </p>

          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address for newsletter"
              className="flex-1 bg-black/40 backdrop-blur-md border border-white/30 px-5 py-3.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-[#D4B87A] transition-colors rounded-none"
            />
            <button
              type="submit"
              disabled={submittingNewsletter}
              className="px-8 py-3.5 bg-[#D4B87A] text-[#1C1917] text-sm font-semibold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200 whitespace-nowrap disabled:opacity-60 shadow-lg"
            >
              {submittingNewsletter ? 'Joining...' : 'Subscribe'}
            </button>
          </form>

          {newsletterStatus && (
            <p className="mt-4 text-xs text-[#F3D5DB]">{newsletterStatus}</p>
          )}
        </motion.div>
      </section>
    </div>
  );
}
