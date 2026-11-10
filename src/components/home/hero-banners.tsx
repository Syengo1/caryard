// src/components/home/hero-banners.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  CarFront,
  Clock,
  ShieldCheck,
  Sparkles,
  Wifi,
  PhoneCall,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BannerSlide {
  id: string
  headlines: [string, string, string]
  bgGradient: string
  ribbonColor: string
  accentText: string
  imageUrl: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
  stats: {
    icon: "car" | "clock" | "shield"
    value: string
    label: string
  }[]
}

const SLIDES: BannerSlide[] = [
  {
    id: "inspection",
    headlines: [
      "Transparent Inspection.",
      "Fair Pricing.",
      "Secure Payment.",
    ],
    bgGradient: "from-[#1e5c52] via-[#24695e] to-[#174941]",
    ribbonColor: "#e11d48",
    accentText: "text-primary",
    imageUrl:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "White Mercedes-Benz Sedan",
    ctaLabel: "EXPLORE CARS",
    ctaHref: "/vehicles",
    stats: [
      { icon: "car", value: "2300+", label: "Cars Sold to Date" },
      { icon: "clock", value: "4 Wks", label: "Quick Turnaround" },
      { icon: "shield", value: "1500+", label: "Inspected Units" },
    ],
  },
  {
    id: "direct-import",
    headlines: [
      "Direct Japan & UK Imports.",
      "Verified Auction Grades.",
      "Duty-Paid Delivery.",
    ],
    bgGradient: "from-[#1b5249] via-[#216156] to-[#154039]",
    ribbonColor: "#e11d48",
    accentText: "text-primary",
    imageUrl:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Red Luxury Sports Crossover",
    ctaLabel: "BROWSE IMPORTS",
    ctaHref: "/vehicles?condition=foreign_used",
    stats: [
      { icon: "shield", value: "Grade 4.5+", label: "JEVIC Inspected" },
      { icon: "clock", value: "30–35 Days", label: "Mombasa Port Arrival" },
      { icon: "car", value: "100%", label: "Logbook Guaranteed" },
    ],
  },
  {
    id: "financing",
    headlines: [
      "Flexible Asset Financing.",
      "Instant Trade-In Valuation.",
      "Drive Home Today.",
    ],
    bgGradient: "from-[#225e55] via-[#286b61] to-[#194740]",
    ribbonColor: "#e11d48",
    accentText: "text-primary",
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Premium Executive SUV",
    ctaLabel: "VIEW IN-STOCK",
    ctaHref: "/vehicles?status=in_stock",
    stats: [
      { icon: "shield", value: "From 30%", label: "Minimum Deposit" },
      { icon: "clock", value: "48 Hours", label: "Bank Approval" },
      { icon: "car", value: "Up to 60m", label: "Repayment Period" },
    ],
  },
]

export function HeroBanners() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(nextSlide, 6000)
    return () => clearInterval(timer)
  }, [isPaused, nextSlide])

  const activeSlide = SLIDES[currentIndex]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full items-stretch">
      {/* LEFT BANNER: WIDER SLIDESHOW BANNER (lg:col-span-8) */}
      <div
        className="lg:col-span-8 relative h-[240px] sm:h-[260px] w-full rounded-2xl overflow-hidden border border-border/80 shadow-md select-none group bg-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Right-side soft sage studio showcase backdrop (no black/zinc in dark mode!) */}
        <div className="absolute inset-0 bg-gradient-to-r from-card via-muted/70 to-secondary/50" />

        {/* Angled Soft Red Ribbon Slash */}
        <div
          className="absolute inset-y-0 left-[46%] sm:left-[48%] w-[24%] -skew-x-[18deg] transition-colors duration-500 z-[1]"
          style={{ backgroundColor: activeSlide.ribbonColor }}
        />

        {/* Left Toned Green Panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[60%] sm:w-[58%] bg-gradient-to-br transition-all duration-500 z-[2] rounded-r-[48px] shadow-[12px_0_30px_rgba(0,0,0,0.14)]",
            activeSlide.bgGradient
          )}
          style={{
            clipPath: "polygon(0 0, 92% 0, 78% 100%, 0% 100%)",
          }}
        />

        {/* Right Showcase Car Image */}
        <div className="absolute inset-y-0 right-0 w-[52%] sm:w-[50%] z-[3] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeSlide.id}
            src={activeSlide.imageUrl}
            alt={activeSlide.imageAlt}
            className="w-full h-[78%] sm:h-[84%] object-contain object-center drop-shadow-[0_14px_20px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-right-4 duration-500 rounded-xl"
            draggable={false}
          />
        </div>

        {/* Left Content Layer */}
        <div className="relative z-[4] h-full w-[64%] sm:w-[58%] flex flex-col justify-between p-5 sm:p-7 text-white pointer-events-none">
          <div
            key={`text-${activeSlide.id}`}
            className="space-y-0.5 sm:space-y-1 animate-in fade-in slide-in-from-left-3 duration-300"
          >
            {activeSlide.headlines.map((line, idx) => (
              <h2
                key={idx}
                className="font-heading font-bold text-base sm:text-xl md:text-[23px] leading-[1.2] tracking-tight text-white drop-shadow-xs"
              >
                {line}
              </h2>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-white/15">
            {activeSlide.stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-xs shrink-0 hidden sm:flex">
                  {stat.icon === "car" && <CarFront className="w-4 h-4 text-emerald-200" />}
                  {stat.icon === "clock" && <Clock className="w-4 h-4 text-emerald-200" />}
                  {stat.icon === "shield" && <ShieldCheck className="w-4 h-4 text-emerald-200" />}
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-extrabold text-xs sm:text-sm md:text-base leading-none text-emerald-100 truncate">
                    {stat.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-white/80 truncate mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[10] h-8 w-8 rounded-full bg-card/90 hover:bg-card text-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[10] h-8 w-8 rounded-full bg-card/90 hover:bg-card text-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Bottom-Right Action Link & Dots */}
        <div className="absolute bottom-3.5 right-4 z-[10] flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === currentIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-foreground/30 hover:bg-foreground/60"
                )}
              />
            ))}
          </div>

          <Link
            href={activeSlide.ctaHref}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-card/95 backdrop-blur-xs shadow-xs hover:underline border border-border/60",
              activeSlide.accentText
            )}
          >
            <span>{activeSlide.ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* RIGHT BANNER: SOFT RED / ROSE EXECUTIVE CARD BANNER (lg:col-span-4) */}
      <div className="lg:col-span-4 relative h-[240px] sm:h-[260px] w-full rounded-2xl overflow-hidden p-5 sm:p-6 flex flex-col justify-between text-white shadow-md border border-border/60 bg-gradient-to-br from-[#8c3b4a] via-[#6e2d3a] to-[#3d2229] select-none group">
        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 w-52 h-52 rounded-full bg-emerald-400/15 blur-2xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded-[6px] bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-1 shadow-inner border border-amber-100/50 flex flex-col justify-between">
              <div className="w-full h-px bg-amber-900/30" />
              <div className="flex justify-between items-center h-2 border-y border-amber-900/30">
                <div className="w-2 h-full border-r border-amber-900/30" />
                <div className="w-2 h-full border-l border-amber-900/30" />
              </div>
              <div className="w-full h-px bg-amber-900/30" />
            </div>
            <Wifi className="w-4 h-4 text-white/60 rotate-90" />
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-200">
              <Sparkles className="w-2.5 h-2.5" /> Mota Privilege
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-1.5 my-auto py-1">
          <h3 className="font-heading font-bold text-lg sm:text-[19px] leading-snug text-white tracking-tight">
            Trade-In, Direct Import &amp; Priority Wishlist
          </h3>
          <p className="text-xs text-white/80 leading-relaxed line-clamp-2">
            Reserve incoming units in transit, request a custom Japan/UK import quote, or book an instant showroom appraisal.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2 pt-2.5 border-t border-white/15">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/65 uppercase truncate">
              MOTA • VIP • 254
            </p>
            <p className="text-[11px] font-semibold text-emerald-200 truncate">
              Ngong Rd, Nairobi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2.5 shadow-sm transition-transform hover:scale-105"
            >
              <span>Join Mota</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/showrooms"
              aria-label="Contact Showroom"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white p-2.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}