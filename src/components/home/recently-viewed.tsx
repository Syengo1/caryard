"use client"

import { useRecentVehicles } from "@/lib/hooks/use-recent-vehicles"
import { VehicleCard } from "@/components/vehicles/vehicle-card"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { Clock } from "lucide-react"

export function RecentlyViewed({ vehicles }: { vehicles: SearchableVehicle[] }) {
  const { recentIds } = useRecentVehicles()

  if (recentIds.length === 0) return null

  // Map the local storage IDs back to actual vehicle objects, keeping the order of most recent first
  const recentVehicles = recentIds
    .map((id) => vehicles.find((v) => v.id === id))
    .filter((v): v is SearchableVehicle => v !== undefined)
    .slice(0, 4) // Show max 4 on homepage

  if (recentVehicles.length === 0) return null

  return (
    <section className="py-12 bg-muted/20 border-t">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex items-center gap-2 mb-8">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-2xl font-heading font-bold tracking-tight text-foreground">
            Recently Viewed
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentVehicles.map((vehicle) => (
            <VehicleCard key={`recent-${vehicle.id}`} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  )
}