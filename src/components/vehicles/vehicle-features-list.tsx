// src/components/vehicles/vehicle-features-list.tsx
import React from "react"
import { CheckCircle2, Gauge } from "lucide-react"
import type { PublicVehicleDetail } from "@/lib/queries/vehicles"

export function VehicleFeaturesList({
  features,
}: {
  features: PublicVehicleDetail["features"]
}) {
  const performanceMetrics = [
    { label: "Horsepower", value: features?.horsepower },
    { label: "Torque", value: features?.torque },
    { label: "0–100 km/h", value: features?.zero_to_hundred },
    { label: "Fuel Efficiency", value: features?.fuel_efficiency },
    { label: "Ground Clearance", value: features?.ground_clearance },
    { label: "Towing Capacity", value: features?.towing_capacity },
    { label: "Cargo Space", value: features?.cargo_space },
    { label: "Climate Control", value: features?.climate_control },
    { label: "Infotainment", value: features?.infotainment },
    { label: "Sound System", value: features?.sound_system },
    { label: "Interior Lighting", value: features?.interior_lighting },
    { label: "Upholstery", value: features?.upholstery },
  ].filter((item) => Boolean(item.value))

  const additional = features?.additional_features || []

  if (performanceMetrics.length === 0 && additional.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-6">
      {performanceMetrics.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-heading font-bold text-foreground">
              Performance, Comfort &amp; Cabin Metrics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {performanceMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-background px-3.5 py-2.5 text-sm"
              >
                <span className="text-muted-foreground text-xs font-medium">
                  {metric.label}
                </span>
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {additional.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          <h4 className="text-sm font-heading font-bold uppercase tracking-wider text-muted-foreground">
            Equipped Highlights &amp; Extras
          </h4>
          <div className="flex flex-wrap gap-2">
            {additional.map((feat, idx) => (
              <span
                key={`${feat}-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}