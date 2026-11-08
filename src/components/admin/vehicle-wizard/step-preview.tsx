// src/components/admin/vehicle-wizard/step-preview.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { AlertCircle, MapPin, Gauge, Fuel, Info, Palette } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { TaxonomyData } from "./wizard-shell"
import type { VehicleImage } from "@/components/admin/image-uploader"

export function StepPreview({ taxonomy }: { taxonomy: TaxonomyData }) {
  const { watch } = useFormContext()
  const data = watch()

  const formatCurrency = (amount?: number | null) =>
    amount
      ? new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          maximumFractionDigits: 0,
        }).format(Number(amount))
      : "TBD"

  // FIXED: Added String() cast to prevent TS2367 while still catching empty form values
  const formatNumber = (num?: number | null) =>
    num !== undefined && num !== null && String(num).trim() !== ""
      ? new Intl.NumberFormat("en-US").format(Number(num))
      : "0"

  const makeName = taxonomy.makes.find((m) => m.id === data.make_id)?.name || "Unknown Make"
  const modelName = taxonomy.models.find((m) => m.id === data.model_id)?.name || "Unknown Model"
  const showroomName =
    taxonomy.showrooms.find((s) => s.id === data.showroom_id)?.name || "Unassigned Location"

  const coverImage = (data.images as VehicleImage[] | undefined)?.find((img) => img.is_cover)
  const coverUrl = coverImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET || "vehicle-images"}/${coverImage.storage_path}`
    : null

  // Exact checklist matching publishVehicleSchema & vehicles_publish_completeness_check
  const missingRequirements: string[] = []
  
  if (!data.make_id || !data.model_id || !data.year) missingRequirements.push("Make, Model & Year (Step 1)")
  if (!data.transmission) missingRequirements.push("Transmission (Step 1)")
  if (!data.fuel) missingRequirements.push("Fuel Type (Step 1)")
  if (!data.drive) missingRequirements.push("Drive Type (Step 1)")
  if (!data.price_kes || Number(data.price_kes) < 100_000) missingRequirements.push("Price ≥ KSh 100,000 (Step 3)")
  
  // FIXED: Cast to String to avoid TS2367 overlap error while retaining runtime safety
  if (data.mileage_km === undefined || data.mileage_km === null || String(data.mileage_km).trim() === "" || Number(data.mileage_km) < 0) {
    missingRequirements.push("Mileage (Step 3)")
  }
  
  if (!data.condition) missingRequirements.push("Vehicle Condition (Step 3)")
  if (!data.showroom_id) missingRequirements.push("Showroom Location (Step 3)")
  if (!coverImage) missingRequirements.push("Designated Cover Photo (Step 4)")
  if (!data.title || String(data.title).trim().length < 5) missingRequirements.push("Listing Title ≥ 5 chars (Step 5)")
  if (!data.description || String(data.description).trim().length < 20) {
    missingRequirements.push("Public Description ≥ 20 chars (Step 5)")
  }

  const isPublishReady = missingRequirements.length === 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-heading font-semibold">Review & Publish</h2>
        <p className="text-sm text-muted-foreground">
          Verify the listing details before making it public.
        </p>
      </div>

      {!isPublishReady && (
        <Alert variant="destructive" className="bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Required Information for Publishing</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Please complete the following before publishing to the live storefront:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              {missingRequirements.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm max-w-2xl">
        <div className="aspect-[16/9] w-full bg-muted relative flex items-center justify-center">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <span>No Cover Image Selected</span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <Badge className="bg-primary/90 hover:bg-primary">
              {data.year} • {makeName} {modelName}
            </Badge>
            {data.condition && (
              <Badge variant="secondary" className="capitalize">
                {String(data.condition).replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-2xl font-heading font-bold text-foreground line-clamp-1">
              {data.title || `${data.year || ""} ${makeName} ${modelName}`.trim()}
            </h3>
            <p className="text-2xl font-semibold text-primary mt-1">
              {formatCurrency(data.price_kes)}
              {data.is_negotiable && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Negotiable)
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Gauge className="w-3 h-3 mr-1" /> Mileage
              </span>
              <p className="font-medium text-sm">{formatNumber(data.mileage_km)} km</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Fuel className="w-3 h-3 mr-1" /> Fuel
              </span>
              <p className="font-medium text-sm capitalize">
                {data.fuel ? String(data.fuel).replace("_", " ") : "--"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Info className="w-3 h-3 mr-1" /> Trans.
              </span>
              <p className="font-medium text-sm capitalize">{data.transmission || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Info className="w-3 h-3 mr-1" /> Drive
              </span>
              <p className="font-medium text-sm uppercase">{data.drive || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Gauge className="w-3 h-3 mr-1" /> Engine
              </span>
              <p className="font-medium text-sm">
                {data.engine_cc ? `${data.engine_cc} CC` : "--"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Palette className="w-3 h-3 mr-1" /> Exterior
              </span>
              <p className="font-medium text-sm capitalize">{data.exterior_color || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <Palette className="w-3 h-3 mr-1" /> Interior
              </span>
              <p className="font-medium text-sm capitalize">{data.interior_color || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" /> Location
              </span>
              <p className="font-medium text-sm truncate">{showroomName}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Key Features</h4>
            <div className="flex flex-wrap gap-2">
              {data.features?.horsepower && (
                <Badge variant="secondary">{data.features.horsepower}</Badge>
              )}
              {data.features?.seat_capacity && (
                <Badge variant="secondary">{data.features.seat_capacity} Seats</Badge>
              )}
              {data.features?.upholstery && (
                <Badge variant="secondary">{data.features.upholstery}</Badge>
              )}
              {data.features?.additional_features?.map((f: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Description Preview</h4>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {data.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}