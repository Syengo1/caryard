"use client"

import { useState, useMemo } from "react"
import { VehicleCard } from "@/components/vehicles/vehicle-card"
import type { SearchableVehicle } from "@/lib/utils/vehicle-search"
import { cn } from "@/lib/utils"

type TabFilter = 'all' | 'foreign_used' | 'locally_used'

export function FeaturedSection({ vehicles }: { vehicles: SearchableVehicle[] }) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all')

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles
    
    if (activeTab !== 'all') {
      filtered = vehicles.filter(v => v.condition === activeTab)
    }

    // Sort to show Featured vehicles first, then newest
    return filtered
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
      .slice(0, 8) // Show top 8 results
  }, [vehicles, activeTab])

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-foreground">
              Featured Inventory
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Handpicked deals and fresh arrivals inspected to our highest standards.
            </p>
          </div>

          {/* Pill Tabs */}
          <div className="inline-flex items-center p-1 rounded-full bg-muted/50 border overflow-x-auto hide-scrollbar self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeTab === 'all' 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All Cars
            </button>
            <button
              onClick={() => setActiveTab('foreign_used')}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeTab === 'foreign_used' 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Fresh Imports
            </button>
            <button
              onClick={() => setActiveTab('locally_used')}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeTab === 'locally_used' 
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              Locally Used Cars
            </button>
          </div>
        </div>

        {/* Vehicle Grid */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={`featured-${vehicle.id}`} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-2xl">
            <p className="text-muted-foreground font-medium">No vehicles found for this category at the moment.</p>
          </div>
        )}

      </div>
    </section>
  )
}