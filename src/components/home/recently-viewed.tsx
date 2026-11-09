// src/components/home/recently-viewed.tsx
"use client"

import { useRecentVehicles } from "@/lib/hooks/use-recent-vehicles"
import { VehicleGrid } from "@/components/vehicles/vehicle-grid"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RecentlyViewed({ vehicles }: { vehicles: SearchableVehicle[] }) {
  const { recentIds, clearRecentVehicles } = useRecentVehicles()

  if (recentIds.length === 0) return null

  const recentVehicles = recentIds
    .map((id) => vehicles.find((v) => v.id === id))
    .filter((v): v is SearchableVehicle => v !== undefined)
    .slice(0, 6)

  if (recentVehicles.length === 0) return null

  return (
    <section className="py-14 bg-muted/20 border-y border-border/50">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
                Recently Inspected Logbooks
              </h2>
              <p className="text-xs text-muted-foreground">
                Pick up right where you left off
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearRecentVehicles}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </Button>
        </div>

        <VehicleGrid
          vehicles={recentVehicles}
          keyPrefix="recent"
        />
      </div>
    </section>
  )
}