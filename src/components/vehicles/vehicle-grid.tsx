// src/components/vehicles/vehicle-grid.tsx
"use client"

import React from "react"
import { VehicleCard } from "./vehicle-card"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { cn } from "@/lib/utils"

export interface VehicleGridProps {
  vehicles: SearchableVehicle[]
  keyPrefix?: string
  className?: string
}

export function VehicleGrid({
  vehicles,
  keyPrefix = "grid",
  className,
}: VehicleGridProps) {
  return (
    <div
      className={cn(
        // 2 columns on mobile, 3 on sm, 4 on md, 5 on lg, 6 on xl+ desktop
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 items-start justify-items-center",
        className
      )}
    >
      {vehicles.map((vehicle) => (
        <VehicleCard key={`${keyPrefix}-${vehicle.id}`} vehicle={vehicle} />
      ))}
    </div>
  )
}