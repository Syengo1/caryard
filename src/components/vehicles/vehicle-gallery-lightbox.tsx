// src/components/vehicles/vehicle-gallery-lightbox.tsx
"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  CarFront,
  Camera,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface GalleryImageItem {
  id: string
  url: string
  alt_text: string | null
  is_cover: boolean
}

export function VehicleGalleryLightbox({
  images,
  title,
  conditionBadge,
  statusBadge,
}: {
  images: GalleryImageItem[]
  title: string
  conditionBadge?: string | null
  statusBadge: { label: string; className: string }
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const total = images.length
  const currentImage = images[activeIndex] || null

  const handlePrev = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  const handleNext = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  useEffect(() => {
    if (!isLightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev()
      else if (e.key === "ArrowRight") handleNext()
      else if (e.key === "Escape") setIsLightboxOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isLightboxOpen, handlePrev, handleNext])

  return (
    <div className="space-y-3 select-none">
      {/* Main Showroom Stage */}
      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-md group">
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage.url}
            alt={currentImage.alt_text || title}
            onClick={() => setIsLightboxOpen(true)}
            className="w-full h-full object-cover object-center cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <CarFront className="w-14 h-14 opacity-30" />
            <span className="text-sm font-medium">No Vehicle Photos Uploaded</span>
          </div>
        )}

        {/* Top Left Status & Condition Chips */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-2 pointer-events-none">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs",
              statusBadge.className
            )}
          >
            {statusBadge.label}
          </span>
          {conditionBadge && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-black/70 text-white backdrop-blur-xs">
              {conditionBadge.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Top Right Fullscreen Button */}
        {currentImage && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/65 hover:bg-black/85 text-white px-3 py-1.5 text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Expand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        )}

        {/* Left / Right Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Bottom Right Counter */}
        {total > 0 && (
          <div className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/70 text-white px-3 py-1 text-xs font-mono backdrop-blur-xs">
            <Camera className="w-3.5 h-3.5 text-brand-red" />
            <span>
              {activeIndex + 1} / {total}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail Filmstrip */}
      {total > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {images.map((img, idx) => {
            const isSelected = idx === activeIndex
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative h-16 w-24 sm:h-20 sm:w-28 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                  isSelected
                    ? "border-primary ring-2 ring-primary/25 opacity-100 scale-[1.02]"
                    : "border-transparent opacity-65 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="w-full max-w-6xl flex items-center justify-between text-white">
            <div className="truncate pr-4">
              <p className="font-heading font-bold text-base sm:text-lg truncate">
                {title}
              </p>
              <p className="text-xs text-white/60 font-mono">
                Image {activeIndex + 1} of {total}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="rounded-full bg-white/10 hover:bg-white/20 p-2.5 text-white transition-colors cursor-pointer"
              aria-label="Close fullscreen gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative flex-1 w-full max-w-6xl flex items-center justify-center my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage.url}
              alt={currentImage.alt_text || title}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {total > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto max-w-4xl pb-2"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={`lb-${img.id}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "h-12 w-18 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                    idx === activeIndex
                      ? "border-brand-red scale-105"
                      : "border-transparent opacity-50 hover:opacity-90"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}