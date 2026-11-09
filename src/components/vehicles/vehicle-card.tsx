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
  Camera,
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)")
    const updateTouchStatus = () => setIsTouchDevice(mediaQuery.matches)

    updateTouchStatus()
    mediaQuery.addEventListener("change", updateTouchStatus)
    return () => mediaQuery.removeEventListener("change", updateTouchStatus)
  }, [])

  const isInView = useInView(cardRef, {
    amount: 0.55,
    margin: "-6% 0px -6% 0px",
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

  const resolvedCtaText = ctaText ?? (isTouchDevice ? "TAP TO VIEW ->" : "CLICK TO VIEW")

  const displayTitle =
    vehicle.title ||
    `${vehicle.year} ${vehicle.make_name} ${vehicle.model_name}`.trim()

  const coverUrl = getVehicleCoverUrl(vehicle.cover_image_path)
  const innerPhotoUrl =
    getVehicleCoverUrl(vehicle.secondary_image_path ?? vehicle.cover_image_path) || coverUrl

  const formatPriceKES = (price: number | null) =>
    price ? `KSh ${price.toLocaleString("en-KE")}` : "Price on Request"

  const formatMileageShort = (mileage: number | null) => {
    if (mileage === null) return "N/A"
    if (mileage >= 1000) return `${Math.round(mileage / 1000)}k km`
    return `${mileage} km`
  }

  const formatCondition = (condition: string | null) => {
    if (!condition) return "Inspected"
    return condition.replace(/_/g, " ")
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case "in_stock":
        return {
          label: "In Stock",
          color: "bg-brand-green text-brand-green-foreground",
        }
      case "in_transit":
        return { label: "Transit", color: "bg-amber-600/90 text-white" }
      case "reserved":
        return {
          label: "Reserved",
          color: "bg-secondary text-secondary-foreground",
        }
      case "sold":
        return {
          label: "Sold",
          color: "bg-primary text-primary-foreground",
        }
      default:
        return {
          label: status.replace(/_/g, " "),
          color: "bg-secondary text-secondary-foreground",
        }
    }
  }

  const statusBadge = formatStatus(vehicle.inventory_status)

  const specSummaryUnit = [
    displayTitle,
    `Stock #${vehicle.stock_number || "N/A"}`,
    `Price: ${formatPriceKES(vehicle.price_kes)}`,
    vehicle.mileage_km !== null ? `Mileage: ${vehicle.mileage_km.toLocaleString()} km` : null,
    vehicle.engine_cc ? `Engine: ${vehicle.engine_cc}cc` : null,
    vehicle.transmission ? `Transmission: ${vehicle.transmission}` : null,
    vehicle.fuel ? `Fuel: ${vehicle.fuel.replace(/_/g, " ")}` : null,
    vehicle.drive ? `Drivetrain: ${vehicle.drive}` : null,
  ]
    .filter(Boolean)
    .join(" \u00B7 ")

  const backText = `${specSummaryUnit}. `.repeat(8).trim()

  return (
    <Link
      href={`/vehicles/${vehicle.slug}`}
      onClick={onClick}
      className={cn(
        "group relative isolate block w-full max-w-[220px] mx-auto select-none focus:outline-none py-1",
        isElevated ? "z-30" : "z-10"
      )}
    >
      <motion.div
        ref={cardRef}
        className="relative w-full cursor-pointer select-none"
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
        {/* 3D Folder Stage */}
        <div
          className="relative w-[89%] overflow-visible"
          style={{
            perspective: "1500px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* =========================================================
              LAYER 1: FRONT FOLDER COVER - z-index: 4
          ========================================================= */}
          <motion.div
            className="relative z-[4] flex w-full flex-col justify-between overflow-hidden rounded-[8px] bg-folder-front p-2.5 sm:p-3 will-change-transform border border-border/80 shadow-sm"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { z: 1, rotateY: -1 },
              mobilePeek: { z: 1, rotateY: -20 },
              hover: { z: 1, rotateY: -35 },
            }}
            transition={SPRING_TRANSITION}
          >
            {/* 1. TOP HEADER ROW: LOGBOOK Badge + Status */}
            <div className="flex w-full shrink-0 items-center justify-between gap-1">
              <div className="flex flex-row items-center gap-1 min-w-0">
                <svg
                  viewBox="0 0 11.957 12"
                  className="h-[10px] w-[10px] shrink-0 overflow-visible text-primary"
                  aria-hidden="true"
                >
                  <path
                    d="M 7.885 0.006 C 7.713 -0.019 7.538 0.033 7.407 0.15 C 7.275 0.267 7.2 0.437 7.2 0.615 L 7.2 4.265 C 7.2 4.605 7.469 4.88 7.8 4.88 L 11.358 4.88 C 11.532 4.88 11.697 4.802 11.811 4.668 C 11.925 4.533 11.976 4.354 11.951 4.177 C 11.647 2.016 9.992 0.319 7.885 0.006 Z"
                    fill="currentColor"
                  />
                  <path
                    d="M 5.4 0.923 C 2.418 0.923 0 3.403 0 6.462 C 0 9.52 2.418 12 5.4 12 C 8.382 12 10.8 9.52 10.8 6.462 C 10.8 6.122 10.531 5.846 10.2 5.846 L 6 5.846 L 6 1.538 C 6 1.199 5.731 0.923 5.4 0.923 Z"
                    fill="currentColor"
                  />
                </svg>
                <p className="text-[8.5px] font-extrabold leading-none tracking-[-0.03em] text-folder-label uppercase truncate">
                  LOGBOOK
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {vehicle.is_featured && (
                  <span className="inline-flex items-center rounded-[3px] bg-primary/15 px-1 py-0.5 text-[7.5px] font-bold uppercase text-primary">
                    <Sparkles className="h-2 w-2" />
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[7.5px] font-bold uppercase leading-none tracking-tight ${statusBadge.color}`}
                >
                  {vehicle.inventory_status === "in_stock" ? (
                    <CheckCircle2 className="h-2 w-2" />
                  ) : (
                    <Clock className="h-2 w-2" />
                  )}
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* 2. COVER IMAGE BLOCK */}
            <div className="relative mt-1.5 aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[6px] bg-folder-back/70 border border-border/50">
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
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-folder-label">
                  <CarFront className="h-6 w-6 opacity-50" />
                  <span className="text-[8px] font-semibold uppercase">No Photo</span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              {vehicle.condition && (
                <span className="absolute bottom-1 left-1 rounded-[3px] bg-black/65 px-1.5 py-0.5 text-[7.5px] font-semibold capitalize leading-none tracking-tight text-white backdrop-blur-xs">
                  {formatCondition(vehicle.condition)}
                </span>
              )}

              {vehicle.showroom_city && (
                <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-[3px] bg-card/95 px-1 py-0.5 text-[7.5px] font-bold leading-none tracking-tight text-foreground shadow-2xs">
                  <MapPin className="h-2 w-2 text-primary" />
                  {vehicle.showroom_city}
                </span>
              )}
            </div>

            {/* 3. UNIFORM DETAILS & SPECS SECTION */}
            <div className="mt-2 flex w-full flex-col justify-between">
              <div className="shrink-0">
                <div className="flex items-center justify-between text-[9px] font-bold leading-none tracking-[-0.02em] text-folder-label">
                  <span className="truncate pr-1">
                    {vehicle.year} {"\u00B7"} {vehicle.make_name || "Vehicle"}
                  </span>
                  {vehicle.stock_number && (
                    <span className="shrink-0 font-mono text-[8px] text-folder-label/80">
                      #{vehicle.stock_number.slice(-4)}
                    </span>
                  )}
                </div>

                {/* Vehicle Headline in Faded Soft Red (--primary) */}
                <h3
                  title={displayTitle}
                  className="mt-1 h-[2.4em] line-clamp-2 overflow-hidden text-[12px] sm:text-[13px] font-bold leading-[1.2] tracking-[-0.03em] text-primary"
                >
                  {displayTitle}
                </h3>
              </div>

              {/* Compact 2x2 Specs Grid with Green Secondary Icons */}
              <div className="my-1.5 shrink-0 grid grid-cols-2 gap-x-1.5 gap-y-1 rounded-[5px] bg-card/85 px-1.5 py-1.5 text-[8.5px] sm:text-[9px] font-semibold leading-tight tracking-[-0.01em] text-foreground border border-border/60">
                <div className="flex items-center gap-1 truncate">
                  <Gauge className="h-2.5 w-2.5 shrink-0 text-secondary-foreground" />
                  <span className="truncate">{formatMileageShort(vehicle.mileage_km)}</span>
                </div>

                <div className="flex items-center gap-1 truncate">
                  <Settings2 className="h-2.5 w-2.5 shrink-0 text-secondary-foreground" />
                  <span className="capitalize truncate">
                    {vehicle.transmission === "automatic"
                      ? "Auto"
                      : vehicle.transmission || "Auto"}
                  </span>
                </div>

                <div className="flex items-center gap-1 truncate">
                  <Fuel className="h-2.5 w-2.5 shrink-0 text-secondary-foreground" />
                  <span className="capitalize truncate">
                    {vehicle.fuel ? vehicle.fuel.replace(/_/g, " ") : "Petrol"}
                  </span>
                </div>

                <div className="flex items-center gap-1 truncate">
                  {vehicle.engine_cc ? (
                    <>
                      <Zap className="h-2.5 w-2.5 shrink-0 text-secondary-foreground" />
                      <span className="truncate">{vehicle.engine_cc}cc</span>
                    </>
                  ) : (
                    <>
                      <Compass className="h-2.5 w-2.5 shrink-0 text-secondary-foreground" />
                      <span className="uppercase truncate">{vehicle.drive || "2WD"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 4. BOTTOM PRICE FOOTER */}
              <div className="flex w-full shrink-0 items-end justify-between gap-1 border-t border-border/70 pt-1.5 pb-0.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] font-bold uppercase leading-none tracking-wider text-folder-label">
                    Price
                  </p>
                  <p className="mt-1 text-[11.5px] sm:text-[13px] font-extrabold leading-tight tracking-[-0.03em] text-foreground truncate">
                    {formatPriceKES(vehicle.price_kes)}
                  </p>
                </div>

                {vehicle.is_negotiable ? (
                  <span className="shrink-0 rounded-[3px] bg-primary/15 px-1.5 py-0.5 text-[7px] font-bold uppercase leading-none tracking-tight text-primary">
                    Nego
                  </span>
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-secondary-foreground" />
                )}
              </div>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 2: INNER VEHICLE PHOTO INSERT CARD - z-index: 3
          ========================================================= */}
          <motion.div
            className="absolute left-[4.6%] top-[7.5%] z-[3] flex h-[85%] w-[90.8%] flex-col items-end justify-center overflow-hidden rounded-[8px] bg-folder-back border-2 border-card shadow-md"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "0% 100% 0px",
            }}
            variants={{
              default: { x: "0%", y: "0%", rotate: 0 },
              mobilePeek: { x: "6.8%", y: "2.8%", rotate: 2.6 },
              hover: { x: "10%", y: "4.4%", rotate: 4 },
            }}
            transition={SPRING_TRANSITION}
          >
            {innerPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={innerPhotoUrl}
                alt={`${displayTitle} gallery preview`}
                className="absolute inset-0 h-full w-full object-cover object-center"
                draggable={false}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-secondary" />
            )}

            {/* Right-Edge Spine Scrim & Faded Soft Red Primary Strip */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/80 via-black/45 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-primary" />

            {vehicle.image_count && vehicle.image_count > 1 && (
              <div className="absolute bottom-2 right-2 z-[2] inline-flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-xs">
                <Camera className="h-2.5 w-2.5 text-primary" />
                <span>{vehicle.image_count}</span>
              </div>
            )}

            <div
              className="absolute right-[-18px] top-[24%] z-[2] flex items-center justify-start"
              style={{
                transform: "translateY(-50%) rotate(-90deg)",
              }}
            >
              <p className="whitespace-pre text-[9.5px] font-bold leading-none tracking-[-0.02em] text-white drop-shadow">
                {resolvedCtaText}
              </p>
            </div>
          </motion.div>

          {/* =========================================================
              LAYER 3: BACK FOLDER PAGE - z-index: 2
          ========================================================= */}
          <motion.div
            className="absolute inset-0 z-[2] flex h-full w-full flex-col items-start justify-center rounded-[8px] bg-folder-back p-3 border border-border/60"
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
            <div className="flex h-full w-full flex-row items-center justify-center overflow-hidden">
              <p className="flex-1 text-justify text-[9.5px] font-semibold leading-[1.2em] tracking-[-0.04em] text-folder-label/75">
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