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
    // FIXED: Removed overflow-hidden and added z-40 so the dropdown can escape the section and float above the rest of the page
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-12 pb-16 md:py-16 z-40">
      
      {/* FIXED: We wrap ONLY the background elements in overflow-hidden. 
          This prevents horizontal scrolling without trapping the search dropdown! */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="absolute top-[-15%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-7xl flex flex-col items-center space-y-6">
        {/* Hero Copy */}
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl">
          <div className="inline-flex items-center rounded-full border bg-background/80 px-3.5 py-1 text-xs sm:text-sm text-muted-foreground backdrop-blur-sm shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
            Verified Foreign Used, Locally Used &amp; Brand New Units
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight text-foreground">
            Drive Quality. <span className="text-primary">Zero Compromise.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Search our live showroom stock in Nairobi or reserve inspected units in transit with transparent pricing.
          </p>
        </div>

        {/* State-of-the-Art Slim Search & Filter Card */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
          <HeroSearch taxonomy={taxonomy} vehicles={vehicles} />
        </div>
      </div>
    </section>
  )
}