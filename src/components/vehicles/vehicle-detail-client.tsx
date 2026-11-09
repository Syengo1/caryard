// src/components/vehicles/vehicle-detail-client.tsx
"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  ShieldCheck,
  CalendarCheck,
  Repeat,
  Clock,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { useRecentVehicles } from "@/lib/hooks/use-recent-vehicles"
import { logLeadEventAction } from "@/lib/actions/lead-actions"
import { VehicleGalleryLightbox } from "./vehicle-gallery-lightbox"
import { VehicleSpecsTable } from "./vehicle-specs-table"
import { VehicleFeaturesList } from "./vehicle-features-list"
import { FinanceEstimator } from "./finance-estimator"
import { InquiryModal, type InquiryLeadType } from "./inquiry-modal"
import { Button } from "@/components/ui/button"
import type { PublicVehicleDetail } from "@/lib/queries/vehicles"

export function VehicleDetailClient({
  vehicle,
}: {
  vehicle: PublicVehicleDetail
}) {
  const { addRecentVehicle } = useRecentVehicles()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<InquiryLeadType>("general_inquiry")
  const [financePlan, setFinancePlan] = useState<{
    depositKes: number
    months: number
    monthlyInstallmentKes: number
  } | null>(null)

  // Register vehicle in localStorage for Homepage <RecentlyViewed />
  useEffect(() => {
    addRecentVehicle(vehicle.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id])

  const formatStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return {
          label: "In Stock • Ready for Viewing",
          className: "bg-brand-green text-brand-green-foreground",
        }
      case "in_transit":
        return {
          label: "In Transit • Reserve Now",
          className: "bg-amber-600 text-white",
        }
      case "reserved":
        return {
          label: "Reserved",
          className: "bg-secondary text-secondary-foreground",
        }
      case "sold":
        return {
          label: "Sold",
          className: "bg-primary text-primary-foreground",
        }
      default:
        return { label: status, className: "bg-secondary text-secondary-foreground" }
    }
  }

  const handleWhatsAppClick = () => {
    logLeadEventAction({
      vehicle_id: vehicle.id,
      event_type: "whatsapp_click",
      source_path: `/vehicles/${vehicle.slug}`,
    })

    const rawPhone = vehicle.financeSettings.primaryWhatsapp.replace(/\D/g, "")
    const cleanPhone = rawPhone.startsWith("0")
      ? `254${rawPhone.slice(1)}`
      : rawPhone

    const priceText = vehicle.price_kes
      ? `KSh ${vehicle.price_kes.toLocaleString("en-KE")}`
      : "Price on Request"

    const text = `Hello ${vehicle.financeSettings.businessName}, I am interested in the *${vehicle.title}* (Stock #${vehicle.stock_number}) listed at *${priceText}*. Is it available for viewing?`
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  const handleShare = async () => {
    logLeadEventAction({
      vehicle_id: vehicle.id,
      event_type: "share_click",
      source_path: `/vehicles/${vehicle.slug}`,
    })
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: vehicle.title, url })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success("Vehicle link copied to clipboard!")
  }

  const openInquiry = (tab: InquiryLeadType) => {
    setModalTab(tab)
    setModalOpen(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =================================================================
            LEFT COLUMN (lg:col-span-7): GALLERY, DESCRIPTION, SPECS, FEATURES
        ================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          <VehicleGalleryLightbox
            images={vehicle.images}
            title={vehicle.title}
            conditionBadge={vehicle.condition}
            statusBadge={formatStatusBadge(vehicle.inventory_status)}
          />

          {/* Showroom Narrative Description */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-3">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
              Vehicle Overview &amp; Inspection Notes
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
              {vehicle.description ||
                `This ${vehicle.year} ${vehicle.make_name} ${vehicle.model_name} has undergone our comprehensive multi-point mechanical and bodywork inspection. Available for immediate viewing and test drive at our showroom.`}
            </p>

            {vehicle.categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
                {vehicle.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/vehicles?category=${encodeURIComponent(cat.slug)}`}
                    className="rounded-full bg-muted hover:bg-primary/10 hover:text-primary px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors"
                  >
                    #{cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Technical Logbook Specifications Grid */}
          <VehicleSpecsTable vehicle={vehicle} />

          {/* Performance & Equipped Extras */}
          <VehicleFeaturesList features={vehicle.features} />
        </div>

        {/* =================================================================
            RIGHT COLUMN (lg:col-span-5): STICKY ONLINE SHOWROOM CONCIERGE
        ================================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-[84px] space-y-6">
          {/* Primary Pricing & Action Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-md space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                  <span>{vehicle.year}</span>
                  <span>•</span>
                  <Link
                    href={`/vehicles?make=${encodeURIComponent(vehicle.make_id)}`}
                    className="hover:underline"
                  >
                    {vehicle.make_name}
                  </Link>
                  <span>•</span>
                  <span className="font-mono text-muted-foreground">
                    #{vehicle.stock_number}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground leading-tight">
                  {vehicle.title}
                </h1>
              </div>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share vehicle"
                className="p-2.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Price Box */}
            <div className="rounded-xl bg-muted/50 border border-border/60 p-4 flex items-baseline justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Showroom Guide Price
                </p>
                <p className="text-2xl sm:text-3xl font-heading font-extrabold text-primary mt-0.5">
                  {vehicle.price_kes
                    ? `KSh ${vehicle.price_kes.toLocaleString("en-KE")}`
                    : "Price on Request"}
                </p>
              </div>
              {vehicle.is_negotiable && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  Negotiable
                </span>
              )}
            </div>

            {/* Primary CTAs */}
            <div className="space-y-2.5">
              <Button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Inquire via WhatsApp
              </Button>

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openInquiry("test_drive")}
                  className="h-11 rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4 mr-1.5" />
                  Book Test Drive
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openInquiry("trade_in")}
                  className="h-11 rounded-xl font-semibold border-brand-red/30 text-secondary-foreground bg-secondary/40 hover:bg-brand-red hover:text-brand-red-foreground cursor-pointer"
                >
                  <Repeat className="w-4 h-4 mr-1.5" />
                  Trade-In Car
                </Button>
              </div>
            </div>

            {/* Showroom Location Card */}
            {vehicle.showroom && (
              <div className="pt-4 border-t border-border/60 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="font-heading font-bold text-foreground">
                        {vehicle.showroom.name} ({vehicle.showroom.city})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.showroom.address}
                      </p>
                    </div>
                  </div>
                  {vehicle.showroom.google_maps_url && (
                    <a
                      href={vehicle.showroom.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                    >
                      <span>Map</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {vehicle.showroom.opening_hours && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>{vehicle.showroom.opening_hours}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`tel:${vehicle.financeSettings.primaryPhone}`}
                    onClick={() =>
                      logLeadEventAction({
                        vehicle_id: vehicle.id,
                        event_type: "phone_click",
                        source_path: `/vehicles/${vehicle.slug}`,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>Call Showroom: {vehicle.financeSettings.primaryPhone}</span>
                  </a>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" /> NTSA Verified
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Financing Calculator */}
          <FinanceEstimator
            priceKes={vehicle.price_kes}
            minDepositPct={vehicle.financeSettings.minDepositPct}
            defaultMonths={vehicle.financeSettings.defaultMonths}
            annualInterestPct={vehicle.financeSettings.annualInterestPct}
            onApplyFinancing={(plan) => {
              setFinancePlan(plan)
              openInquiry("financing")
            }}
          />
        </div>
      </div>

      {/* Lead Capture Modal */}
      <InquiryModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vehicleId={vehicle.id}
        vehicleTitle={vehicle.title}
        stockNumber={vehicle.stock_number}
        defaultTab={modalTab}
        prefilledFinance={financePlan}
      />
    </>
  )
}