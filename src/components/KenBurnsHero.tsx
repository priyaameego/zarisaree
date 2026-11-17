import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { SafeImage } from './SafeImage';

interface HeroSlide {
  id: string;
  src: string;
  alt: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
  initialScale: number;
  targetScale: number;
  targetX: string;
  targetY: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'kanjivaram-ivory',
    src: '/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg',
    alt: 'Ivory and antique gold pure Kanjivaram silk saree in sunlit courtyard',
    kicker: 'Heritage Looms & Couture Silks',
    title: 'Timeless Traditions. Modern Sarees.',
    description:
      'Pure Kanjivaram mulberry silks, Banarasi Katan brocades, and hand-painted organzas crafted in small editions by master weaving houses.',
    ctaLabel: 'Explore Collection',
    ctaTo: '/shop',
    initialScale: 1.0,
    targetScale: 1.11,
    targetX: '-1.5%',
    targetY: '-1.2%',
  },
  {
    id: 'kanjivaram-gold',
    src: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
    alt: 'Pure gold Korvai Kanjivaram mulberry silk saree with temple zari border',
    kicker: 'Royal Korvai Gold Edit',
    title: 'Woven in Pure Gold Zari.',
    description:
      'Heirloom three-ply mulberry silk sarees interlocked by master weavers in Kanchipuram for weddings and milestone celebrations.',
    ctaLabel: 'Shop Silk Sarees',
    ctaTo: '/shop?category=silk-sarees',
    initialScale: 1.1,
    targetScale: 1.01,
    targetX: '1.5%',
    targetY: '-0.8%',
  },
  {
    id: 'banarasi-crimson',
    src: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
    alt: 'Crimson Banarasi Katan silk saree with intricate handwoven gold floral brocade',
    kicker: 'Varanasi Bridal Trousseau',
    title: 'The Art of Handloom Bridal.',
    description:
      'Luminous crimson Katan silk and Kadwa zari motifs curated for pheras, receptions, and timeless heirloom wardrobes.',
    ctaLabel: 'Explore Bridal Edit',
    ctaTo: '/shop?occasion=wedding',
    initialScale: 1.0,
    targetScale: 1.1,
    targetX: '-1.2%',
    targetY: '1%',
  },
];

const SLIDE_DURATION_MS = 6500;

export function KenBurnsHero() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroScroll, [0, 1], ['0%', '16%']);
  const heroContentY = useTransform(heroScroll, [0, 1], ['0%', '-12%']);
  const heroOpacity = useTransform(heroScroll, [0, 0.88], [1, 0.25]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [shouldReduceMotion]);

  const activeSlide = HERO_SLIDES[activeIndex];

  return (
    <section
      ref={heroRef}
      className="relative min-h-[88vh] lg:min-h-[94vh] bg-[#0B1D17] text-white flex items-end overflow-hidden"
    >
      {/* Parallax Ken Burns Image Stage */}
      <motion.div
        style={shouldReduceMotion ? undefined : { y: heroImageY }}
        className="absolute inset-0 overflow-hidden"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <motion.div
              initial={
                shouldReduceMotion
                  ? false
                  : { scale: activeSlide.initialScale, x: '0%', y: '0%' }
              }
              animate={
                shouldReduceMotion
                  ? { scale: 1, x: '0%', y: '0%' }
                  : {
                      scale: activeSlide.targetScale,
                      x: activeSlide.targetX,
                      y: activeSlide.targetY,
                    }
              }
              transition={{
                duration: SLIDE_DURATION_MS / 1000 + 1.2,
                ease: 'linear',
              }}
              className="w-full h-full will-change-transform"
            >
              <SafeImage
                src={activeSlide.src}
                alt={activeSlide.alt}
                loading="eager"
                className="w-full h-full object-cover object-[70%_25%] sm:object-center"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Deep Forest-Emerald Atmospheric Gradient Scrims */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#081813]/95 via-[#0B201A]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071410]/92 via-[#0A1C16]/25 to-black/35" />
      </motion.div>

      {/* Subtle Architectural Gold Molding Inset Frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 sm:inset-7 lg:inset-10 border border-[#D4B87A]/20 z-[5]"
      />

      {/* Foreground Editorial Content */}
      <motion.div
        style={shouldReduceMotion ? undefined : { y: heroContentY, opacity: heroOpacity }}
        className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-14 pb-16 sm:pb-24 pt-32 flex flex-col lg:flex-row lg:items-end justify-between gap-10"
      >
        <div className="max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xs font-medium tracking-[0.24em] uppercase text-[#D4B87A] mb-4">
                {activeSlide.kicker}
              </p>
              <h1 className="font-display text-4xl sm:text-6xl lg:text-[64px] font-medium leading-[1.04] text-white [text-wrap:balance]">
                {activeSlide.title}
              </h1>
              <p className="mt-5 text-sm sm:text-base text-white/80 leading-relaxed max-w-md">
                {activeSlide.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to={activeSlide.ctaTo}
                  className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#091A15]/60 backdrop-blur-sm border border-[#D4B87A]/75 text-white text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#D4B87A] hover:text-[#101C18] transition-all duration-300 whitespace-nowrap"
                >
                  <span>{activeSlide.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shop?occasion=wedding"
                  className="inline-flex items-center px-5 py-3.5 text-xs font-medium tracking-[0.18em] uppercase text-[#E6D3A8] hover:text-white transition-colors whitespace-nowrap"
                >
                  Bridal Edit
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide Progress Selector */}
        <div
          className="flex items-center gap-3 self-start lg:self-end"
          role="tablist"
          aria-label="Featured hero editions"
        >
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show ${slide.title}`}
                onClick={() => setActiveIndex(idx)}
                className="group py-2 px-1 focus-visible:outline-none"
              >
                <span className="block w-10 sm:w-14 h-[2px] bg-white/25 overflow-hidden">
                  {isActive ? (
                    <motion.span
                      key={`progress-${slide.id}-${activeIndex}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : SLIDE_DURATION_MS / 1000,
                        ease: 'linear',
                      }}
                      style={{ transformOrigin: 'left' }}
                      className="block w-full h-full bg-[#D4B87A]"
                    />
                  ) : (
                    <span className="block w-full h-full bg-transparent group-hover:bg-white/45 transition-colors" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
