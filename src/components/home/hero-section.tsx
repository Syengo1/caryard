// src/components/home/hero-section.tsx
import { Sparkles } from "lucide-react"
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
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-start pt-12 pb-16 md:py-16">
      
      {/* Background Decorators (Wrapped securely behind content) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Hero Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop" 
          alt="Premium car background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 dark:opacity-60 transition-opacity duration-500"
        />
        
        {/* Gradient Overlay to ensure text legibility and blend smoothly into the page below */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        
        {/* Subtle Color Accents to make it pop */}
        <div className="absolute top-[-15%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-primary/20 blur-[100px] mix-blend-screen dark:mix-blend-lighten" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen dark:mix-blend-lighten" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-7xl flex flex-col items-center space-y-8">
        
        {/* Hero Copy & Headlines */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mt-4 sm:mt-8 mb-6">
          <div className="inline-flex items-center rounded-full border border-border/50 bg-background/60 px-3.5 py-1 text-xs sm:text-sm text-foreground backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
            Verified Foreign Used, Locally Used &amp; Brand New Units
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight text-foreground drop-shadow-sm">
            Drive Quality. <span className="text-primary">Zero Compromise.</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground/80 max-w-2xl leading-relaxed drop-shadow-sm font-medium">
            Search our live showroom stock in Nairobi or reserve inspected units in transit with transparent pricing.
          </p>
        </div>

        {/* 
          THIN & STICKY WRAPPER 
          Keeps the horizontal search bar pinned below the main Navbar (top-[64px]) when scrolling down 
        */}
        <div className="w-full sticky top-[72px] z-50 animate-in fade-in slide-in-from-bottom-6 duration-500 pt-2 pb-4">
          <HeroSearch taxonomy={taxonomy} vehicles={vehicles} />
        </div>
      </div>
    </section>
  )
}