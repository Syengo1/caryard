import { Suspense } from "react"
import { connection } from "next/server"
import { getTaxonomyData } from "@/lib/queries/taxonomy"
import { getSearchableVehicles } from "@/lib/queries/vehicles"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedSection } from "@/components/home/featured-section"
import { RecentlyViewed } from "@/components/home/recently-viewed"

async function HomeContent() {
  await connection()
  const [taxonomy, vehicles] = await Promise.all([
    getTaxonomyData(),
    getSearchableVehicles(),
  ])

  return (
    <>
      {/* 1. Hero & Smart Search */}
      <HeroSection taxonomy={taxonomy} vehicles={vehicles} />
      
      {/* 2. Stealth History Tracker (Only shows if localStorage has items) */}
      <RecentlyViewed vehicles={vehicles} />
      
      {/* 3. Tabbed Shop Experience */}
      <FeaturedSection vehicles={vehicles} />
    </>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-24 max-w-6xl">
            <div className="h-[340px] w-full rounded-[28px] bg-muted/40 animate-pulse border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 w-full rounded-2xl bg-muted/40 animate-pulse border" />
              ))}
            </div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </div>
  )
}