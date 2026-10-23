"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowRight,
  X,
  CarFront,
  Sparkles,
  MapPin,
  Tag,
  Gauge,
  Fuel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  searchAndRankVehicles,
  getVehicleCoverUrl,
  type SearchableVehicle,
} from "@/lib/utils/vehicle-search"

export interface HomeTaxonomyProps {
  makes: { id: string; name: string; slug: string }[]
  models: {
    id: string
    make_id: string
    name: string
    slug: string
    default_body_type?: string | null
  }[]
  categories: {
    id: string
    name: string
    slug: string
    description?: string | null
  }[]
  showrooms: { id: string; name: string; city: string }[]
}

interface SearchSuggestion {
  id: string
  label: string
  sublabel: string
  type: "make" | "model" | "category" | "showroom" | "spec"
  apply: () => void
}

const STATIC_YEARS = Array.from({ length: 16 }, (_, i) => (2026 - i).toString())

export function HeroSearch({
  taxonomy,
  vehicles,
}: {
  taxonomy: HomeTaxonomyProps
  vehicles: SearchableVehicle[]
}) {
  const router = useRouter()

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const [makeId, setMakeId] = useState<string>("all")
  const [modelId, setModelId] = useState<string>("all")
  const [year, setYear] = useState<string>("all")
  const [showroomId, setShowroomId] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const [condition, setCondition] = useState<string>("all")

  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Fast Category ID -> Name lookup map for the search ranker
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of taxonomy.categories) {
      map.set(cat.id, `${cat.name} ${cat.slug}`)
    }
    return map
  }, [taxonomy.categories])

  // Models filtered by currently selected Make
  const availableModels = useMemo(() => {
    if (!makeId || makeId === "all") return []
    return taxonomy.models.filter((m) => m.make_id === makeId)
  }, [makeId, taxonomy.models])

  // Close autocomplete dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 1. PRIMARY: Ranked Inventory Vehicle Matches (Top Results)
  const rankedVehicleMatches = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchAndRankVehicles(
      vehicles,
      searchQuery,
      {
        makeId,
        modelId,
        year,
        condition,
        showroomId,
        status,
      },
      categoryMap
    )
  }, [
    vehicles,
    searchQuery,
    makeId,
    modelId,
    year,
    condition,
    showroomId,
    status,
    categoryMap,
  ])

  const topVehicleResults = useMemo(
    () => rankedVehicleMatches.slice(0, 5),
    [rankedVehicleMatches]
  )

  // 2. SECONDARY: Smart Taxonomy & Filter Suggestions (Displayed AFTER Vehicle Results)
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    const results: SearchSuggestion[] = []

    // Match Makes
    for (const make of taxonomy.makes) {
      if (make.name.toLowerCase().includes(q)) {
        results.push({
          id: `make-${make.id}`,
          label: `Filter by ${make.name}`,
          sublabel: "Manufacturer",
          type: "make",
          apply: () => {
            setMakeId(make.id)
            setModelId("all")
            setSearchQuery("")
            setIsSearchFocused(false)
          },
        })
      }
    }

    // Match Models
    for (const model of taxonomy.models) {
      const parentMake = taxonomy.makes.find((m) => m.id === model.make_id)
      const fullName = `${parentMake?.name || ""} ${model.name}`
        .trim()
        .toLowerCase()

      if (model.name.toLowerCase().includes(q) || fullName.includes(q)) {
        results.push({
          id: `model-${model.id}`,
          label: `${parentMake?.name ? `${parentMake.name} ` : ""}${model.name}`,
          sublabel: model.default_body_type
            ? `${model.default_body_type} • Model Filter`
            : "Model Filter",
          type: "model",
          apply: () => {
            setMakeId(model.make_id)
            setModelId(model.id)
            setSearchQuery("")
            setIsSearchFocused(false)
          },
        })
      }
    }

    // Match Categories
    for (const cat of taxonomy.categories) {
      if (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q)
      ) {
        results.push({
          id: `cat-${cat.id}`,
          label: cat.name,
          sublabel: "Lifestyle Category",
          type: "category",
          apply: () => {
            router.push(`/vehicles?category=${encodeURIComponent(cat.slug)}`)
          },
        })
      }
    }

    // Match Showrooms
    for (const branch of taxonomy.showrooms) {
      if (
        branch.name.toLowerCase().includes(q) ||
        branch.city.toLowerCase().includes(q)
      ) {
        results.push({
          id: `branch-${branch.id}`,
          label: `${branch.name} (${branch.city})`,
          sublabel: "Showroom Location",
          type: "showroom",
          apply: () => {
            setShowroomId(branch.id)
            setSearchQuery("")
            setIsSearchFocused(false)
          },
        })
      }
    }

    // Match Common Specs & Conditions
    const smartSpecs: {
      keywords: string[]
      label: string
      sublabel: string
      action: () => void
    }[] = [
      {
        keywords: ["foreign", "import", "japan"],
        label: "Foreign Used Vehicles",
        sublabel: "Condition Filter",
        action: () => {
          setCondition("foreign_used")
          setSearchQuery("")
          setIsSearchFocused(false)
        },
      },
      {
        keywords: ["local", "locally", "kenyan"],
        label: "Locally Used Vehicles",
        sublabel: "Condition Filter",
        action: () => {
          setCondition("locally_used")
          setSearchQuery("")
          setIsSearchFocused(false)
        },
      },
      {
        keywords: ["hybrid", "electric", "ev", "fuel"],
        label: "Hybrid & Eco Vehicles",
        sublabel: "Fuel Filter",
        action: () => router.push("/vehicles?fuel=hybrid"),
      },
      {
        keywords: ["4wd", "awd", "off-road", "offroad", "4x4"],
        label: "4WD & Off-Road",
        sublabel: "Drivetrain Filter",
        action: () => router.push("/vehicles?drive=4WD"),
      },
      {
        keywords: ["automatic", "auto"],
        label: "Automatic Transmission",
        sublabel: "Transmission Filter",
        action: () => router.push("/vehicles?transmission=automatic"),
      },
    ]

    for (const spec of smartSpecs) {
      if (spec.keywords.some((kw) => kw.includes(q) || q.includes(kw))) {
        results.push({
          id: `spec-${spec.label}`,
          label: spec.label,
          sublabel: spec.sublabel,
          type: "spec",
          apply: spec.action,
        })
      }
    }

    return results.slice(0, 4)
  }, [searchQuery, taxonomy, router])

  // Total navigable items in dropdown (Vehicles first, then Smart Suggestions)
  const totalNavigableCount = topVehicleResults.length + suggestions.length

  const hasActiveFilters =
    makeId !== "all" ||
    modelId !== "all" ||
    year !== "all" ||
    condition !== "all" ||
    showroomId !== "all" ||
    status !== "all"

  const resetAllFilters = () => {
    setMakeId("all")
    setModelId("all")
    setYear("all")
    setCondition("all")
    setShowroomId("all")
    setStatus("all")
  }

  // Construct final URL parameters and navigate to inventory
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const params = new URLSearchParams()
    const trimmedQuery = searchQuery.trim()

    let resolvedMakeId = makeId !== "all" ? makeId : ""
    let resolvedModelId = modelId !== "all" ? modelId : ""

    if (trimmedQuery) {
      const lowerQ = trimmedQuery.toLowerCase()

      if (!resolvedMakeId) {
        const matchedMake = taxonomy.makes.find(
          (m) => m.name.toLowerCase() === lowerQ
        )
        if (matchedMake) resolvedMakeId = matchedMake.id
      }

      if (!resolvedModelId) {
        const matchedModel = taxonomy.models.find(
          (m) => m.name.toLowerCase() === lowerQ
        )
        if (matchedModel) {
          resolvedModelId = matchedModel.id
          if (!resolvedMakeId) resolvedMakeId = matchedModel.make_id
        }
      }

      params.set("q", trimmedQuery)
    }

    if (resolvedMakeId) params.set("make", resolvedMakeId)
    if (resolvedModelId) params.set("model", resolvedModelId)
    if (year && year !== "all") params.set("year", year)
    if (showroomId && showroomId !== "all") params.set("showroom", showroomId)
    if (status && status !== "all") params.set("status", status)
    if (condition && condition !== "all") params.set("condition", condition)

    setIsSearchFocused(false)
    const queryString = params.toString()
    router.push(queryString ? `/vehicles?${queryString}` : "/vehicles")
  }

  // Unified Keyboard Navigation across Vehicle Results AND Smart Suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused || totalNavigableCount === 0) {
      if (e.key === "Enter") handleSearch()
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < totalNavigableCount - 1 ? prev + 1 : 0
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : totalNavigableCount - 1
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        // Check if highlighted item is a Vehicle Result
        if (highlightedIndex < topVehicleResults.length) {
          const targetVehicle = topVehicleResults[highlightedIndex]?.vehicle
          if (targetVehicle) {
            setIsSearchFocused(false)
            router.push(`/vehicles/${targetVehicle.slug}`)
            return
          }
        } else {
          // Otherwise it's a Smart Suggestion
          const suggestionIdx = highlightedIndex - topVehicleResults.length
          const targetSuggestion = suggestions[suggestionIdx]
          if (targetSuggestion) {
            targetSuggestion.apply()
            return
          }
        }
      }
      handleSearch()
    } else if (e.key === "Escape") {
      setIsSearchFocused(false)
    }
  }

  const formatPriceKES = (price: number | null) => {
    if (!price) return "Price on Request"
    return `KSh ${price.toLocaleString("en-KE")}`
  }

  const quickRoutes = [
    { label: "In stock now", href: "/vehicles?status=in_stock" },
    { label: "Foreign used", href: "/vehicles?condition=foreign_used" },
    { label: "Locally used", href: "/vehicles?condition=locally_used" },
    { label: "4WD & off-road", href: "/vehicles?category=off-road" },
    { label: "Family cars", href: "/vehicles?category=family-cars" },
    { label: "Luxury", href: "/vehicles?category=luxury" },
    { label: "View all stock", href: "/vehicles" },
  ]

  const showDropdown = isSearchFocused && searchQuery.trim().length > 0

  return (
    <div className="w-full max-w-6xl mx-auto rounded-[24px] bg-card text-card-foreground border shadow-2xl overflow-visible relative">
      {/* Subtle Top Brand Accent Bar - SLIMMED */}
      <div className="h-1 w-full bg-gradient-to-r from-destructive via-primary to-emerald-600 rounded-t-[24px]" />

      {/* SLIMMED: Reduced padding from p-10 to p-6 and space-y-5 to space-y-4 */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
            Find your next car.
          </h2>
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Browse all filters</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Row 1: Smart Search Inventory Input - SLIMMED */}
        <div ref={searchContainerRef} className="relative">
          <div
            className={cn(
              "w-full rounded-[16px] border bg-background px-4 py-2 transition-all flex flex-col justify-center",
              isSearchFocused
                ? "border-primary ring-2 ring-primary/15 shadow-sm"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <label
              htmlFor="hero-inventory-search"
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground select-none"
            >
              Search Inventory
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <Search className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <input
                id="hero-inventory-search"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(-1)
                  setIsSearchFocused(true)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Try Prado, hybrid, 4WD, automatic, Nairobi..."
                className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setHighlightedIndex(-1)
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* UNIFIED LIVE SEARCH DROPDOWN */}
          {/* ========================================================= */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] flex flex-col">
              <div className="overflow-y-auto divide-y divide-border">
                {/* SECTION 1: MATCHING VEHICLES IN INVENTORY */}
                <div>
                  <div className="px-4 py-2.5 bg-muted/40 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span className="uppercase tracking-wider flex items-center gap-1.5">
                      <CarFront className="w-3.5 h-3.5 text-primary" />
                      Matching Vehicles ({rankedVehicleMatches.length})
                    </span>
                    {rankedVehicleMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSearch()}
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        View all {rankedVehicleMatches.length} matches
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {topVehicleResults.length > 0 ? (
                    <ul role="listbox" className="divide-y divide-border/50">
                      {topVehicleResults.map((result, idx) => {
                        const { vehicle, matchReasons } = result
                        const coverUrl = getVehicleCoverUrl(
                          vehicle.cover_image_path
                        )
                        const displayTitle =
                          vehicle.title ||
                          `${vehicle.year} ${vehicle.make_name} ${vehicle.model_name}`.trim()

                        return (
                          <li key={vehicle.id}>
                            <Link
                              href={`/vehicles/${vehicle.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={cn(
                                "w-full px-4 py-3 flex items-center justify-between gap-4 transition-colors",
                                highlightedIndex === idx
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-xl bg-muted border overflow-hidden shrink-0 flex items-center justify-center relative">
                                  {coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={coverUrl}
                                      alt={displayTitle}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <CarFront className="w-6 h-6 text-muted-foreground/40" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-heading font-semibold text-sm sm:text-base text-foreground truncate">
                                      {displayTitle}
                                    </span>
                                    <Badge
                                      variant={
                                        vehicle.inventory_status === "in_stock"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 h-4 capitalize",
                                        vehicle.inventory_status ===
                                          "in_stock" &&
                                          "bg-emerald-600 hover:bg-emerald-600 text-white"
                                      )}
                                    >
                                      {vehicle.inventory_status === "in_stock"
                                        ? "In Stock"
                                        : vehicle.inventory_status.replace(
                                            "_",
                                            " "
                                          )}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/80">
                                      {vehicle.year}
                                    </span>
                                    {vehicle.condition && (
                                      <>
                                        <span>•</span>
                                        <span className="capitalize">
                                          {vehicle.condition.replace("_", " ")}
                                        </span>
                                      </>
                                    )}
                                    {vehicle.mileage_km !== null && (
                                      <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-0.5">
                                          <Gauge className="w-3 h-3" />
                                          {vehicle.mileage_km.toLocaleString()}{" "}
                                          km
                                        </span>
                                      </>
                                    )}
                                    {vehicle.fuel && (
                                      <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-0.5 capitalize">
                                          <Fuel className="w-3 h-3" />
                                          {vehicle.fuel.replace("_", " ")}
                                        </span>
                                      </>
                                    )}
                                    {vehicle.transmission && (
                                      <>
                                        <span>•</span>
                                        <span className="capitalize">
                                          {vehicle.transmission}
                                        </span>
                                      </>
                                    )}
                                    {vehicle.drive && (
                                      <>
                                        <span>•</span>
                                        <span className="uppercase">
                                          {vehicle.drive}
                                        </span>
                                      </>
                                    )}
                                    {vehicle.showroom_city && (
                                      <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-0.5">
                                          <MapPin className="w-3 h-3" />
                                          {vehicle.showroom_city}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {matchReasons.length > 0 && (
                                    <div className="flex items-center gap-1 pt-0.5">
                                      <span className="text-[10px] text-muted-foreground">
                                        Matched:
                                      </span>
                                      {matchReasons.map((reason) => (
                                        <span
                                          key={reason}
                                          className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-medium"
                                        >
                                          {reason}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                <div>
                                  <p className="font-heading font-bold text-sm sm:text-base text-primary">
                                    {formatPriceKES(vehicle.price_kes)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {vehicle.stock_number}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No vehicles in current stock matched &quot;
                        <span className="font-medium text-foreground">
                          {searchQuery}
                        </span>
                        &quot;
                        {hasActiveFilters ? " with your selected filters." : "."}
                      </p>
                      {hasActiveFilters && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={resetAllFilters}
                          className="h-7 text-xs"
                        >
                          Clear active dropdown filters
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION 2: SMART SUGGESTIONS */}
                {suggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-muted/40 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Smart Suggestions
                      </span>
                      <span className="normal-case font-normal">
                        Quick filters &amp; categories
                      </span>
                    </div>
                    <ul className="divide-y divide-border/40">
                      {suggestions.map((item, sIdx) => {
                        const globalIdx = topVehicleResults.length + sIdx
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={item.apply}
                              onMouseEnter={() =>
                                setHighlightedIndex(globalIdx)
                              }
                              className={cn(
                                "w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors",
                                highlightedIndex === globalIdx
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
                                  {item.type === "make" ||
                                  item.type === "model" ? (
                                    <CarFront className="w-3.5 h-3.5" />
                                  ) : item.type === "showroom" ? (
                                    <MapPin className="w-3.5 h-3.5" />
                                  ) : item.type === "category" ? (
                                    <Tag className="w-3.5 h-3.5" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                                    {item.label}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {item.sublabel}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="capitalize text-[10px] shrink-0"
                              >
                                {item.type}
                              </Badge>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 bg-muted/60 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span className="hidden sm:inline">
                  Use <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">↑</kbd>{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">↓</kbd> to navigate,{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-background border text-[10px]">Enter</kbd> to select
                </span>
                <button
                  type="button"
                  onClick={() => handleSearch()}
                  className="font-semibold text-primary hover:underline ml-auto inline-flex items-center gap-1"
                >
                  Search all inventory for &quot;{searchQuery.trim()}&quot;
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Structured Filter Cards + Find My Car Button - SLIMMED */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 items-stretch">
          {/* 1. MAKE */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Make
            </span>
            <Select
              value={makeId}
              onValueChange={(val) => {
                setMakeId(val)
                setModelId("all")
              }}
            >
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full">
                <SelectValue placeholder="All makes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All makes</SelectItem>
                {taxonomy.makes.map((make) => (
                  <SelectItem key={make.id} value={make.id}>
                    {make.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. MODEL */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Model
            </span>
            <Select
              value={modelId}
              onValueChange={setModelId}
              disabled={!makeId || makeId === "all"}
            >
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full disabled:opacity-60">
                <SelectValue
                  placeholder={
                    !makeId || makeId === "all"
                      ? "Choose a make first"
                      : "All models"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {!makeId || makeId === "all"
                    ? "Choose a make first"
                    : "All models"}
                </SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. YEAR */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Year
            </span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {STATIC_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. CONDITION */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Condition
            </span>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full">
                <SelectValue placeholder="Any condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any condition</SelectItem>
                <SelectItem value="foreign_used">Foreign used</SelectItem>
                <SelectItem value="locally_used">Locally used</SelectItem>
                <SelectItem value="brand_new">Brand new</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 5. SHOWROOM */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Showroom
            </span>
            <Select value={showroomId} onValueChange={setShowroomId}>
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {taxonomy.showrooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 6. STOCK STATUS */}
          <div className="rounded-xl border bg-muted/20 hover:bg-muted/35 transition-colors px-3 py-1.5 flex flex-col justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
              Stock Status
            </span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="border-0 bg-transparent dark:bg-transparent shadow-none px-0.5 h-7 text-sm font-medium focus-visible:ring-0 w-full">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="in_stock">In stock now</SelectItem>
                <SelectItem value="in_transit">On the way</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 7. CTA BUTTON: Find my car -> */}
          <Button
            type="button"
            onClick={() => handleSearch()}
            className="h-full min-h-[48px] rounded-xl bg-[#c8102e] hover:bg-[#a80d26] text-white font-semibold text-sm px-4 shadow-md flex items-center justify-center gap-2 transition-all sm:col-span-2 lg:col-span-1"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Find my car</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        </div>

        {/* Row 3: Quick Routes Pills - SLIMMED */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] sm:text-xs font-medium text-muted-foreground mr-1">
            Quick routes:
          </span>
          {quickRoutes.map((route) => (
            <Link
              key={route.label}
              href={route.href}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 hover:bg-muted text-foreground/90 hover:text-foreground px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors border border-transparent hover:border-border"
            >
              <span>{route.label}</span>
              <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}