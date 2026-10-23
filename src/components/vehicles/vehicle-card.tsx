"use client"

import Link from "next/link"
import { Gauge, Fuel, Settings2, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getVehicleCoverUrl, type SearchableVehicle } from "@/lib/utils/vehicle-search"

export function VehicleCard({ vehicle }: { vehicle: SearchableVehicle }) {
  const coverUrl = getVehicleCoverUrl(vehicle.cover_image_path)
  
  const displayTitle = vehicle.title || `${vehicle.year} ${vehicle.make_name} ${vehicle.model_name}`.trim()
  
  const formatPriceKES = (price: number | null) => {
    if (!price) return "Price on Request"
    return `KSh ${price.toLocaleString("en-KE")}`
  }

  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group flex flex-col bg-card rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={coverUrl} 
            alt={displayTitle} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-medium bg-secondary/50">
            No Image
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {vehicle.inventory_status === "in_stock" && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent shadow-sm">
              In Stock
            </Badge>
          )}
          {vehicle.is_featured && (
            <Badge className="bg-primary hover:bg-primary text-white border-transparent shadow-sm">
              Featured
            </Badge>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
        </div>

        <p className="text-xl font-bold text-primary mb-4">
          {formatPriceKES(vehicle.price_kes)}
        </p>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-muted-foreground mt-auto mb-5 pb-5 border-b border-border/50">
          <div className="flex items-center gap-1.5 truncate">
            <Gauge className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString()} km` : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Fuel className="w-3.5 h-3.5 shrink-0" />
            <span className="capitalize truncate">{vehicle.fuel ? vehicle.fuel.replace("_", " ") : "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Settings2 className="w-3.5 h-3.5 shrink-0" />
            <span className="capitalize truncate">{vehicle.transmission || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-[10px] uppercase tracking-wider shrink-0 bg-muted px-1 rounded">Year</span>
            <span className="truncate">{vehicle.year}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          <span>View Details</span>
          <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}