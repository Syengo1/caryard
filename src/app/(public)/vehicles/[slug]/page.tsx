// src/app/(public)/vehicles/[slug]/page.tsx
import { Suspense } from "react"
import { connection } from "next/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ChevronRight, Home, Sparkles, ArrowUpRight, Loader2 } from "lucide-react"
import {
  getPublicVehicleBySlug,
  getSimilarVehicles,
} from "@/lib/queries/vehicles"
import { VehicleDetailClient } from "@/components/vehicles/vehicle-detail-client"
import { VehicleGrid } from "@/components/vehicles/vehicle-grid"
import { Button } from "@/components/ui/button"

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  await connection()
  const { slug } = await props.params
  const vehicle = await getPublicVehicleBySlug(slug)

  if (!vehicle) {
    return { title: "Vehicle Not Found | MotaMotors" }
  }

  const priceStr = vehicle.price_kes
    ? `KSh ${vehicle.price_kes.toLocaleString("en-KE")}`
    : "Price on Request"

  return {
    title: `${vehicle.title} (${priceStr}) | MotaMotors Showroom`,
    description:
      vehicle.description?.slice(0, 160) ||
      `Inspect this ${vehicle.year} ${vehicle.make_name} ${vehicle.model_name} at MotaMotors Nairobi. Stock #${vehicle.stock_number}.`,
  }
}

async function VehicleShowroomContent({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await connection()
  const { slug } = await params
  const vehicle = await getPublicVehicleBySlug(slug)

  if (!vehicle) {
    return notFound()
  }

  const similarVehicles = await getSimilarVehicles(vehicle, 6)

  return (
    <div className="space-y-16">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <Link
          href="/vehicles"
          className="hover:text-primary transition-colors"
        >
          Inventory
        </Link>
        {vehicle.make_name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <Link
              href={`/vehicles?make=${encodeURIComponent(vehicle.make_id)}`}
              className="hover:text-primary transition-colors"
            >
              {vehicle.make_name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="font-semibold text-foreground truncate max-w-[240px] sm:max-w-md">
          {vehicle.title}
        </span>
      </nav>

      {/* Main Online Showroom Layout */}
      <VehicleDetailClient vehicle={vehicle} />

      {/* Similar Vehicles / Recommendations Section */}
      {similarVehicles.length > 0 && (
        <section className="pt-12 border-t border-border/60 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Similar Specs &amp; Price Band
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
                Similar Vehicles You Might Like
              </h2>
              <p className="text-sm text-muted-foreground">
                Handpicked alternatives matching the body style, budget, or performance of this {vehicle.make_name} {vehicle.model_name}.
              </p>
            </div>

            <Link
              href={`/vehicles?make=${encodeURIComponent(vehicle.make_id)}`}
            >
              <Button
                variant="outline"
                className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
              >
                More {vehicle.make_name} Units
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <VehicleGrid vehicles={similarVehicles} keyPrefix="similar" />
        </section>
      )}
    </div>
  )
}

export default function VehiclePage(props: {
  params: Promise<{ slug: string }>
}) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-6 md:py-10 max-w-7xl">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Opening vehicle logbook...
            </p>
          </div>
        }
      >
        <VehicleShowroomContent params={props.params} />
      </Suspense>
    </div>
  )
}