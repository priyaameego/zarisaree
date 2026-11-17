import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { SafeImage } from '@/src/components/SafeImage';

const SQRT_5000 = Math.sqrt(5000);

export interface StaggerCardItem {
  id: string;
  quote: string;
  by: string;
  imgSrc: string;
  rating?: number;
}

export interface StaggerLookbookItem {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  imgSrc: string;
  to: string;
  accentBg?: string;
}

interface TestimonialCardProps {
  position: number;
  item: StaggerCardItem;
  handleMove: (steps: number) => void;
  cardSize: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  item,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        'absolute left-1/2 top-1/2 cursor-pointer border-2 p-7 sm:p-8 transition-all duration-500 ease-in-out',
        isCenter
          ? 'z-10 bg-primary text-primary-foreground border-primary'
          : 'z-0 bg-card text-card-foreground border-border hover:border-[#9A7B4F]'
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          'polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)',
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -52 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? '0px 8px 0px 4px hsl(var(--border))' : 'none',
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <SafeImage
          src={item.imgSrc}
          alt={item.by}
          className="h-14 w-12 bg-muted object-cover object-top shadow-[3px_3px_0px_hsl(var(--background))]"
        />
        {typeof item.rating === 'number' && (
          <div className="flex items-center gap-0.5 pt-1 pr-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < item.rating!
                    ? 'fill-[#D4B87A] text-[#D4B87A]'
                    : isCenter
                      ? 'text-white/25'
                      : 'text-[#DED6CB]'
                )}
              />
            ))}
          </div>
        )}
      </div>
      <h3
        className={cn(
          'font-display text-xl sm:text-2xl font-medium leading-snug line-clamp-4',
          isCenter ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        &ldquo;{item.quote}&rdquo;
      </h3>
      <p
        className={cn(
          'absolute bottom-7 left-7 right-7 text-xs sm:text-sm italic truncate',
          isCenter ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}
      >
        — {item.by}
      </p>
    </div>
  );
};

export const StaggerTestimonials: React.FC<{ items: StaggerCardItem[] }> = ({ items }) => {
  const [cardSize, setCardSize] = useState(360);
  const [list, setList] = useState<Array<StaggerCardItem & { tempKey: string }>>(() =>
    items.map((item, i) => ({ ...item, tempKey: `${item.id}-${i}` }))
  );

  useEffect(() => {
    setList(items.map((item, i) => ({ ...item, tempKey: `${item.id}-${i}` })));
  }, [items]);

  const handleMove = (steps: number) => {
    if (steps === 0 || list.length <= 1) return;
    const next = [...list];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const shifted = next.shift();
        if (!shifted) return;
        next.push({ ...shifted, tempKey: `${shifted.id}-${Math.random()}` });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const popped = next.pop();
        if (!popped) return;
        next.unshift({ ...popped, tempKey: `${popped.id}-${Math.random()}` });
      }
    }
    setList(next);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia('(min-width: 640px)');
      setCardSize(matches ? 360 : 285);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden bg-[#FAF8F5] border border-[#EAE4DC]" style={{ height: 540 }}>
      {list.map((item, index) => {
        const position =
          list.length % 2
            ? index - (list.length + 1) / 2
            : index - list.length / 2;
        return (
          <TestimonialCard
            key={item.tempKey}
            item={item}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        );
      })}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2.5 z-20">
        <button
          type="button"
          onClick={() => handleMove(-1)}
          className="flex h-12 w-12 items-center justify-center bg-white border border-[#D8CFC2] text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors"
          aria-label="Previous review"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => handleMove(1)}
          className="flex h-12 w-12 items-center justify-center bg-white border border-[#D8CFC2] text-[#1C1917] hover:bg-[#1C1917] hover:text-white transition-colors"
          aria-label="Next review"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface StaggerShowcaseProps {
  items: StaggerLookbookItem[];
  variant?: 'circle' | 'poster';
  dark?: boolean;
}

export const StaggerShowcase: React.FC<StaggerShowcaseProps> = ({
  items,
  variant = 'circle',
  dark = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState(variant === 'circle' ? 310 : 300);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);

  // Scroll-driven dynamic progress: as user scrolls down the page, deck smoothly cycles
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  // Dynamic 3D depth, tilt, and subtle rotation based on page scroll
  const scrollRotateX = useTransform(smoothScroll, [0, 0.5, 1], [15, 0, -15]);
  const scrollRotateZ = useTransform(smoothScroll, [0, 0.5, 1], [-2.5, 0, 2.5]);
  const scrollDepth = useTransform(smoothScroll, [0, 0.5, 1], [-80, 0, -50]);

  // Direct continuous scroll shift: cards travel horizontally as page is scrolled
  const scrollXShift = useTransform(smoothScroll, [0, 1], [-cardSize * 0.85, cardSize * 0.85]);

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia('(min-width: 640px)');
      if (variant === 'circle') {
        setCardSize(matches ? 310 : 240);
      } else {
        setCardSize(matches ? 290 : 235);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [variant]);

  const total = items.length;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goToIndex = (idx: number) => {
    setCurrentIndex(((idx % total) + total) % total);
  };

  // Mouse wheel horizontal scroll handler (User can scroll wheel directly on carousel to swipe)
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
      if (e.deltaX > 0) goToNext();
      else goToPrev();
    }
  };

  // Touch Swipe Handlers (Mobile touch & swipe gesture)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      if (dragOffset < -45) {
        goToNext();
      } else if (dragOffset > 45) {
        goToPrev();
      }
    }
    touchStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse Drag Handlers (Desktop click & drag with hand cursor)
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStartX.current === null || !isDragging) return;
    const diff = e.clientX - mouseStartX.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (mouseStartX.current !== null && isDragging) {
      if (dragOffset < -55) {
        goToNext();
      } else if (dragOffset > 55) {
        goToPrev();
      }
    }
    mouseStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <motion.div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        'relative w-full overflow-hidden select-none py-8 touch-pan-y',
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={{
        height: variant === 'circle' ? 500 : 560,
        perspective: 1600,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="relative w-full h-full pointer-events-none"
        style={{
          x: scrollXShift,
          rotateX: scrollRotateX,
          rotateZ: scrollRotateZ,
          z: scrollDepth,
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, index) => {
          // Circular relative offset from current center index
          let offset = index - currentIndex;
          while (offset > total / 2) offset -= total;
          while (offset < -total / 2) offset += total;

          const absPos = Math.abs(offset);
          const isCenter = offset === 0;
          const baseStepX = variant === 'circle' ? cardSize * 0.78 : cardSize * 0.84;
          
          // Drag responsiveness: moves with hand in real time
          const dragInfluence = isDragging ? dragOffset * 0.75 : 0;
          const targetX = baseStepX * offset + dragInfluence;

          const translateY =
            variant === 'circle'
              ? isCenter
                ? -24
                : absPos * 15
              : isCenter
                ? -30
                : (offset % 2 !== 0 ? 16 : -10);

          // Realistic 3D Arch, rotation & depth
          const rotateZ = isCenter ? (dragInfluence * 0.04) : offset * (variant === 'circle' ? 4 : 4.5);
          const rotateY = isCenter ? (-dragInfluence * 0.08) : -offset * 14; // Curved towards viewer
          const translateZ = isCenter ? 75 : -absPos * 50; // Dramatic 3D z-depth
          const scale = isCenter ? 1.06 : Math.max(0.74, 1 - absPos * 0.12);
          const opacity = absPos > 2.6 ? 0 : isCenter ? 1 : Math.max(0.45, 0.92 - absPos * 0.2);

          return (
            <motion.div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!isCenter && Math.abs(dragOffset) < 10) {
                  goToIndex(index);
                }
              }}
              style={{
                width: cardSize,
                height: variant === 'circle' ? cardSize : Math.round(cardSize * 1.34),
                zIndex: 40 - Math.round(absPos * 10),
                opacity,
                transformStyle: 'preserve-3d',
              }}
              animate={{
                x: `calc(-50% + ${targetX}px)`,
                y: `calc(-50% + ${translateY}px)`,
                rotateZ,
                rotateY,
                z: translateZ,
                scale,
              }}
              whileHover={{
                scale: isCenter ? 1.08 : scale * 1.04,
                z: translateZ + 25,
                transition: { duration: 0.2 },
              }}
              transition={{
                type: 'spring',
                stiffness: isDragging ? 400 : 240,
                damping: isDragging ? 32 : 24,
              }}
              className={cn(
                'absolute left-1/2 top-1/2 group pointer-events-auto backface-hidden transition-shadow duration-300',
                isCenter ? 'cursor-default' : 'hover:-translate-y-1',
                variant === 'circle'
                  ? 'rounded-full p-2 border'
                  : 'overflow-hidden border shadow-2xl rounded-sm',
                dark
                  ? isCenter
                    ? 'border-[#D4B87A] bg-[#241E1B] shadow-[0_35px_80px_rgba(0,0,0,0.8)] ring-1 ring-[#D4B87A]/30'
                    : 'border-white/15 bg-[#1D1816]'
                  : isCenter
                    ? 'border-[#1C1917] bg-white shadow-[0_30px_70px_rgba(28,25,23,0.24)] ring-1 ring-black/10'
                    : 'border-[#E5DEC9] bg-[#FAF8F5]'
              )}
            >
              <div
                className={cn(
                  'relative w-full h-full overflow-hidden',
                  variant === 'circle' ? 'rounded-full' : ''
                )}
              >
                <SafeImage
                  src={item.imgSrc}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 pointer-events-none select-none"
                />
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 pointer-events-none',
                    !isCenter ? 'bg-black/30 group-hover:bg-black/15' : 'from-black/90'
                  )}
                />
                
                {/* 3D Glass Sheen reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 text-white pointer-events-auto',
                    variant === 'circle' ? 'p-6 text-center' : 'p-5 text-left'
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#E6D3A8] font-medium">
                    {item.kicker}
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl font-medium mt-0.5 leading-tight text-white drop-shadow-sm">
                    {item.title}
                  </h3>
                  {isCenter && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('mt-2.5', variant === 'circle' ? 'flex justify-center' : '')}
                    >
                      <Link
                        to={item.to}
                        onClick={(e) => {
                          if (Math.abs(dragOffset) > 10) e.preventDefault();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-[#1C1917] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#FAF8F5] transition-all duration-200 shadow-md hover:shadow-lg hover:gap-2.5"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Swipe hint & Arrow controls */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
        <button
          type="button"
          onClick={goToPrev}
          aria-label="Previous card"
          className={cn(
            'w-11 h-11 flex items-center justify-center border transition-all duration-200 active:scale-95 shadow-sm',
            dark
              ? 'bg-[#241E1B]/95 border-white/25 text-white hover:border-[#D4B87A] hover:bg-[#D4B87A] hover:text-[#1C1917]'
              : 'bg-white border-[#D8CFC2] text-[#1C1917] hover:bg-[#1C1917] hover:text-white'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Indicators for swipe */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === currentIndex ? 'w-5 bg-[#D4B87A]' : 'w-1.5 bg-white/40 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goToNext}
          aria-label="Next card"
          className={cn(
            'w-11 h-11 flex items-center justify-center border transition-all duration-200 active:scale-95 shadow-sm',
            dark
              ? 'bg-[#241E1B]/95 border-white/25 text-white hover:border-[#D4B87A] hover:bg-[#D4B87A] hover:text-[#1C1917]'
              : 'bg-white border-[#D8CFC2] text-[#1C1917] hover:bg-[#1C1917] hover:text-white'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};
