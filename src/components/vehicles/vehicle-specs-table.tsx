// src/components/vehicles/vehicle-specs-table.tsx
import React from "react"
import {
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Compass,
  Zap,
  CarFront,
  Palette,
  FileCheck2,
  Users,
  Armchair,
  Sparkles,
} from "lucide-react"
import type { PublicVehicleDetail } from "@/lib/queries/vehicles"

export function VehicleSpecsTable({ vehicle }: { vehicle: PublicVehicleDetail }) {
  const f = vehicle.features || {}

  const coreSpecs = [
    {
      label: "Year of Manufacture",
      value: vehicle.year,
      icon: Calendar,
    },
    {
      label: "Mileage",
      value:
        vehicle.mileage_km !== null
          ? `${vehicle.mileage_km.toLocaleString()} km`
          : "Verified on Request",
      icon: Gauge,
    },
    {
      label: "Engine Displacement",
      value: vehicle.engine_cc ? `${vehicle.engine_cc.toLocaleString()} cc` : "N/A",
      icon: Zap,
    },
    {
      label: "Transmission",
      value: vehicle.transmission || "Automatic",
      icon: Settings2,
      capitalize: true,
    },
    {
      label: "Fuel Type",
      value: vehicle.fuel ? vehicle.fuel.replace(/_/g, " ") : "Petrol",
      icon: Fuel,
      capitalize: true,
    },
    {
      label: "Drivetrain",
      value: vehicle.drive || "2WD",
      icon: Compass,
    },
    {
      label: "Body Type",
      value: vehicle.body_type || "SUV / Saloon",
      icon: CarFront,
    },
    {
      label: "Condition",
      value: vehicle.condition
        ? vehicle.condition.replace(/_/g, " ")
        : "Foreign Used",
      icon: Sparkles,
      capitalize: true,
    },
    {
      label: "Exterior Color",
      value: vehicle.exterior_color || "Factory Finish",
      icon: Palette,
    },
    {
      label: "Interior Trim",
      value: vehicle.interior_color || f.upholstery || "Standard Trim",
      icon: Armchair,
    },
    {
      label: "Seating Capacity",
      value: f.seat_capacity ? `${f.seat_capacity} Seats` : "5 Seats",
      icon: Users,
    },
    {
      label: "Duty Status",
      value: f.duty_status || "Duty Paid",
      icon: FileCheck2,
    },
  ]

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
            Technical Logbook Specifications
          </h2>
          <p className="text-xs text-muted-foreground">
            Verified mechanical and trim details for Stock #{vehicle.stock_number}
          </p>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">
          #{vehicle.stock_number}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {coreSpecs.map((spec) => (
          <div
            key={spec.label}
            className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col justify-between gap-2"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <spec.icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{spec.label}</span>
            </div>
            <p
              className={`font-heading font-bold text-sm text-foreground truncate ${
                spec.capitalize ? "capitalize" : ""
              }`}
            >
              {spec.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}