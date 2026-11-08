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

  // Detect touch-primary devices (phones, foldables, tablets) safely after hydration
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)")
    const updateTouchStatus = () => setIsTouchDevice(mediaQuery.matches)

    updateTouchStatus()
    mediaQuery.addEventListener("change", updateTouchStatus)
    return () => mediaQuery.removeEventListener("change", updateTouchStatus)
  }, [])

  // Trigger the partial open animation when 55% of the card enters the mobile viewport
  const isInView = useInView(cardRef, {
    amount: 0.55,
    margin: "-5% 0px -5% 0px",
  })

  // Resolve which animation variant is active:
  // - Desktop: "hover" on mouseover, otherwise "default"
  // - Touch/Mobile: "hover" when actively pressed, "mobilePeek" when in viewport, otherwise "default"
  const activeVariant = isTouchDevice
    ? isTouchPressed
      ? "hover"
      : isInView
        ? "mobilePeek"
        : "default"
    : isHovered
      ? "hover"
      : "default"

  // Automatically adapt CTA label for touch vs. cursor while keeping 13-character geometry
  const resolvedCtaText = ctaText ?? (isTouchDevice ? "TAP TO VIEW →" : "CLICK TO VIEW")

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

  // Dynamic logbook dossier text for Layer 3 (Back Page)
  const specSummaryUnit = [
    `${displayTitle}`,
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
    .join(" • ")

  const backText = `${specSummaryUnit}. `.repeat(10).trim()

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      onClick={onClick}
      className="block w-[292px] mx-auto focus:outline-none"
    >
      <motion.div
        ref={cardRef}
        className="relative h-[404px] w-[292px] cursor-pointer select-none overflow-visible"
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
        {/* 3D Perspective Wrapper (.framer-1g2fhvb) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-visible"
          style={{
            perspective: "1500px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* =========================================================
              LAYER 1: FRONT COVER (.framer-1yyabcm) - z-index: 4
              - default:    rotateY: -1   (Closed)
              - mobilePeek: rotateY: -22  (Partially open on touch viewports)
              - hover:      rotateY: -35  (Fully open on desktop hover / touch press)
          ========================================================= */}
          <motion.div
            className="relative z-[4] flex h-[404px] w-[292px] flex-none flex-col items-start justify-between overflow-clip rounded-[8px] bg-[#ECF2EE] dark:bg-zinc-900 p-[18px] will-change-transform border border-black/[0.06] dark:border-white/10 shadow-sm"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { z: 1, rotateY: -1 },
              mobilePeek: { z: 1, rotateY: -22 },
              hover: { z: 1, rotateY: -35 },
            }}
            transition={SPRING_TRANSITION}
          >
            {/* 1. TOP HEADER ROW: LOGBOOK Badge + Stock Number & Status Pill */}
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex flex-row items-center gap-[5px]">
                <svg
                  viewBox="0 0 11.957 12"
                  className="h-[12px] w-[12px] shrink-0 overflow-visible"
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
                <p className="text-[10px] font-bold leading-[1.2] tracking-[-0.04em] text-[#748FA1] uppercase">
                  LOGBOOK
                </p>
                {vehicle.stock_number && (
                  <span className="text-[10px] font-mono font-semibold text-[#748FA1]/80">
                    • {vehicle.stock_number}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {vehicle.is_featured && (
                  <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-2.5 w-2.5" /> Hot
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight ${statusBadge.color}`}
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
            <div className="relative mt-[10px] h-[154px] w-full shrink-0 overflow-hidden rounded-[6px] bg-[#D3DACD]/60 dark:bg-zinc-800">
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
                  <CarFront className="h-8 w-8 opacity-50" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    No Cover Photo
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              {vehicle.condition && (
                <span className="absolute bottom-2 left-2 rounded-[4px] bg-black/65 px-2 py-0.5 text-[9px] font-semibold capitalize tracking-tight text-white backdrop-blur-xs">
                  {formatCondition(vehicle.condition)}
                </span>
              )}

              {vehicle.showroom_city && (
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-[4px] bg-white/90 px-1.5 py-0.5 text-[9px] font-bold tracking-tight text-zinc-900">
                  <MapPin className="h-2.5 w-2.5 text-[#178BFF]" />
                  {vehicle.showroom_city}
                </span>
              )}
            </div>

            {/* 3. VEHICLE HEADLINE & KEY SPECS BELOW IMAGE */}
            <div className="mt-[12px] flex w-full flex-1 flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-[-0.02em] text-[#748FA1]">
                  <span>
                    {vehicle.year} • {vehicle.make_name || "Vehicle"}
                  </span>
                  {vehicle.body_type && (
                    <span className="rounded bg-[#D3DACD]/70 dark:bg-zinc-800 px-1.5 py-0.2 text-[9px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {vehicle.body_type}
                    </span>
                  )}
                </div>

                <h3 className="line-clamp-2 text-[19px] font-semibold leading-[1.2em] tracking-[-0.04em] text-[#178BFF] dark:text-[#3B9EFF]">
                  {displayTitle}
                </h3>
              </div>

              {/* 4-Pill Specs Grid with Icons */}
              <div className="my-[10px] grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-[6px] bg-white/70 dark:bg-zinc-800/70 p-2 text-[11px] font-semibold tracking-[-0.02em] text-zinc-700 dark:text-zinc-300">
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
                        {vehicle.drive ? ` • ${vehicle.drive}` : ""}
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
              <div className="flex w-full items-end justify-between border-t border-[#748FA1]/20 pt-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#748FA1]">
                    Showroom Price
                  </p>
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.03em] text-zinc-900 dark:text-white">
                    {formatPriceKES(vehicle.price_kes)}
                  </p>
                </div>

                {vehicle.is_negotiable ? (
                  <span className="rounded-[4px] bg-[#178BFF]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight text-[#178BFF]">
                    Negotiable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#748FA1]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#178BFF]" /> Verified
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 2: MIDDLE BLUE INSERT CARD (.framer-nyy122) - z-index: 3
              - default:    x: 0,    y: 0,  rotate: 0
              - mobilePeek: x: 18,   y: 10, rotate: 2.8 (Exposes vertical CTA cleanly on touch)
              - hover:      x: 26.5, y: 14, rotate: 4   (Full desktop hover / touch press)
          ========================================================= */}
          <motion.div
            className="absolute left-[13.5px] top-[29px] z-[3] flex h-[346px] w-[265px] flex-col items-end justify-center overflow-visible rounded-[8px] bg-[#178BFF]"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { x: 0, y: 0, rotate: 0 },
              mobilePeek: { x: 18, y: 10, rotate: 2.8 },
              hover: { x: 26.5, y: 14, rotate: 4 },
            }}
            transition={SPRING_TRANSITION}
          >
            {/* Vertical CTA Label (.framer-18jqlfx) */}
            <div
              className="absolute right-[-21px] top-[21%] z-[1] flex items-center justify-start"
              style={{
                transform: "translateY(-50%) rotate(-90deg)",
              }}
            >
              <p className="whitespace-pre text-[12px] font-semibold leading-[1.2] tracking-[-0.04em] text-white">
                {resolvedCtaText}
              </p>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 3: BACK PAGE (.framer-gn9ha6) - z-index: 2
          ========================================================= */}
          <motion.div
            className="absolute left-0 top-0 z-[2] flex h-[404px] w-[292px] flex-col items-start justify-center gap-[16px] rounded-[8px] bg-[#D3DACD] dark:bg-zinc-800 p-[20px]"
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
              <p className="flex-1 text-justify text-[12px] font-semibold leading-[1.2em] tracking-[-0.04em] text-[#9BA1A5] dark:text-zinc-500">
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