// src/components/vehicles/vehicle-grid.tsx
"use client"

import React from "react"
import { VehicleCard } from "./vehicle-card"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { cn } from "@/lib/utils"

export interface VehicleGridProps {
  vehicles: SearchableVehicle[]
  keyPrefix?: string
  variant?: "pedestal" | "clean"
  className?: string
}

export function VehicleGrid({
  vehicles,
  keyPrefix = "grid",
  variant = "pedestal",
  className,
}: VehicleGridProps) {
  return (
    <div
      className={cn(
        // INCREASED GAPS (gap-x-10 gap-y-12) to make room for scaled-up cards
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-1 gap-y-1 items-center justify-items-center",
        className
      )}
    >
      {vehicles.map((vehicle, index) => (
        <div
          key={`${keyPrefix}-${vehicle.id}`}
          className={cn(
            "relative flex w-full items-center justify-center transition-colors duration-300",
            // ADDED SCALE HERE (e.g., scale-110 makes it 10% bigger)
            "scale-80 sm:scale-90 transform-origin-center",
            variant === "pedestal" &&
              "rounded-2xl border border-border/50 bg-gradient-to-b from-muted/35 via-muted/15 to-transparent py-5 px-3 hover:border-primary/30 hover:bg-muted/40"
          )}
        >
          {/* Subtle Top-Right Bay Index Number for Showroom Aesthetic */}
          {variant === "pedestal" && (
            <span className="pointer-events-none absolute top-2.5 right-3.5 font-mono text-[10px] font-bold tracking-widest text-muted-foreground/35 select-none">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}

          <VehicleCard vehicle={vehicle} />
        </div>
      ))}
    </div>
  )
}