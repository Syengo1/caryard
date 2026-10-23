"use client"

import { useEffect, useState, useCallback } from "react"
import { useFormContext } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { ImageUploader, type VehicleImage } from "@/components/admin/image-uploader"
import { createClient } from "@/lib/supabase/client"

export function StepPhotos({ vehicleId }: { vehicleId: string | null }) {
  const { setValue } = useFormContext()
  const [dbImages, setDbImages] = useState<VehicleImage[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Initial Load Effect
  useEffect(() => {
    if (!vehicleId) return
    
    let isMounted = true
    const supabase = createClient()
    
    const loadInitialImages = async () => {
      const { data } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("display_order", { ascending: true })
      
      if (isMounted && data) {
        setDbImages(data as VehicleImage[])
        setValue("images", data)
        setLoading(false)
      }
    }
    
    loadInitialImages()
    
    return () => { isMounted = false }
  }, [vehicleId, setValue])

  // 2. Refetch function triggered after an image is uploaded/deleted
  const handleImagesChanged = useCallback(async () => {
    if (!vehicleId) return
    
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("display_order", { ascending: true })
    
    if (data) {
      setDbImages(data as VehicleImage[])
      setValue("images", data)
    }
    setLoading(false)
  }, [vehicleId, setValue])

  if (!vehicleId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Saving vehicle draft to generate image bucket pathway...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h2 className="text-xl font-heading font-semibold">Photo Gallery</h2>
        <p className="text-sm text-muted-foreground">
          Upload up to 20 images. The first image will automatically be designated as the cover photo.
        </p>
      </div>

      {loading && dbImages.length === 0 ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <ImageUploader 
          vehicleId={vehicleId} 
          images={dbImages} 
          onUploadSuccess={handleImagesChanged} 
        />
      )}
    </div>
  )
}