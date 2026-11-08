// src/components/home/brand-marquee.tsx
"use client"

import React, { useMemo } from "react"
import Link from "next/link"

export interface BrandMakeItem {
  id: string
  name: string
  slug: string
  logo_url?: string | null
}

function BrandEmblem({ slug, name }: { slug: string; name: string }) {
  const key = (slug || name).toLowerCase()

  // Mercedes-Benz 3-Pointed Star
  if (key.includes("mercedes") || key.includes("benz")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 2.5V12M12 12L4.2 17.2M12 12L19.8 17.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Audi 4 Rings
  if (key.includes("audi")) {
    return (
      <svg viewBox="0 0 36 16" className="w-7 h-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="6.5" cy="8" r="4.8" />
        <circle cx="14.2" cy="8" r="4.8" />
        <circle cx="21.8" cy="8" r="4.8" />
        <circle cx="29.5" cy="8" r="4.8" />
      </svg>
    )
  }

  // Toyota 3 Overlapping Ovals
  if (key.includes("toyota")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="10" ry="6.5" />
        <ellipse cx="12" cy="10.2" rx="6.5" ry="2.8" />
        <ellipse cx="12" cy="12" rx="2.6" ry="6.2" />
      </svg>
    )
  }

  // BMW Roundel
  if (key.includes("bmw")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9.5" />
        <circle cx="12" cy="12" r="6" />
        <path d="M12 6v12M6 12h12" />
      </svg>
    )
  }

  // Subaru Pleiades Oval
  if (key.includes("subaru")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="12" rx="9.5" ry="5.8" />
        <path d="M8.5 9.5L9.5 12L8.5 14.5M7 12H10M14.5 9.5v3M13 11h3M16.5 13v2.5M15.3 14.2h2.4" strokeLinecap="round" />
      </svg>
    )
  }

  // Volkswagen Emblem
  if (key.includes("volkswagen") || key === "vw") {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M7.5 6.5L12 15.5L16.5 6.5M5.5 10.5L9.5 18L12 13L14.5 18L18.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Mazda Wings
  if (key.includes("mazda")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="12" rx="9.5" ry="7" />
        <path d="M4.5 10.5C7.5 10.5 10 12.5 12 15.5C14 12.5 16.5 10.5 19.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Lexus "L" Oval
  if (key.includes("lexus")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="12" rx="9.5" ry="6.2" />
        <path d="M10.5 8.5L8.5 14.5H16" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  // Nissan Badge
  if (key.includes("nissan")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="7.5" />
        <rect x="2.5" y="9.8" width="19" height="4.4" rx="1" className="fill-background" />
      </svg>
    )
  }

  // Honda "H" Badge
  if (key.includes("honda")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="5" width="16" height="14" rx="4" />
        <path d="M8.5 8v8M15.5 8v8M8.5 12h7" strokeLinecap="round" />
      </svg>
    )
  }

  // Land Rover Oval
  if (key.includes("land") || key.includes("rover") || key.includes("range")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="12" cy="12" rx="10" ry="5.5" />
        <path d="M6 12h12" strokeLinecap="round" />
      </svg>
    )
  }

  // Porsche Crest Shield
  if (key.includes("porsche")) {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M5 4h14v7c0 5.5-7 9-7 9s-7-3.5-7-9V4z" strokeLinejoin="round" />
        <path d="M12 4v16M5 10h14" />
      </svg>
    )
  }

  // Default Monogram Crest
  return (
    <span className="w-5 h-5 rounded-full border border-foreground/30 flex items-center justify-center text-[10px] font-heading font-bold uppercase text-foreground">
      {name.slice(0, 1)}
    </span>
  )
}

const DEFAULT_BRANDS: BrandMakeItem[] = [
  { id: "mercedes-benz", name: "Mercedes-Benz", slug: "mercedes-benz" },
  { id: "audi", name: "Audi", slug: "audi" },
  { id: "toyota", name: "Toyota", slug: "toyota" },
  { id: "bmw", name: "BMW", slug: "bmw" },
  { id: "subaru", name: "Subaru", slug: "subaru" },
  { id: "volkswagen", name: "Volkswagen", slug: "volkswagen" },
  { id: "land-rover", name: "Land Rover", slug: "land-rover" },
  { id: "porsche", name: "Porsche", slug: "porsche" },
  { id: "lexus", name: "Lexus", slug: "lexus" },
  { id: "mazda", name: "Mazda", slug: "mazda" },
  { id: "nissan", name: "Nissan", slug: "nissan" },
  { id: "honda", name: "Honda", slug: "honda" },
]

export function BrandMarquee({ makes = [] }: { makes?: BrandMakeItem[] }) {
  // Merge DB makes with our curated canonical list so both rows always have rich logos
  const mergedBrands = useMemo(() => {
    const dbMap = new Map<string, BrandMakeItem>()
    for (const m of makes) {
      dbMap.set(m.slug.toLowerCase(), m)
      dbMap.set(m.name.toLowerCase(), m)
    }

    const combined: BrandMakeItem[] = [...makes]
    for (const fallback of DEFAULT_BRANDS) {
      if (!dbMap.has(fallback.slug) && !dbMap.has(fallback.name.toLowerCase())) {
        combined.push(fallback)
      }
    }
    return combined
  }, [makes])

  const midpoint = Math.ceil(mergedBrands.length / 2)
  const rowOneBase = mergedBrands.slice(0, midpoint)
  const rowTwoBase = mergedBrands.slice(midpoint).length > 0 ? mergedBrands.slice(midpoint) : mergedBrands

  // Duplicate arrays 4x so the -50% infinite CSS translation is seamless on ultra-wide screens
  const rowOneTrack = [...rowOneBase, ...rowOneBase, ...rowOneBase, ...rowOneBase]
  const rowTwoTrack = [...rowTwoBase, ...rowTwoBase, ...rowTwoBase, ...rowTwoBase]

  const getMakeHref = (brand: BrandMakeItem) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brand.id)
    return isUuid
      ? `/vehicles?make=${encodeURIComponent(brand.id)}`
      : `/vehicles?q=${encodeURIComponent(brand.name)}`
  }

  return (
    <div className="relative w-full overflow-hidden py-1 space-y-2.5 group/marquee select-none">
      {/* Left & Right Soft Edge Fade Masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-background to-transparent z-10" />

      {/* ROW 1: Moves Right to Left */}
      <div className="flex overflow-hidden">
        <div className="animate-marquee-left gap-3 pr-3">
          {rowOneTrack.map((brand, idx) => (
            <Link
              key={`r1-${brand.slug}-${idx}`}
              href={getMakeHref(brand)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-accent/50 shadow-2xs transition-all duration-200 shrink-0"
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <BrandEmblem slug={brand.slug} name={brand.name} />
              )}
              <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ROW 2: Moves Left to Right (Opposite Direction) */}
      <div className="flex overflow-hidden">
        <div className="animate-marquee-right gap-3 pr-3">
          {rowTwoTrack.map((brand, idx) => (
            <Link
              key={`r2-${brand.slug}-${idx}`}
              href={getMakeHref(brand)}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:bg-accent/50 shadow-2xs transition-all duration-200 shrink-0"
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <BrandEmblem slug={brand.slug} name={brand.name} />
              )}
              <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}