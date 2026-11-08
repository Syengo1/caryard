// src/components/vehicles/vehicle-card.tsx
"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useInView, type Transition } from "framer-motion"
import {
  Gauge,
  Fuel,
  Settings2,
  CarFront,
  MapPin,
  Compass,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getVehicleCoverUrl, type SearchableVehicle } from "@/lib/utils/vehicle-search"

const SPRING_TRANSITION: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
  delay: 0,
}

export interface VehicleCardProps {
  vehicle: SearchableVehicle
  ctaText?: string
  onClick?: () => void
}

export function VehicleCard({
  vehicle,
  ctaText,
  onClick,
}: VehicleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchPressed, setIsTouchPressed] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch-primary devices (phones, foldables, tablets)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)")
    const updateTouchStatus = () => setIsTouchDevice(mediaQuery.matches)

    updateTouchStatus()
    mediaQuery.addEventListener("change", updateTouchStatus)
    return () => mediaQuery.removeEventListener("change", updateTouchStatus)
  }, [])

  // Trigger partial open animation when 60% of the card is in the mobile viewport
  const isInView = useInView(cardRef, {
    amount: 0.6,
    margin: "-8% 0px -8% 0px",
  })

  const activeVariant = isTouchDevice
    ? isTouchPressed
      ? "hover"
      : isInView
        ? "mobilePeek"
        : "default"
    : isHovered
      ? "hover"
      : "default"

  const isElevated = isHovered || isTouchPressed

  // Keep 13-character length for consistent vertical label centering
  const resolvedCtaText = ctaText ?? (isTouchDevice ? "TAP TO VIEW ->" : "CLICK TO VIEW")

  const displayTitle =
    vehicle.title ||
    `${vehicle.year} ${vehicle.make_name} ${vehicle.model_name}`.trim()

  const coverUrl = getVehicleCoverUrl(vehicle.cover_image_path)

  const formatPriceKES = (price: number | null) =>
    price ? `KSh ${price.toLocaleString("en-KE")}` : "Price on Request"

  const formatCondition = (condition: string | null) => {
    if (!condition) return "Inspected"
    return condition.replace(/_/g, " ")
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "in_stock":
        return { label: "In Stock", color: "bg-emerald-600 text-white" }
      case "in_transit":
        return { label: "In Transit", color: "bg-amber-500 text-white" }
      case "reserved":
        return { label: "Reserved", color: "bg-blue-600 text-white" }
      case "sold":
        return { label: "Sold", color: "bg-rose-600 text-white" }
      default:
        return { label: status.replace(/_/g, " "), color: "bg-slate-700 text-white" }
    }
  }

  const statusBadge = formatStatus(vehicle.inventory_status)

  // Dynamic logbook dossier text for Layer 3 (Back Page) using safe ASCII middot (\u00B7)
  const specSummaryUnit = [
    displayTitle,
    `Stock #${vehicle.stock_number || "N/A"}`,
    `Price: ${formatPriceKES(vehicle.price_kes)}`,
    vehicle.mileage_km !== null ? `Mileage: ${vehicle.mileage_km.toLocaleString()} km` : null,
    vehicle.engine_cc ? `Engine: ${vehicle.engine_cc}cc` : null,
    vehicle.transmission ? `Transmission: ${vehicle.transmission}` : null,
    vehicle.fuel ? `Fuel: ${vehicle.fuel.replace(/_/g, " ")}` : null,
    vehicle.drive ? `Drivetrain: ${vehicle.drive}` : null,
    vehicle.condition ? `Condition: ${formatCondition(vehicle.condition)}` : null,
    vehicle.showroom_city ? `Location: ${vehicle.showroom_city}` : null,
  ]
    .filter(Boolean)
    .join(" \u00B7 ")

  const backText = `${specSummaryUnit}. `.repeat(10).trim()

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      onClick={onClick}
      className={cn(
        // Fixed 284x384 stage pre-allocates the 28px right fan-out & 20px vertical 3D projection
        // so opening the card NEVER changes layout bounds or collides with neighbors.
        "group relative isolate block h-[384px] w-[284px] max-w-full mx-auto select-none focus:outline-none",
        isElevated ? "z-30" : "z-10"
      )}
    >
      <motion.div
        ref={cardRef}
        className="relative h-[384px] w-[284px] cursor-pointer select-none"
        onMouseEnter={() => {
          if (!isTouchDevice) setIsHovered(true)
        }}
        onMouseLeave={() => {
          if (!isTouchDevice) setIsHovered(false)
        }}
        onTouchStart={() => setIsTouchPressed(true)}
        onTouchEnd={() => setIsTouchPressed(false)}
        onTouchCancel={() => setIsTouchPressed(false)}
        initial="default"
        animate={activeVariant}
      >
        {/* Subtle ground shadow pedestal that reacts when the logbook opens */}
        <div
          className={cn(
            "pointer-events-none absolute bottom-1 left-2 right-3 h-6 rounded-full bg-black/10 dark:bg-black/40 blur-xl transition-all duration-300",
            (activeVariant === "hover" || activeVariant === "mobilePeek") &&
              "translate-x-2 scale-x-105 bg-[#178BFF]/20 dark:bg-[#178BFF]/25"
          )}
        />

        {/* 3D Book Stage (256px x 364px anchored at top-[8px] left-[2px], leaving 26px right clearance) */}
        <div
          className="
            
            absolute left-[2px] top-[8px] h-[364px] w-[256px] overflow-visible
          "
          style={{
            perspective: "1500px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* =========================================================
              LAYER 1: FRONT COVER - z-index: 4
              Dimensions: 256px x 364px
          ========================================================= */}
          <motion.div
            className="relative z-[4] flex h-[364px] w-[256px] flex-none flex-col items-start justify-between overflow-clip rounded-[10px] bg-[#ECF2EE] dark:bg-zinc-900 p-[15px] will-change-transform border border-black/[0.08] dark:border-white/10 shadow-md"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { z: 1, rotateY: -1 },
              mobilePeek: { z: 1, rotateY: -20 },
              hover: { z: 1, rotateY: -34 },
            }}
            transition={SPRING_TRANSITION}
          >
            {/* 1. TOP HEADER ROW: LOGBOOK Badge + Stock Number & Status Pill */}
            <div className="flex w-full items-center justify-between gap-1.5">
              <div className="flex flex-row items-center gap-[4px] min-w-0">
                <svg
                  viewBox="0 0 11.957 12"
                  className="h-[11px] w-[11px] shrink-0 overflow-visible"
                  aria-hidden="true"
                >
                  <path
                    d="M 7.885 0.006 C 7.713 -0.019 7.538 0.033 7.407 0.15 C 7.275 0.267 7.2 0.437 7.2 0.615 L 7.2 4.265 C 7.2 4.605 7.469 4.88 7.8 4.88 L 11.358 4.88 C 11.532 4.88 11.697 4.802 11.811 4.668 C 11.925 4.533 11.976 4.354 11.951 4.177 C 11.647 2.016 9.992 0.319 7.885 0.006 Z"
                    fill="rgb(125, 157, 179)"
                  />
                  <path
                    d="M 5.4 0.923 C 2.418 0.923 0 3.403 0 6.462 C 0 9.52 2.418 12 5.4 12 C 8.382 12 10.8 9.52 10.8 6.462 C 10.8 6.122 10.531 5.846 10.2 5.846 L 6 5.846 L 6 1.538 C 6 1.199 5.731 0.923 5.4 0.923 Z"
                    fill="rgb(125, 157, 179)"
                  />
                </svg>
                <p className="text-[9.5px] font-extrabold leading-none tracking-[-0.03em] text-[#647F92] dark:text-slate-400 uppercase">
                  LOGBOOK
                </p>
                {vehicle.stock_number && (
                  <span className="truncate text-[9.5px] font-mono font-semibold text-[#647F92]/85 dark:text-slate-400/80">
                    {"\u00B7"} {vehicle.stock_number}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {vehicle.is_featured && (
                  <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-amber-500/15 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-2.5 w-2.5" /> Hot
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-tight ${statusBadge.color}`}
                >
                  {vehicle.inventory_status === "in_stock" ? (
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  ) : (
                    <Clock className="h-2.5 w-2.5" />
                  )}
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* 2. COVER IMAGE BLOCK */}
            <div className="relative mt-[8px] h-[136px] w-full shrink-0 overflow-hidden rounded-[6px] bg-[#D3DACD]/70 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/5">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={displayTitle}
                  className="block h-full w-full object-cover object-center"
                  draggable={false}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#748FA1]">
                  <CarFront className="h-7 w-7 opacity-50" />
                  <span className="text-[9.5px] font-semibold uppercase tracking-wider">
                    No Cover Photo
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

              {vehicle.condition && (
                <span className="absolute bottom-1.5 left-1.5 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[8.5px] font-semibold capitalize tracking-tight text-white backdrop-blur-xs">
                  {formatCondition(vehicle.condition)}
                </span>
              )}

              {vehicle.showroom_city && (
                <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-[4px] bg-white/95 px-1.5 py-0.5 text-[8.5px] font-bold tracking-tight text-zinc-900 shadow-2xs">
                  <MapPin className="h-2.5 w-2.5 text-[#178BFF]" />
                  {vehicle.showroom_city}
                </span>
              )}
            </div>

            {/* 3. VEHICLE HEADLINE & KEY SPECS BELOW IMAGE */}
            <div className="mt-[10px] flex w-full flex-1 flex-col justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] font-bold tracking-[-0.02em] text-[#647F92] dark:text-slate-400">
                  <span className="truncate">
                    {vehicle.year} {"\u00B7"} {vehicle.make_name || "Vehicle"}
                  </span>
                  {vehicle.body_type && (
                    <span className="shrink-0 rounded bg-[#D3DACD]/80 dark:bg-zinc-800 px-1.5 py-0.2 text-[8.5px] font-semibold text-zinc-800 dark:text-zinc-300">
                      {vehicle.body_type}
                    </span>
                  )}
                </div>

                <h3 className="line-clamp-2 text-[16.5px] font-bold leading-[1.2em] tracking-[-0.03em] text-[#178BFF] dark:text-[#3B9EFF]">
                  {displayTitle}
                </h3>
              </div>

              {/* 4-Pill Specs Grid with High-Contrast Text & Icons */}
              <div className="my-[8px] grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-[6px] bg-white/80 dark:bg-zinc-800/80 px-2.5 py-2 text-[10.5px] font-semibold tracking-[-0.01em] text-zinc-800 dark:text-zinc-200 border border-black/[0.04] dark:border-white/5">
                <div className="flex items-center gap-1.5 truncate">
                  <Gauge className="h-3.5 w-3.5 shrink-0 text-[#178BFF]" />
                  <span className="truncate">
                    {vehicle.mileage_km !== null
                      ? `${vehicle.mileage_km.toLocaleString()} km`
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Settings2 className="h-3.5 w-3.5 shrink-0 text-[#178BFF]" />
                  <span className="capitalize truncate">
                    {vehicle.transmission || "Auto"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <Fuel className="h-3.5 w-3.5 shrink-0 text-[#178BFF]" />
                  <span className="capitalize truncate">
                    {vehicle.fuel ? vehicle.fuel.replace(/_/g, " ") : "Petrol"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  {vehicle.engine_cc ? (
                    <>
                      <Zap className="h-3.5 w-3.5 shrink-0 text-[#178BFF]" />
                      <span className="truncate">
                        {vehicle.engine_cc}cc
                        {vehicle.drive ? ` \u00B7 ${vehicle.drive}` : ""}
                      </span>
                    </>
                  ) : (
                    <>
                      <Compass className="h-3.5 w-3.5 shrink-0 text-[#178BFF]" />
                      <span className="uppercase truncate">
                        {vehicle.drive || "2WD"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 4. BOTTOM PRICE & VERIFICATION FOOTER */}
              <div className="flex w-full items-end justify-between border-t border-[#748FA1]/20 pt-1.5">
                <div>
                  <p className="text-[8.5px] font-bold uppercase tracking-wider text-[#647F92] dark:text-slate-400">
                    Showroom Price
                  </p>
                  <p className="text-[16px] font-extrabold leading-tight tracking-[-0.03em] text-zinc-900 dark:text-white">
                    {formatPriceKES(vehicle.price_kes)}
                  </p>
                </div>

                {vehicle.is_negotiable ? (
                  <span className="rounded-[4px] bg-[#178BFF]/12 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-tight text-[#178BFF]">
                    Negotiable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#647F92] dark:text-slate-400">
                    <ShieldCheck className="h-3 w-3 text-[#178BFF]" /> Verified
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 2: MIDDLE BLUE INSERT CARD - z-index: 3
              Proportional to 256x364 cover:
              left: 12px, top: 26px, width: 232px, height: 312px
              Hover: x: 23.5, y: 12, rotate: 4 (Stays strictly inside 284px stage!)
          ========================================================= */}
          <motion.div
            className="absolute left-[12px] top-[26px] z-[3] flex h-[312px] w-[232px] flex-col items-end justify-center overflow-visible rounded-[10px] bg-[#178BFF] shadow-md"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { x: 0, y: 0, rotate: 0 },
              mobilePeek: { x: 16, y: 8.5, rotate: 2.6 },
              hover: { x: 23.5, y: 12, rotate: 4 },
            }}
            transition={SPRING_TRANSITION}
          >
            {/* Vertical CTA Label */}
            <div
              className="absolute right-[-19px] top-[22%] z-[1] flex items-center justify-start"
              style={{
                transform: "translateY(-50%) rotate(-90deg)",
              }}
            >
              <p className="whitespace-pre text-[11px] font-semibold leading-[1.2] tracking-[-0.04em] text-white">
                {resolvedCtaText}
              </p>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 3: BACK PAGE - z-index: 2
              Dimensions: 256px x 364px
          ========================================================= */}
          <motion.div
            className="absolute left-0 top-0 z-[2] flex h-[364px] w-[256px] flex-col items-start justify-center gap-[14px] rounded-[10px] bg-[#D3DACD] dark:bg-zinc-800 p-[18px] border border-black/[0.05] dark:border-white/5"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { z: -1 },
              mobilePeek: { z: -1 },
              hover: { z: -1 },
            }}
            transition={SPRING_TRANSITION}
          >
            <div className="flex h-full w-full flex-row items-center justify-center overflow-clip">
              <p className="flex-1 text-justify text-[11px] font-semibold leading-[1.22em] tracking-[-0.04em] text-[#9BA1A5] dark:text-zinc-500">
                {backText}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  )
}

export default VehicleCard