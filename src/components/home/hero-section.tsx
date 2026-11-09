// src/components/home/hero-section.tsx
import { HeroBanners } from "./hero-banners"
import { BrandMarquee } from "./brand-marquee"
import { HeroSearch, type HomeTaxonomyProps } from "./hero-search"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"

export function HeroSection({
  taxonomy,
  vehicles = [],
}: {
  taxonomy: HomeTaxonomyProps
  vehicles?: SearchableVehicle[]
}) {
  return (
    <section className="relative w-full bg-background pt-5 pb-8 md:pt-6 md:pb-10">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-5">
        {/* 1. Asymmetric Dual Banners */}
        <HeroBanners />

        {/* 2. Two-Row Opposite-Direction Manufacturer Logo Marquee */}
        <BrandMarquee makes={taxonomy.makes} />

        {/* 3. Sticky Search & Horizontal Filter Bar */}
        <div className="w-full sticky top-[68px] z-40 pt-1">
          <div className="rounded-2xl bg-secondary/45 dark:bg-secondary/50 p-2 sm:p-3 border border-border/80 shadow-xs">
            <HeroSearch taxonomy={taxonomy} vehicles={vehicles} />
          </div>
        </div>
      </div>
    </section>
  )
}