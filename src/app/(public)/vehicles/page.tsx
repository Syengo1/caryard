// src/app/(public)/vehicles/page.tsx
import { Suspense } from "react"
import { connection } from "next/server"
import type { Metadata } from "next"
import { Loader2 } from "lucide-react"
import { getTaxonomyData } from "@/lib/queries/taxonomy"
import { getSearchableVehicles } from "@/lib/queries/vehicles"
import {
  InventoryCatalog,
  type InitialCatalogParams,
} from "@/components/vehicles/inventory-catalog"

export const metadata: Metadata = {
  title: "Browse Vehicle Inventory | MotaMotors Kenya",
  description:
    "Explore our verified inventory of foreign-used, locally-used, and brand-new cars in Nairobi. Filter by make, model, budget, and condition.",
}

async function CatalogContent({
  searchParams,
}: {
  searchParams: Promise<InitialCatalogParams>
}) {
  await connection()
  const [resolvedParams, taxonomy, vehicles] = await Promise.all([
    searchParams,
    getTaxonomyData(),
    getSearchableVehicles(),
  ])

  return (
    <InventoryCatalog
      taxonomy={taxonomy}
      vehicles={vehicles}
      initialParams={resolvedParams}
    />
  )
}

export default function InventoryPage(props: {
  searchParams: Promise<InitialCatalogParams>
}) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading showroom inventory...
            </p>
          </div>
        }
      >
        <CatalogContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}