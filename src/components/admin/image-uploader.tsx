'use client'

import React, { useState, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import { UploadCloud, X, Star, Image as ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { registerVehicleImage, setCoverImage, deleteVehicleImage } from '@/lib/actions/image-actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Ensure your .env.local has NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET=vehicle-images
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET || 'vehicle-images'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export interface VehicleImage {
  id: string
  storage_path: string
  is_cover: boolean
  display_order: number
}

interface ImageUploaderProps {
  vehicleId: string
  images: VehicleImage[]
  onUploadSuccess: () => void
}

export function ImageUploader({ vehicleId, images, onUploadSuccess }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const supabase = createClient()

  // Helper to get the public URL for display
  const getImageUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    const fileArray = Array.from(files)

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]

      try {
        // 1. Client-side compression to WebP
        const options = {
          maxSizeMB: 1, // Max 1MB
          maxWidthOrHeight: 1920, // 1080p-ish max dimension
          useWebWorker: true,
          fileType: 'image/webp' as const,
        }

        const compressedFile = await imageCompression(file, options)
        
        // 2. Build unique storage path
        const fileExt = 'webp'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const storagePath = `${vehicleId}/${fileName}`

        // 3. Upload to Supabase Storage directly from browser
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, compressedFile, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // 4. Register image in Postgres via Server Action
        const res = await registerVehicleImage(
          vehicleId, 
          storagePath, 
          images.length + i, 
          { width: 1920, height: 1080 } // Approximate, can be calculated exact if needed
        )

        if (!res.success) throw new Error(res.error)

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        // In a real app, you might trigger a toast notification here
      }

      setUploadProgress({ current: i + 1, total: fileArray.length })
    }

    setIsUploading(false)
    setUploadProgress(null)
    onUploadSuccess() // Trigger parent to refetch
  }, [vehicleId, images.length, supabase, onUploadSuccess])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return
    setProcessingId(imageId)
    await deleteVehicleImage(imageId)
    setProcessingId(null)
    onUploadSuccess()
  }

  const handleSetCover = async (imageId: string) => {
    setProcessingId(imageId)
    await setCoverImage(vehicleId, imageId)
    setProcessingId(null)
    onUploadSuccess()
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors bg-muted/20",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          {isUploading ? (
            <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
          ) : (
            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
          )}
          <p className="mb-2 text-sm text-muted-foreground">
            {isUploading ? (
              <span className="font-semibold">
                Uploading {uploadProgress?.current} of {uploadProgress?.total}...
              </span>
            ) : (
              <span>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP (Max 5MB each)</p>
        </div>
        
        {/* Hidden file input overlay */}
        <input
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={(e) => {
            if (e.target.files) handleUpload(e.target.files)
            e.target.value = '' // Reset input so same file can be uploaded again if needed
          }}
          disabled={isUploading}
        />
      </div>

      {/* Image Gallery Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div 
              key={img.id} 
              className={cn(
                "relative group aspect-video rounded-md overflow-hidden border bg-muted",
                processingId === img.id && "opacity-50 pointer-events-none"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getImageUrl(img.storage_path)}
                alt="Vehicle photo"
                className="object-cover w-full h-full transition-transform group-hover:scale-105"
              />
              
              {/* Top left Cover Badge */}
              {img.is_cover && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Cover
                </div>
              )}

              {/* Hover Overlay Controls */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_cover && (
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 shadow-sm"
                    onClick={() => handleSetCover(img.id)}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" /> Make Cover
                  </Button>
                )}
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="h-8 w-8 shadow-sm"
                  onClick={() => handleDelete(img.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/10">
          No images uploaded yet. A cover image is required to publish.
        </div>
      )}
    </div>
  )
}