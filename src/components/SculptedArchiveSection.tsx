import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SafeImage } from './SafeImage';
import { Tilt3DCard } from './Tilt3DCard';
import { cn } from '@/src/lib/utils';

type SilhouetteShape = 'arch' | 'square' | 'petal' | 'circle' | 'oval' | 'landscape';

interface ArchiveTile {
  id: string;
  title: string;
  subtitle: string;
  imgSrc: string;
  alt: string;
  to: string;
  shape: SilhouetteShape;
  offsetClass?: string;
}

const ARCHIVE_TILES: ArchiveTile[] = [
  {
    id: 'archive-heritage',
    title: 'The Heritage',
    subtitle: 'Varanasi Kadwa Brocade',
    imgSrc: '/src/assets/images/saree_banarasi_crimson_1794850466729.jpg',
    alt: 'Crimson Banarasi silk saree with gold zari weave',
    to: '/shop?category=silk-sarees',
    shape: 'arch',
  },
  {
    id: 'archive-modern-zari',
    title: 'Modern Zari',
    subtitle: 'Kanchipuram Temple Gold',
    imgSrc: '/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg',
    alt: 'Pure gold Kanjivaram mulberry silk saree border',
    to: '/shop?category=sarees',
    shape: 'square',
  },
  {
    id: 'archive-timeless',
    title: 'Timeless',
    subtitle: 'Emerald Three-Ply Silk',
    imgSrc: '/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg',
    alt: 'Forest emerald pleated Kanjivaram silk drape',
    to: '/shop?color=Forest%20Emerald',
    shape: 'petal',
  },
  {
    id: 'archive-rosewood',
    title: 'Rosewood Jaal',
    subtitle: 'Handwoven Floral Silk',
    imgSrc: '/src/assets/images/saree_banarasi_rose_1794850467928.jpg',
    alt: 'Dusty rose floral jaal Banarasi silk weave',
    to: '/shop?color=Dusty%20Rose',
    shape: 'circle',
  },
  {
    id: 'archive-organza',
    title: 'Royal Organza',
    subtitle: 'Scalloped Pearl Drape',
    imgSrc: '/src/assets/images/saree_organza_blush_1794850469816.jpg',
    alt: 'Blush pink hand-painted organza saree',
    to: '/shop?category=designer-sarees',
    shape: 'oval',
    offsetClass: 'md:-mt-14',
  },
  {
    id: 'archive-atelier',
    title: 'Loom Atelier',
    subtitle: 'Pit-Loom Craftsmanship',
    imgSrc: '/src/assets/images/story_handloom_weaving_1794850472133.jpg',
    alt: 'Artisan handloom weaving pure silk and zari',
    to: '/shop',
    shape: 'landscape',
    offsetClass: 'md:mt-4',
  },
];

const SHAPE_CLASSES: Record<SilhouetteShape, string> = {
  arch: 'aspect-[4/5] rounded-t-[220px] rounded-b-md',
  square: 'aspect-square rounded-2xl',
  petal: 'aspect-[4/5] rounded-tl-[200px] rounded-br-[200px] rounded-tr-xl rounded-bl-xl',
  circle: 'aspect-square rounded-full',
  oval: 'aspect-[4/5] rounded-full',
  landscape: 'aspect-[5/4] rounded-2xl',
};

export function SculptedArchiveSection() {
  return (
    <section className="bg-[#211813] text-[#FAF8F5] py-20 lg:py-28 border-t border-[#D4B87A]/15 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#D4B87A]">
            Architectural Drape Gallery
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-medium mt-2 text-white [text-wrap:balance]">
            Silhouettes of the Loom
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Six heirloom textile studies framed in bespoke arch, circle, and petal silhouettes—tap
            any weave to browse the collection.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-12 items-start">
          {ARCHIVE_TILES.map((tile, idx) => (
            <motion.div
              key={tile.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn('w-full max-w-[330px] mx-auto', tile.offsetClass)}
            >
              <Link to={tile.to} className="group block text-center focus-visible:outline-none">
                <Tilt3DCard
                  maxTilt={7}
                  className={cn(
                    'w-full overflow-hidden bg-[#17110E] ring-1 ring-[#D4B87A]/20 group-hover:ring-[#D4B87A]/70 group-focus-visible:ring-2 group-focus-visible:ring-[#D4B87A] shadow-[0_24px_55px_rgba(0,0,0,0.45)] transition-all duration-300',
                    SHAPE_CLASSES[tile.shape]
                  )}
                >
                  <div className="relative w-full h-full">
                    <SafeImage
                      src={tile.imgSrc}
                      alt={tile.alt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-75 group-hover:opacity-45 transition-opacity duration-300" />
                  </div>
                </Tilt3DCard>

                <div className="mt-4">
                  <h3 className="text-xs sm:text-sm font-medium uppercase tracking-[0.22em] text-[#FAF8F5] group-hover:text-[#D4B87A] transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-xs text-white/55 mt-1">{tile.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-7 py-3 border border-[#D4B87A]/50 text-xs font-medium uppercase tracking-[0.2em] text-[#E6D3A8] hover:bg-[#D4B87A] hover:text-[#1C1917] transition-colors"
          >
            <span>View Full Archive</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
