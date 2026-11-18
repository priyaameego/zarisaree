"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

export interface MorphCardItem {
    id?: string;
    src: string;
    title?: string;
    category?: string;
    price?: number;
    to?: string;
}

interface FlipCardProps {
    item: MorphCardItem;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 70;  // Balanced for luxury sarees
const IMG_HEIGHT = 100;

function FlipCard({
    item,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    return (
        <motion.div
            // Smoothly animate to coordinates defined by parent
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 40,
                damping: 15,
            }}
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className="cursor-pointer group select-none"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-xl bg-[#FAF8F5] border border-[#D4B87A]/30"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={item.src}
                        alt={item.title || `loom-edition-${index}`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                    {item.title && (
                        <div className="absolute bottom-1 inset-x-1 text-center pointer-events-none">
                            <p className="text-[7.5px] font-medium text-white truncate px-1">
                                {item.title}
                            </p>
                        </div>
                    )}
                </div>

                {/* Back Face (Flip to reveal luxury saree details) */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-2xl bg-[#1C1917] flex flex-col items-center justify-between p-2 border border-[#D4B87A]/60 text-white"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="text-center pt-1 w-full">
                        <p className="text-[7px] font-semibold text-[#D4B87A] uppercase tracking-widest truncate">
                            {item.category || "Heirloom"}
                        </p>
                        <p className="text-[9px] font-medium text-white line-clamp-2 leading-tight mt-0.5">
                            {item.title || "Pure Silk Zari"}
                        </p>
                    </div>

                    <Link
                        to={item.to || "/shop"}
                        className="w-full py-1 bg-[#D4B87A] text-[#1C1917] hover:bg-white text-[8px] font-bold uppercase tracking-wider rounded text-center transition-colors shadow-sm"
                    >
                        View Drape
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
}

// 100% Authentic Handcrafted Indian Sarees, Lehengas & Handloom Drapes (Zero generic landscape photos)
const DEFAULT_IMAGES: MorphCardItem[] = [
    { src: "/src/assets/images/saree_banarasi_crimson_1794850466729.jpg", title: "Crimson Banarasi", category: "Kadwa Katan Silk", to: "/shop?category=silk-sarees" },
    { src: "/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg", title: "Kanchipuram Gold", category: "Pure Temple Zari", to: "/shop?category=silk-sarees" },
    { src: "/src/assets/images/saree_organza_blush_1794850469816.jpg", title: "Blush Organza", category: "Hand-Painted Floral", to: "/shop?category=designer-sarees" },
    { src: "/src/assets/images/cat_bridal_lehenga_1794850471326.jpg", title: "Rosewood Zardozi", category: "Bridal Couture Drape", to: "/shop?category=lehengas" },
    { src: "/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg", title: "Emerald 3-Ply", category: "Vaikuntham Pattu", to: "/shop?color=Forest%20Emerald" },
    { src: "/src/assets/images/saree_banarasi_rose_1794850467928.jpg", title: "Dusty Rose Katan", category: "Gulab Jaal Brocade", to: "/shop?color=Dusty%20Rose" },
    { src: "/src/assets/images/cat_anarkali_suit_1794850472099.jpg", title: "Ivory Silk Anarkali", category: "Gota Patti Ensemble", to: "/shop?category=suits" },
    { src: "/src/assets/images/saree_chanderi_beige_1794850470161.jpg", title: "Warm Sand Chanderi", category: "Copper Zari Tissue", to: "/shop?color=Warm%20Sand" },
    { src: "/src/assets/images/saree_organza_sage_1794850470074.jpg", title: "Sage Ivory Organza", category: "Scalloped Pearl Drape", to: "/shop?color=Sage%20Ivory" },
    { src: "/src/assets/images/cat_festive_kurti_1794850472253.jpg", title: "Festive Silk Kurti", category: "Handloom Trousseau", to: "/shop" },
    { src: "/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg", title: "Editorial Pattu", category: "Heirloom Gold Weave", to: "/shop?category=silk-sarees" },
    { src: "/src/assets/images/story_handloom_weaving_1794850472133.jpg", title: "Pit-Loom Zari", category: "Master Artisan Weave", to: "/shop" },
    { src: "/src/assets/images/saree_banarasi_crimson_1794850466729.jpg", title: "Sindoori Kadwa", category: "Bridal Banarasi", to: "/shop?category=silk-sarees" },
    { src: "/src/assets/images/saree_kanjivaram_gold_1794850471469.jpg", title: "Swarna Kanjivaram", category: "24K Dip Zari Pattu", to: "/shop?category=silk-sarees" },
    { src: "/src/assets/images/saree_banarasi_rose_1794850467928.jpg", title: "Pastel Rose Brocade", category: "Handwoven Shikargah", to: "/shop?color=Dusty%20Rose" },
    { src: "/src/assets/images/saree_kanjivaram_emerald_1794850469871.jpg", title: "Mayilkan Emerald", category: "Peacock Motif Saree", to: "/shop?color=Forest%20Emerald" },
    { src: "/src/assets/images/saree_organza_blush_1794850469816.jpg", title: "Gulabi Organza", category: "Botanical Petal Drape", to: "/shop?category=designer-sarees" },
    { src: "/src/assets/images/cat_bridal_lehenga_1794850471326.jpg", title: "Heritage Trousseau", category: "Marwar Zardozi Work", to: "/shop?category=lehengas" },
    { src: "/src/assets/images/saree_chanderi_beige_1794850470161.jpg", title: "Beige Tissue Pattu", category: "Featherlight Chanderi", to: "/shop?color=Warm%20Sand" },
    { src: "/src/assets/images/hero_kanjivaram_editorial_1794850468130.jpg", title: "Royal Temple Border", category: "Mukkeish Korvai Drape", to: "/shop?category=silk-sarees" },
];

const TOTAL_IMAGES = 20;
const MAX_SCROLL = 3000;

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export interface ScrollMorphHeroProps {
    items?: MorphCardItem[];
    badgeText?: string;
    headingText?: string;
    subheadingText?: string;
}

export default function ScrollMorphHero({
    items = DEFAULT_IMAGES,
    badgeText = "Interactive Catalog",
    headingText = "Signature Loom Editions",
    subheadingText = "Scroll or drag to morph the loom archive from cosmic scatter to ceremonial curved arc. Flip any card for weave details.",
}: ScrollMorphHeroProps) {
    const cardItems = items.length >= TOTAL_IMAGES ? items.slice(0, TOTAL_IMAGES) : [
        ...items,
        ...DEFAULT_IMAGES.slice(0, TOTAL_IMAGES - items.length),
    ];

    const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Container Size ---
    useEffect(() => {
        if (!containerRef.current) return;

        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        };

        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);

        setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        });

        return () => observer.disconnect();
    }, []);

    // --- Virtual Scroll Logic ---
    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // Prevent default to prevent whole window bounce while scrolling interactive catalog
            e.preventDefault();
            const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };

        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;

            const newScroll = Math.min(Math.max(scrollRef.current + deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("touchstart", handleTouchStart, { passive: false });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
        };
    }, [virtualScroll]);

    // 1. Morph Progress: 0 (Circle) -> 1 (Bottom Arc) between scroll 0 and 600
    const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

    // 2. Scroll Rotation (Shuffling)
    const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

    // --- Mouse Parallax ---
    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const normalizedX = (relativeX / rect.width) * 2 - 1;
            mouseX.set(normalizedX * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    // --- Intro Sequence ---
    useEffect(() => {
        const timer1 = setTimeout(() => setIntroPhase("line"), 500);
        const timer2 = setTimeout(() => setIntroPhase("circle"), 2500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    // --- Random Scatter Positions ---
    const scatterPositions = useMemo(() => {
        return cardItems.map(() => ({
            x: (Math.random() - 0.5) * 1500,
            y: (Math.random() - 0.5) * 1000,
            rotation: (Math.random() - 0.5) * 180,
            scale: 0.6,
            opacity: 0,
        }));
    }, [cardItems]);

    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);
    const [parallaxValue, setParallaxValue] = useState(0);

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
        const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
        const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
        return () => {
            unsubscribeMorph();
            unsubscribeRotate();
            unsubscribeParallax();
        };
    }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[640px] sm:h-[720px] lg:h-[780px] bg-[#FAF8F5] overflow-hidden select-none border-y border-[#EAE4DC]"
        >
            {/* Subtle luxury ambient texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,184,122,0.14),transparent_75%)] pointer-events-none" />

            {/* Container */}
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000 relative">

                {/* Intro Text (Fades out when scrolled) */}
                <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2 px-4 max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, scale: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur border border-[#D4B87A]/40 rounded-full mb-3"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-[#B85D6E]" />
                        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#B85D6E]">
                            {badgeText}
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 1 }}
                        className="font-display text-3xl sm:text-5xl font-medium tracking-tight text-[#1C1917]"
                    >
                        {headingText}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.65 - morphValue } : { opacity: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mt-4 text-xs font-semibold tracking-[0.25em] text-[#8C827A] uppercase"
                    >
                        Scroll or Touch To Morph
                    </motion.p>
                </div>

                {/* Arc Active Content (Fades in when arc forms) */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute top-[8%] sm:top-[10%] z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4 max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/90 backdrop-blur-sm border border-[#D4B87A]/50 rounded-full shadow-sm mb-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4B87A] animate-ping" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B85D6E]">
                            {badgeText}
                        </span>
                    </div>

                    <h2 className="font-display text-3xl sm:text-5xl font-medium text-[#1C1917] tracking-tight mb-2">
                        {headingText}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#665E57] max-w-lg leading-relaxed font-light">
                        {subheadingText}
                    </p>
                </motion.div>

                {/* Main 3D Card Stage */}
                <div className="relative flex items-center justify-center w-full h-full pointer-events-auto">
                    {cardItems.map((item, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

                        if (introPhase === "scatter") {
                            target = scatterPositions[i] || { x: 0, y: 0, rotation: 0, scale: 0.6, opacity: 0 };
                        } else if (introPhase === "line") {
                            const lineSpacing = 80;
                            const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
                            const lineX = i * lineSpacing - lineTotalWidth / 2;
                            target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
                        } else {
                            const isMobile = containerSize.width < 768;
                            const minDimension = Math.min(containerSize.width, containerSize.height);

                            // A. Circle Phase
                            const circleRadius = Math.min(minDimension * 0.35, 340);
                            const circleAngle = (i / TOTAL_IMAGES) * 360;
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = {
                                x: Math.cos(circleRad) * circleRadius,
                                y: Math.sin(circleRad) * circleRadius,
                                rotation: circleAngle + 90,
                            };

                            // B. Bottom Arc Phase
                            const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
                            const arcRadius = baseRadius * (isMobile ? 1.4 : 1.15);
                            const arcApexY = containerSize.height * (isMobile ? 0.38 : 0.28);
                            const arcCenterY = arcApexY + arcRadius;

                            const spreadAngle = isMobile ? 110 : 140;
                            const startAngle = -90 - (spreadAngle / 2);
                            const step = spreadAngle / (TOTAL_IMAGES - 1);

                            const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
                            const maxRotation = spreadAngle * 0.85;
                            const boundedRotation = -scrollProgress * maxRotation;

                            const currentArcAngle = startAngle + (i * step) + boundedRotation;
                            const arcRad = (currentArcAngle * Math.PI) / 180;

                            const arcPos = {
                                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                                rotation: currentArcAngle + 90,
                                scale: isMobile ? 1.35 : 1.75,
                            };

                            // C. Morph between Circle & Arc
                            target = {
                                x: lerp(circlePos.x, arcPos.x, morphValue),
                                y: lerp(circlePos.y, arcPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                                scale: lerp(1, arcPos.scale, morphValue),
                                opacity: 1,
                            };
                        }

                        return (
                            <FlipCard
                                key={item.id || i}
                                item={item}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase}
                                target={target}
                            />
                        );
                    })}
                </div>

                {/* Interactive Controls Hint */}
                <div className="absolute bottom-4 z-20 flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#E5DEC9] rounded-full shadow-sm text-[#6B6560] text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-[#1C1917]" />
                    <span>Scroll wheel to Morph &bull; Hover card to Flip 3D &bull; Move mouse for Parallax</span>
                </div>
            </div>
        </div>
    );
}
