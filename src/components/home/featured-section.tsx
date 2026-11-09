// src/components/home/featured-section.tsx
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { VehicleGrid } from "@/components/vehicles/vehicle-grid"
import { Button } from "@/components/ui/button"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { cn } from "@/lib/utils"

type TabFilter = "all" | "foreign_used" | "locally_used"

export function FeaturedSection({ vehicles }: { vehicles: SearchableVehicle[] }) {
  const [activeTab, setActiveTab] = useState<TabFilter>("all")

  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      foreign_used: vehicles.filter((v) => v.condition === "foreign_used").length,
      locally_used: vehicles.filter((v) => v.condition === "locally_used").length,
    }
  }, [vehicles])

  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles]

    if (activeTab !== "all") {
      filtered = filtered.filter((v) => v.condition === activeTab)
    }

    return filtered
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      .slice(0, 12)
  }, [vehicles, activeTab])

  const tabs: { id: TabFilter; label: string; count: number }[] = [
    { id: "all", label: "All Units", count: counts.all },
    { id: "foreign_used", label: "Fresh Imports", count: counts.foreign_used },
    { id: "locally_used", label: "Locally Used", count: counts.locally_used },
  ]

  return (
    <section className="relative py-16 md:py-24 bg-background overflow-hidden">
      {/* Subtle ambient showroom lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-64 bg-primary/[0.03] blur-3xl rounded-full" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 max-w-7xl space-y-10">
        {/* Header & Interactive Pill Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border/60 pb-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Showroom Logbooks
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground">
              Featured Inventory
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Hover or tap any vehicle logbook to inspect its verified specification sheet and pricing.
            </p>
          </div>

          {/* Filter Tabs with Live Counts */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-muted/70 border border-border/70 overflow-x-auto max-w-full self-start lg:self-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      isActive
                        ? "bg-brand-red text-brand-red-foreground font-bold"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Showroom Pedestal Grid */}
        {filteredVehicles.length > 0 ? (
          <VehicleGrid
            vehicles={filteredVehicles}
            keyPrefix="featured"
          />
        ) : (
          <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
            <p className="text-muted-foreground font-medium">
              No vehicles found for this category at the moment.
            </p>
          </div>
        )}

        {/* Bottom CTA Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border bg-muted/25 px-6 py-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Looking for a specific make, model, or custom direct import? Browse our complete catalog.
          </p>
          <Link href="/vehicles">
            <Button variant="default" className="rounded-full px-6 font-semibold shadow-sm">
              View All Inventory
              <ArrowUpRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}