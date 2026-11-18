"use client";

import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from "react";
import { motion } from "framer-motion";
import { SafeImage } from "@/src/components/SafeImage";

export interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpandMedia: React.FC<ScrollExpandMediaProps> = ({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand = "Scroll or swipe to expand drape",
  textBlend = false,
  children,
}) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if user is at the top of section
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inView = rect.top <= 80 && rect.bottom >= window.innerHeight * 0.5;

      if (!inView && mediaFullyExpanded) return;

      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 10) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded && inView) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inView = rect.top <= 80 && rect.bottom >= window.innerHeight * 0.5;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 10) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded && inView) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1,
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (rect && rect.top <= 0 && !mediaFullyExpanded) {
        window.scrollTo(0, sectionRef.current?.offsetTop || 0);
      }
    };

    window.addEventListener("wheel", handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener("scroll", handleScroll as EventListener);
    window.addEventListener(
      "touchstart",
      handleTouchStart as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener(
      "touchmove",
      handleTouchMove as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel as unknown as EventListener,
      );
      window.removeEventListener("scroll", handleScroll as EventListener);
      window.removeEventListener(
        "touchstart",
        handleTouchStart as unknown as EventListener,
      );
      window.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener,
      );
      window.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 320 + scrollProgress * (isMobileState ? 650 : 1300);
  const mediaHeight = 440 + scrollProgress * (isMobileState ? 240 : 450);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(" ")[0] : "";
  const restOfTitle = title ? title.split(" ").slice(1).join(" ") : "";

  return (
    <div
      ref={sectionRef}
      className="transition-colors duration-700 ease-in-out overflow-x-hidden bg-[#161210]"
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          {/* Background Layer with opacity responding to scroll */}
          <motion.div
            className="absolute inset-0 z-0 h-full w-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <SafeImage
              src={bgImageSrc}
              alt="Luxury Weave Heritage Atelier"
              className="w-screen h-screen object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-[#161210]" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              {/* Expanding Central Hero Card */}
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl overflow-hidden border border-[#D4B87A]/40"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "96vw",
                  maxHeight: "88vh",
                  boxShadow: "0px 25px 80px rgba(0, 0, 0, 0.75)",
                }}
              >
                {mediaType === "video" ? (
                  <div className="relative w-full h-full pointer-events-none">
                    <video
                      src={mediaSrc}
                      poster={posterSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover rounded-xl"
                      controls={false}
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/30 rounded-xl"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0.4 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <SafeImage
                      src={mediaSrc}
                      alt={title || "Royal Heritage Silk Saree Drape"}
                      className="w-full h-full object-cover object-[center_28%] rounded-xl transition-transform duration-700"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 rounded-xl"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.6 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                {/* Sub-label and Expand Prompt */}
                <div className="absolute bottom-6 inset-x-4 flex flex-col items-center text-center z-20">
                  {date && (
                    <p
                      className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#E6D3A8] font-semibold drop-shadow"
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="text-[11px] sm:text-xs text-white/80 font-light mt-1 tracking-wider uppercase drop-shadow"
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              {/* Title that slides apart horizontally on scroll */}
              <div
                className={`flex items-center justify-center text-center gap-2 sm:gap-4 w-full relative z-10 transition-none flex-col pointer-events-none px-4 ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                <motion.h2
                  className="font-display text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#FAF8F5] drop-shadow-xl transition-none"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className="font-display text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-center text-[#E6D3A8] drop-shadow-xl transition-none"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            {/* Revealed Editorial Content when media is fully expanded */}
            <motion.section
              className="flex flex-col w-full px-6 py-10 md:px-16 lg:py-20 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
