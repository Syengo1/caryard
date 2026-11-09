// src/components/vehicles/inventory-catalog.tsx
"use client"

import React, { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  ArrowUpDown,
  Tag,
} from "lucide-react"
import { VehicleGrid } from "@/components/vehicles/vehicle-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  searchAndRankVehicles,
  type SearchableVehicle,
} from "@/lib/utils/vehicle-search"
import type { HomeTaxonomyProps } from "@/components/home/hero-search"

const ITEMS_PER_PAGE = 18 // 3 full rows of 6 on desktop, 9 rows of 2 on mobile

const PRICE_RANGES = [
  { id: "all", label: "Any Budget", min: 0, max: Infinity },
  { id: "under-1.5m", label: "Under KSh 1.5M", min: 0, max: 1_500_000 },
  { id: "1.5m-3m", label: "KSh 1.5M – 3M", min: 1_500_000, max: 3_000_000 },
  { id: "3m-6m", label: "KSh 3M – 6M", min: 3_000_000, max: 6_000_000 },
  { id: "6m-10m", label: "KSh 6M – 10M", min: 6_000_000, max: 10_000_000 },
  { id: "over-10m", label: "Above KSh 10M", min: 10_000_000, max: Infinity },
]

const STATIC_YEARS = Array.from(
  { length: 16 },
  (_, i) => (new Date().getFullYear() - i).toString()
)

export interface InitialCatalogParams {
  q?: string
  make?: string
  model?: string
  year?: string
  condition?: string
  status?: string
  showroom?: string
  category?: string
  fuel?: string
  drive?: string
  transmission?: string
  price?: string
  sort?: string
  page?: string
}

export function InventoryCatalog({
  taxonomy,
  vehicles,
  initialParams,
}: {
  taxonomy: HomeTaxonomyProps
  vehicles: SearchableVehicle[]
  initialParams: InitialCatalogParams
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Resolve initial make (supports UUID, slug, or name)
  const resolvedInitialMake = useMemo(() => {
    if (!initialParams.make) return "all"
    const found = taxonomy.makes.find(
      (m) =>
        m.id === initialParams.make ||
        m.slug.toLowerCase() === initialParams.make?.toLowerCase() ||
        m.name.toLowerCase() === initialParams.make?.toLowerCase()
    )
    return found ? found.id : "all"
  }, [initialParams.make, taxonomy.makes])

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialParams.q || "")
  const [makeId, setMakeId] = useState(resolvedInitialMake)
  const [modelId, setModelId] = useState(initialParams.model || "all")
  const [year, setYear] = useState(initialParams.year || "all")
  const [condition, setCondition] = useState(initialParams.condition || "all")
  const [status, setStatus] = useState(initialParams.status || "all")
  const [showroomId, setShowroomId] = useState(initialParams.showroom || "all")
  const [categorySlug, setCategorySlug] = useState(initialParams.category || "all")
  const [fuel, setFuel] = useState(initialParams.fuel || "all")
  const [drive, setDrive] = useState(initialParams.drive || "all")
  const [transmission, setTransmission] = useState(
    initialParams.transmission || "all"
  )
  const [priceRangeId, setPriceRangeId] = useState(initialParams.price || "all")
  const [sortBy, setSortBy] = useState(initialParams.sort || "featured")
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, Number(initialParams.page) || 1)
  )
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Category lookup map for search ranker
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of taxonomy.categories) {
      map.set(cat.id, `${cat.name} ${cat.slug}`)
    }
    return map
  }, [taxonomy.categories])

  // Count how many published vehicles exist per manufacturer for the top brand bar
  const makeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const v of vehicles) {
      counts.set(v.make_id, (counts.get(v.make_id) || 0) + 1)
    }
    return counts
  }, [vehicles])

  // Models for currently selected manufacturer
  const availableModels = useMemo(() => {
    if (!makeId || makeId === "all") return []
    return taxonomy.models.filter((m) => m.make_id === makeId)
  }, [makeId, taxonomy.models])

  // Synchronize URL query parameters cleanly without full page reload
  const syncUrlParams = (overrides: Partial<InitialCatalogParams> = {}) => {
    const nextState: InitialCatalogParams = {
      q: searchQuery.trim(),
      make: makeId,
      model: modelId,
      year,
      condition,
      status,
      showroom: showroomId,
      category: categorySlug,
      fuel,
      drive,
      transmission,
      price: priceRangeId,
      sort: sortBy,
      page: String(currentPage),
      ...overrides,
    }

    const params = new URLSearchParams()
    Object.entries(nextState).forEach(([key, val]) => {
      if (val && val !== "all" && !(key === "page" && val === "1") && !(key === "sort" && val === "featured")) {
        params.set(key, val)
      }
    })

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Filter & Rank Vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    // Step 1: Run multi-field search and primary dropdown filters
    const ranked = searchAndRankVehicles(
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

    let list = ranked.map((r) => r.vehicle)

    // Step 2: Apply extended filters (Category, Fuel, Drive, Transmission, Price Range)
    if (categorySlug && categorySlug !== "all") {
      const targetCat = taxonomy.categories.find(
        (c) => c.slug.toLowerCase() === categorySlug.toLowerCase() || c.id === categorySlug
      )
      if (targetCat) {
        list = list.filter((v) => v.category_ids.includes(targetCat.id))
      }
    }

    if (fuel && fuel !== "all") {
      list = list.filter((v) => v.fuel === fuel)
    }

    if (drive && drive !== "all") {
      list = list.filter(
        (v) => v.drive?.toUpperCase() === drive.toUpperCase()
      )
    }

    if (transmission && transmission !== "all") {
      list = list.filter((v) => v.transmission === transmission)
    }

    if (priceRangeId && priceRangeId !== "all") {
      const range = PRICE_RANGES.find((r) => r.id === priceRangeId)
      if (range) {
        list = list.filter((v) => {
          if (v.price_kes === null) return false
          return v.price_kes >= range.min && v.price_kes <= range.max
        })
      }
    }

    // Step 3: Sort results
    const sorted = [...list]
    if (sortBy === "price_asc") {
      sorted.sort(
        (a, b) => (a.price_kes ?? Infinity) - (b.price_kes ?? Infinity)
      )
    } else if (sortBy === "price_desc") {
      sorted.sort((a, b) => (b.price_kes ?? 0) - (a.price_kes ?? 0))
    } else if (sortBy === "year_desc") {
      sorted.sort((a, b) => (b.year || 0) - (a.year || 0))
    } else if (sortBy === "mileage_asc") {
      sorted.sort(
        (a, b) => (a.mileage_km ?? Infinity) - (b.mileage_km ?? Infinity)
      )
    } else if (!searchQuery.trim()) {
      // Default "featured" sort when no search query is active
      sorted.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1
        if (!a.is_featured && b.is_featured) return 1
        if (a.inventory_status === "in_stock" && b.inventory_status !== "in_stock")
          return -1
        if (a.inventory_status !== "in_stock" && b.inventory_status === "in_stock")
          return 1
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      })
    }

    return sorted
  }, [
    vehicles,
    searchQuery,
    makeId,
    modelId,
    year,
    condition,
    showroomId,
    status,
    categorySlug,
    fuel,
    drive,
    transmission,
    priceRangeId,
    sortBy,
    categoryMap,
    taxonomy.categories,
  ])

  // Pagination calculations
  const totalResults = filteredAndSortedVehicles.length
  const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedVehicles = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedVehicles.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedVehicles, safePage])

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage))
    setCurrentPage(clamped)
    syncUrlParams({ page: String(clamped) })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetAllFilters = () => {
    setSearchQuery("")
    setMakeId("all")
    setModelId("all")
    setYear("all")
    setCondition("all")
    setStatus("all")
    setShowroomId("all")
    setCategorySlug("all")
    setFuel("all")
    setDrive("all")
    setTransmission("all")
    setPriceRangeId("all")
    setSortBy("featured")
    setCurrentPage(1)
    router.replace(pathname, { scroll: false })
  }

  // Active filter chips for quick removal
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = []

    if (searchQuery.trim()) {
      chips.push({
        key: "q",
        label: `Search: "${searchQuery.trim()}"`,
        clear: () => {
          setSearchQuery("")
          setCurrentPage(1)
          syncUrlParams({ q: "", page: "1" })
        },
      })
    }
    if (makeId !== "all") {
      const makeName = taxonomy.makes.find((m) => m.id === makeId)?.name || "Make"
      chips.push({
        key: "make",
        label: `Make: ${makeName}`,
        clear: () => {
          setMakeId("all")
          setModelId("all")
          setCurrentPage(1)
          syncUrlParams({ make: "all", model: "all", page: "1" })
        },
      })
    }
    if (modelId !== "all") {
      const modelName =
        taxonomy.models.find((m) => m.id === modelId)?.name || "Model"
      chips.push({
        key: "model",
        label: `Model: ${modelName}`,
        clear: () => {
          setModelId("all")
          setCurrentPage(1)
          syncUrlParams({ model: "all", page: "1" })
        },
      })
    }
    if (priceRangeId !== "all") {
      const label =
        PRICE_RANGES.find((r) => r.id === priceRangeId)?.label || "Price"
      chips.push({
        key: "price",
        label,
        clear: () => {
          setPriceRangeId("all")
          setCurrentPage(1)
          syncUrlParams({ price: "all", page: "1" })
        },
      })
    }
    if (year !== "all") {
      chips.push({
        key: "year",
        label: `Year: ${year}`,
        clear: () => {
          setYear("all")
          setCurrentPage(1)
          syncUrlParams({ year: "all", page: "1" })
        },
      })
    }
    if (condition !== "all") {
      chips.push({
        key: "condition",
        label: `Condition: ${condition.replace(/_/g, " ")}`,
        clear: () => {
          setCondition("all")
          setCurrentPage(1)
          syncUrlParams({ condition: "all", page: "1" })
        },
      })
    }
    if (status !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${status.replace(/_/g, " ")}`,
        clear: () => {
          setStatus("all")
          setCurrentPage(1)
          syncUrlParams({ status: "all", page: "1" })
        },
      })
    }
    if (categorySlug !== "all") {
      const catName =
        taxonomy.categories.find(
          (c) => c.slug === categorySlug || c.id === categorySlug
        )?.name || categorySlug
      chips.push({
        key: "category",
        label: `Category: ${catName}`,
        clear: () => {
          setCategorySlug("all")
          setCurrentPage(1)
          syncUrlParams({ category: "all", page: "1" })
        },
      })
    }
    if (fuel !== "all") {
      chips.push({
        key: "fuel",
        label: `Fuel: ${fuel.replace(/_/g, " ")}`,
        clear: () => {
          setFuel("all")
          setCurrentPage(1)
          syncUrlParams({ fuel: "all", page: "1" })
        },
      })
    }
    if (drive !== "all") {
      chips.push({
        key: "drive",
        label: `Drive: ${drive}`,
        clear: () => {
          setDrive("all")
          setCurrentPage(1)
          syncUrlParams({ drive: "all", page: "1" })
        },
      })
    }
    if (transmission !== "all") {
      chips.push({
        key: "transmission",
        label: `Trans: ${transmission}`,
        clear: () => {
          setTransmission("all")
          setCurrentPage(1)
          syncUrlParams({ transmission: "all", page: "1" })
        },
      })
    }
    if (showroomId !== "all") {
      const branch =
        taxonomy.showrooms.find((s) => s.id === showroomId)?.name || "Showroom"
      chips.push({
        key: "showroom",
        label: `Showroom: ${branch}`,
        clear: () => {
          setShowroomId("all")
          setCurrentPage(1)
          syncUrlParams({ showroom: "all", page: "1" })
        },
      })
    }

    return chips
  }, [
    searchQuery,
    makeId,
    modelId,
    priceRangeId,
    year,
    condition,
    status,
    categorySlug,
    fuel,
    drive,
    transmission,
    showroomId,
    taxonomy,
  ])

  return (
    <div className="space-y-8">
      {/* =====================================================================
          1. PAGE HEADER & STATS BANNER
      ===================================================================== */}
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-5 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Showroom Catalog
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-foreground">
              Browse Our Vehicle Inventory
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Filter by manufacturer, model, budget, or condition. Hover or tap any logbook folder to preview its inspection sheet.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="rounded-xl border bg-card px-4 py-2.5 text-right shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Showing Matches
              </p>
              <p className="text-xl font-heading font-extrabold text-primary">
                {totalResults}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {vehicles.length} units
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================
            2. MANUFACTURER QUICK-SELECTOR STRIP
            Allows users to select a desired manufacturer and filter out the rest
        =================================================================== */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CarFront className="w-3.5 h-3.5 text-primary" />
              Filter by Manufacturer
            </span>
            {makeId !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setMakeId("all")
                  setModelId("all")
                  setCurrentPage(1)
                  syncUrlParams({ make: "all", model: "all", page: "1" })
                }}
                className="text-xs font-semibold text-brand-red hover:underline cursor-pointer"
              >
                Show all manufacturers
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <button
              type="button"
              onClick={() => {
                setMakeId("all")
                setModelId("all")
                setCurrentPage(1)
                syncUrlParams({ make: "all", model: "all", page: "1" })
              }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                makeId === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <span>All Makes</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                  makeId === "all"
                    ? "bg-brand-red text-brand-red-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {vehicles.length}
              </span>
            </button>

            {taxonomy.makes.map((make) => {
              const count = makeCounts.get(make.id) || 0
              const isSelected = makeId === make.id
              return (
                <button
                  key={make.id}
                  type="button"
                  onClick={() => {
                    const nextMake = isSelected ? "all" : make.id
                    setMakeId(nextMake)
                    setModelId("all")
                    setCurrentPage(1)
                    syncUrlParams({ make: nextMake, model: "all", page: "1" })
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <span>{make.name}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                      isSelected
                        ? "bg-brand-red text-brand-red-foreground font-bold"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. STICKY SEARCH, FILTER & SORT CONTROL BAR
      ===================================================================== */}
      <div className="sticky top-[68px] z-40 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 sm:p-4 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                setCurrentPage(1)
                syncUrlParams({ q: val, page: "1" })
              }}
              placeholder="Search by car name, model, stock #, features (e.g. Prado, Sunroof, Hybrid)..."
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  setCurrentPage(1)
                  syncUrlParams({ q: "", page: "1" })
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop Quick Filter Dropdowns */}
          <div className="hidden xl:flex items-center gap-2">
            {/* Model Select */}
            <Select
              value={modelId}
              onValueChange={(val) => {
                setModelId(val)
                setCurrentPage(1)
                syncUrlParams({ model: val, page: "1" })
              }}
              disabled={makeId === "all"}
            >
              <SelectTrigger className="h-10 rounded-xl w-[150px] bg-background">
                <SelectValue
                  placeholder={
                    makeId === "all" ? "Select Make 1st" : "All Models"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {availableModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Budget / Price Range */}
            <Select
              value={priceRangeId}
              onValueChange={(val) => {
                setPriceRangeId(val)
                setCurrentPage(1)
                syncUrlParams({ price: val, page: "1" })
              }}
            >
              <SelectTrigger className="h-10 rounded-xl w-[160px] bg-background">
                <SelectValue placeholder="Any Budget" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((range) => (
                  <SelectItem key={range.id} value={range.id}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition */}
            <Select
              value={condition}
              onValueChange={(val) => {
                setCondition(val)
                setCurrentPage(1)
                syncUrlParams({ condition: val, page: "1" })
              }}
            >
              <SelectTrigger className="h-10 rounded-xl w-[145px] bg-background">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Condition</SelectItem>
                <SelectItem value="foreign_used">Foreign Used</SelectItem>
                <SelectItem value="locally_used">Locally Used</SelectItem>
                <SelectItem value="brand_new">Brand New</SelectItem>
              </SelectContent>
            </Select>

            {/* Year */}
            <Select
              value={year}
              onValueChange={(val) => {
                setYear(val)
                setCurrentPage(1)
                syncUrlParams({ year: val, page: "1" })
              }}
            >
              <SelectTrigger className="h-10 rounded-xl w-[120px] bg-background">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {STATIC_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort & All Filters Drawer Trigger */}
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val)
                setCurrentPage(1)
                syncUrlParams({ sort: val, page: "1" })
              }}
            >
              <SelectTrigger className="h-10 rounded-xl flex-1 sm:w-[185px] bg-background">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured &amp; Relevance</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="year_desc">Year: Newest First</SelectItem>
                <SelectItem value="mileage_asc">Mileage: Lowest First</SelectItem>
              </SelectContent>
            </Select>

            {/* All Filters Sheet Drawer */}
            <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-3.5 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                  <span>Filters</span>
                  {activeFilterChips.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-brand-red text-brand-red-foreground px-1.5 py-0.2 text-[10px] font-bold">
                      {activeFilterChips.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="font-heading text-xl">
                    Refine Vehicle Search
                  </SheetTitle>
                  <SheetDescription>
                    Filter our showroom catalog by exact specifications.
                  </SheetDescription>
                </SheetHeader>

                <div className="p-4 space-y-4">
                  {/* Make */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Manufacturer
                    </label>
                    <Select
                      value={makeId}
                      onValueChange={(val) => {
                        setMakeId(val)
                        setModelId("all")
                        setCurrentPage(1)
                        syncUrlParams({ make: val, model: "all", page: "1" })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Makes</SelectItem>
                        {taxonomy.makes.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Model
                    </label>
                    <Select
                      value={modelId}
                      onValueChange={(val) => {
                        setModelId(val)
                        setCurrentPage(1)
                        syncUrlParams({ model: val, page: "1" })
                      }}
                      disabled={makeId === "all"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            makeId === "all"
                              ? "Select a Make first"
                              : "All Models"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {availableModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Price Range (KES)
                    </label>
                    <Select
                      value={priceRangeId}
                      onValueChange={(val) => {
                        setPriceRangeId(val)
                        setCurrentPage(1)
                        syncUrlParams({ price: val, page: "1" })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Any Budget" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_RANGES.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Year & Condition */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Year
                      </label>
                      <Select
                        value={year}
                        onValueChange={(val) => {
                          setYear(val)
                          setCurrentPage(1)
                          syncUrlParams({ year: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          {STATIC_YEARS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Condition
                      </label>
                      <Select
                        value={condition}
                        onValueChange={(val) => {
                          setCondition(val)
                          setCurrentPage(1)
                          syncUrlParams({ condition: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Condition</SelectItem>
                          <SelectItem value="foreign_used">Foreign Used</SelectItem>
                          <SelectItem value="locally_used">Locally Used</SelectItem>
                          <SelectItem value="brand_new">Brand New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fuel & Transmission */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Fuel Type
                      </label>
                      <Select
                        value={fuel}
                        onValueChange={(val) => {
                          setFuel(val)
                          setCurrentPage(1)
                          syncUrlParams({ fuel: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any Fuel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Fuel</SelectItem>
                          <SelectItem value="petrol">Petrol</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="plug_in_hybrid">Plug-in Hybrid</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Transmission
                      </label>
                      <Select
                        value={transmission}
                        onValueChange={(val) => {
                          setTransmission(val)
                          setCurrentPage(1)
                          syncUrlParams({ transmission: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Transmission</SelectItem>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Drivetrain & Availability */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Drivetrain
                      </label>
                      <Select
                        value={drive}
                        onValueChange={(val) => {
                          setDrive(val)
                          setCurrentPage(1)
                          syncUrlParams({ drive: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any Drive" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Drivetrain</SelectItem>
                          <SelectItem value="2WD">2WD</SelectItem>
                          <SelectItem value="4WD">4WD</SelectItem>
                          <SelectItem value="AWD">AWD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Availability
                      </label>
                      <Select
                        value={status}
                        onValueChange={(val) => {
                          setStatus(val)
                          setCurrentPage(1)
                          syncUrlParams({ status: val, page: "1" })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Status</SelectItem>
                          <SelectItem value="in_stock">In Stock Now</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Lifestyle Category & Showroom */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Lifestyle Category
                    </label>
                    <Select
                      value={categorySlug}
                      onValueChange={(val) => {
                        setCategorySlug(val)
                        setCurrentPage(1)
                        syncUrlParams({ category: val, page: "1" })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {taxonomy.categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Showroom Location
                    </label>
                    <Select
                      value={showroomId}
                      onValueChange={(val) => {
                        setShowroomId(val)
                        setCurrentPage(1)
                        syncUrlParams({ showroom: val, page: "1" })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {taxonomy.showrooms.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SheetFooter className="p-4 border-t flex flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAllFilters}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex-1 bg-primary text-primary-foreground"
                  >
                    View {totalResults} Cars
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              Active filters:
            </span>
            {activeFilterChips.map((chip) => (
              <Badge
                key={chip.key}
                variant="secondary"
                className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <span className="capitalize">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.clear}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-semibold text-brand-red hover:underline ml-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          4. VEHICLE RESULTS GRID OR EMPTY STATE
      ===================================================================== */}
      {paginatedVehicles.length > 0 ? (
        <div className="space-y-10">
          <VehicleGrid vehicles={paginatedVehicles} keyPrefix="catalog" />

          {/* =================================================================
              5. PAGINATION BAR (PREVIOUS / PAGE NUMBERS / NEXT PAGE)
          ================================================================= */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(safePage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(safePage * ITEMS_PER_PAGE, totalResults)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalResults}
                </span>{" "}
                vehicles (Page {safePage} of {totalPages})
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => handlePageChange(safePage - 1)}
                  className="rounded-xl px-3.5 h-9 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safePage) <= 1
                    )
                    .map((pageNum, idx, arr) => {
                      const prevNum = arr[idx - 1]
                      const showEllipsis = prevNum && pageNum - prevNum > 1
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="px-1.5 text-xs text-muted-foreground">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer",
                              pageNum === safePage
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/10"
                            )}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      )
                    })}
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => handlePageChange(safePage + 1)}
                  className="rounded-xl px-4 h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Next Page
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center space-y-4 bg-muted/20">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CarFront className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-xl font-heading font-bold text-foreground">
              No Matching Vehicles Found
            </h3>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t find any vehicles matching your current filter combination. Try clearing some filters or searching for another model.
            </p>
          </div>
          <Button
            type="button"
            onClick={resetAllFilters}
            className="rounded-full px-6 bg-primary text-primary-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  )
}