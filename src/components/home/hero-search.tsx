// src/components/home/hero-search.tsx
"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  ArrowUpRight,
  ArrowRight,
  X,
  CarFront,
  Sparkles,
  MapPin,
  Tag,
  Gauge,
  Fuel,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings2,
  CheckCircle2,
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

const STATIC_YEARS = Array.from({ length: 16 }, (_, i) => (new Date().getFullYear() - i).toString())

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
  const filterScrollRef = useRef<HTMLDivElement>(null)

  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(true)

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

  // Handle Filter Scroll Visibility
  const handleScroll = () => {
    if (!filterScrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = filterScrollRef.current
    setShowLeftScroll(scrollLeft > 0)
    setShowRightScroll(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
  }

  const scrollFilters = (direction: 'left' | 'right') => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      filterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // 1. PRIMARY: Ranked Inventory Vehicle Matches
  const rankedVehicleMatches = useMemo(() => {
    if (!searchQuery.trim()) return []
    return searchAndRankVehicles(
      vehicles,
      searchQuery,
      { makeId, modelId, year, condition, showroomId, status },
      categoryMap
    )
  }, [vehicles, searchQuery, makeId, modelId, year, condition, showroomId, status, categoryMap])

  const topVehicleResults = useMemo(() => rankedVehicleMatches.slice(0, 5), [rankedVehicleMatches])

  // 2. SECONDARY: Smart Taxonomy & Filter Suggestions
  const suggestions = useMemo<SearchSuggestion[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []

    const results: SearchSuggestion[] = []

    for (const make of taxonomy.makes) {
      if (make.name.toLowerCase().includes(q)) {
        results.push({
          id: `make-${make.id}`,
          label: `Filter by ${make.name}`,
          sublabel: "Manufacturer",
          type: "make",
          apply: () => { setMakeId(make.id); setModelId("all"); setSearchQuery(""); setIsSearchFocused(false); },
        })
      }
    }

    for (const model of taxonomy.models) {
      const parentMake = taxonomy.makes.find((m) => m.id === model.make_id)
      const fullName = `${parentMake?.name || ""} ${model.name}`.trim().toLowerCase()
      if (model.name.toLowerCase().includes(q) || fullName.includes(q)) {
        results.push({
          id: `model-${model.id}`,
          label: `${parentMake?.name ? `${parentMake.name} ` : ""}${model.name}`,
          sublabel: model.default_body_type ? `${model.default_body_type} • Model Filter` : "Model Filter",
          type: "model",
          apply: () => { setMakeId(model.make_id); setModelId(model.id); setSearchQuery(""); setIsSearchFocused(false); },
        })
      }
    }

    for (const cat of taxonomy.categories) {
      if (cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)) {
        results.push({
          id: `cat-${cat.id}`,
          label: cat.name,
          sublabel: "Lifestyle Category",
          type: "category",
          apply: () => { router.push(`/vehicles?category=${encodeURIComponent(cat.slug)}`) },
        })
      }
    }

    for (const branch of taxonomy.showrooms) {
      if (branch.name.toLowerCase().includes(q) || branch.city.toLowerCase().includes(q)) {
        results.push({
          id: `branch-${branch.id}`,
          label: `${branch.name} (${branch.city})`,
          sublabel: "Showroom Location",
          type: "showroom",
          apply: () => { setShowroomId(branch.id); setSearchQuery(""); setIsSearchFocused(false); },
        })
      }
    }

    return results.slice(0, 4)
  }, [searchQuery, taxonomy, router])

  const totalNavigableCount = topVehicleResults.length + suggestions.length
  const hasActiveFilters = makeId !== "all" || modelId !== "all" || year !== "all" || condition !== "all" || showroomId !== "all" || status !== "all"

  const resetAllFilters = () => {
    setMakeId("all"); setModelId("all"); setYear("all"); setCondition("all"); setShowroomId("all"); setStatus("all");
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const params = new URLSearchParams()
    const trimmedQuery = searchQuery.trim()

    let resolvedMakeId = makeId !== "all" ? makeId : ""
    let resolvedModelId = modelId !== "all" ? modelId : ""

    if (trimmedQuery) {
      const lowerQ = trimmedQuery.toLowerCase()
      if (!resolvedMakeId) {
        const matchedMake = taxonomy.makes.find((m) => m.name.toLowerCase() === lowerQ)
        if (matchedMake) resolvedMakeId = matchedMake.id
      }
      if (!resolvedModelId) {
        const matchedModel = taxonomy.models.find((m) => m.name.toLowerCase() === lowerQ)
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchFocused || totalNavigableCount === 0) {
      if (e.key === "Enter") handleSearch()
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault(); setHighlightedIndex((prev) => prev < totalNavigableCount - 1 ? prev + 1 : 0)
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setHighlightedIndex((prev) => prev > 0 ? prev - 1 : totalNavigableCount - 1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        if (highlightedIndex < topVehicleResults.length) {
          const targetVehicle = topVehicleResults[highlightedIndex]?.vehicle
          if (targetVehicle) { setIsSearchFocused(false); router.push(`/vehicles/${targetVehicle.slug}`); return; }
        } else {
          const targetSuggestion = suggestions[highlightedIndex - topVehicleResults.length]
          if (targetSuggestion) { targetSuggestion.apply(); return; }
        }
      }
      handleSearch()
    } else if (e.key === "Escape") {
      setIsSearchFocused(false)
    }
  }

  const formatPriceKES = (price: number | null) => price ? `KSh ${price.toLocaleString("en-KE")}` : "Price on Request"
  const showDropdown = isSearchFocused && searchQuery.trim().length > 0

  return (
    <div className="w-full mx-auto rounded-xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-sm px-3 py-3 sm:px-5 sm:py-4 transition-all duration-300">
      {/* 1. Clean Full-Width Search Input */}
      <div ref={searchContainerRef} className="relative w-full">
        <input
          type="search"
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setHighlightedIndex(-1)
            setIsSearchFocused(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Find your dream car"
          className="w-full text-sm sm:text-base rounded-xl pl-4 sm:pl-5 pr-24 h-11 sm:h-12 border border-border bg-background focus:border-primary focus:ring-3 focus:ring-primary/15 transition-all outline-none placeholder:text-muted-foreground/65 text-foreground"
          autoComplete="off"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setHighlightedIndex(-1)
            }}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSearch()}
          aria-label="Search inventory"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 transition-all text-white shadow-xs cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Unified Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 rounded-2xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[70vh] flex flex-col">
            <div className="overflow-y-auto divide-y divide-border">
              
              {/* Matching Vehicles */}
              <div>
                <div className="px-4 py-3 bg-muted/40 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="uppercase tracking-wider flex items-center gap-1.5"><CarFront className="w-4 h-4 text-primary" /> Matching Vehicles ({rankedVehicleMatches.length})</span>
                  {rankedVehicleMatches.length > 0 && <button type="button" onClick={() => handleSearch()} className="text-primary hover:underline font-medium inline-flex items-center gap-1">View all <ArrowUpRight className="w-4 h-4" /></button>}
                </div>

                {topVehicleResults.length > 0 ? (
                  <ul role="listbox" className="divide-y divide-border/50">
                    {topVehicleResults.map((result, idx) => {
                      const { vehicle, matchReasons } = result
                      const coverUrl = getVehicleCoverUrl(vehicle.cover_image_path)
                      const displayTitle = vehicle.title || `${vehicle.year} ${vehicle.make_name} ${vehicle.model_name}`.trim()
                      return (
                        <li key={vehicle.id}>
                          <Link href={`/vehicles/${vehicle.slug}`} onClick={() => setIsSearchFocused(false)} onMouseEnter={() => setHighlightedIndex(idx)} className={cn("w-full px-5 py-4 flex items-center justify-between gap-4 transition-colors", highlightedIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-muted/50")}>
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl bg-muted border overflow-hidden shrink-0 flex items-center justify-center relative">
                                {coverUrl ? <img src={coverUrl} alt={displayTitle} className="w-full h-full object-cover" /> : <CarFront className="w-8 h-8 text-muted-foreground/40" />}
                              </div>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-heading font-semibold text-base sm:text-lg text-foreground truncate">{displayTitle}</span>
                                  <Badge variant={vehicle.inventory_status === "in_stock" ? "default" : "secondary"} className={cn("text-[11px] px-2 py-0.5 capitalize", vehicle.inventory_status === "in_stock" && "bg-emerald-600 hover:bg-emerald-600 text-white")}>
                                    {vehicle.inventory_status === "in_stock" ? "In Stock" : vehicle.inventory_status.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground hidden sm:flex">
                                  <span className="font-medium text-foreground/80">{vehicle.year}</span>
                                  {vehicle.condition && <><span>•</span><span className="capitalize">{vehicle.condition.replace("_", " ")}</span></>}
                                  {vehicle.mileage_km !== null && <><span>•</span><span className="inline-flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />{vehicle.mileage_km.toLocaleString()} km</span></>}
                                  {vehicle.fuel && <><span>•</span><span className="inline-flex items-center gap-1 capitalize"><Fuel className="w-3.5 h-3.5" />{vehicle.fuel.replace("_", " ")}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-4">
                              <div>
                                <p className="font-heading font-bold text-base sm:text-lg text-primary">{formatPriceKES(vehicle.price_kes)}</p>
                                <p className="text-xs text-muted-foreground font-mono">{vehicle.stock_number}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="px-5 py-8 text-center space-y-2">
                    <p className="text-base text-muted-foreground">No vehicles matched &quot;<span className="font-medium text-foreground">{searchQuery}</span>&quot;.</p>
                  </div>
                )}
              </div>

              {/* Smart Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="px-5 py-3 bg-muted/40 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-600" /> Smart Suggestions</span>
                  </div>
                  <ul className="divide-y divide-border/40">
                    {suggestions.map((item, sIdx) => {
                      const globalIdx = topVehicleResults.length + sIdx
                      return (
                        <li key={item.id}>
                          <button type="button" onClick={item.apply} onMouseEnter={() => setHighlightedIndex(globalIdx)} className={cn("w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 transition-colors", highlightedIndex === globalIdx ? "bg-accent text-accent-foreground" : "hover:bg-muted/50")}>
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                                {item.type === "make" || item.type === "model" ? <CarFront className="w-4 h-4" /> : item.type === "showroom" ? <MapPin className="w-4 h-4" /> : item.type === "category" ? <Tag className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                              </div>
                              <div className="truncate">
                                <p className="text-sm sm:text-base font-medium text-foreground truncate">{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="capitalize text-xs shrink-0">{item.type}</Badge>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. LARGER HORIZONTAL SCROLLABLE FILTERS (py-4 instead of py-3) */}
      <div className="relative w-full mt-2">
        <div className={cn("absolute left-0 top-0 h-full w-14 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 transition-opacity duration-200 rounded-l-xl", showLeftScroll ? "opacity-100" : "opacity-0")} />
        <button onClick={() => scrollFilters('left')} className={cn("absolute left-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm border hidden md:flex hover:bg-accent transition-colors", showLeftScroll ? "opacity-100" : "opacity-0 pointer-events-none")} aria-label="Scroll left">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>

        <div
          ref={filterScrollRef}
          onScroll={handleScroll}
          className="flex justify-start gap-x-4 items-center flex-nowrap w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth py-1 px-1"
        >
          <Select value={makeId} onValueChange={(val) => { setMakeId(val); setModelId("all"); }}>
            {/* CHANGED: px-6 py-4 for taller pills */}
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0">
              <CarFront className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder="Make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {taxonomy.makes.map((make) => <SelectItem key={make.id} value={make.id}>{make.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={modelId} onValueChange={setModelId} disabled={!makeId || makeId === "all"}>
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0 disabled:opacity-50">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder={!makeId || makeId === "all" ? "Choose Make First" : "All Models"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{!makeId || makeId === "all" ? "Choose Make First" : "All Models"}</SelectItem>
              {availableModels.map((model) => <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {STATIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder="Used Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Condition</SelectItem>
              <SelectItem value="foreign_used">Foreign Used</SelectItem>
              <SelectItem value="locally_used">Locally Used</SelectItem>
              <SelectItem value="brand_new">Brand New</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0">
              <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              <SelectItem value="in_stock">In Stock Now</SelectItem>
              <SelectItem value="in_transit">On the Way</SelectItem>
            </SelectContent>
          </Select>

          <Select value={showroomId} onValueChange={setShowroomId}>
            <SelectTrigger className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 h-auto whitespace-nowrap border cursor-pointer border-border rounded-[1.2rem] bg-card text-foreground hover:border-primary/50 hover:bg-accent font-medium text-base shadow-sm focus:ring-0 focus:ring-offset-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {taxonomy.showrooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <button onClick={resetAllFilters} className="inline-flex relative gap-1.5 items-center transition ease-in-out px-5 py-3 whitespace-nowrap border border-destructive/30 rounded-[1.2rem] bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium text-base shadow-sm ml-2">
              <X className="w-5 h-5" /> Reset
            </button>
          )}
        </div>

        <div className={cn("absolute right-0 top-0 h-full w-14 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 transition-opacity duration-200 rounded-r-xl", showRightScroll ? "opacity-100" : "opacity-0")} />
        <button onClick={() => scrollFilters('right')} className={cn("absolute right-0 top-1/2 z-20 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm border hidden md:flex hover:bg-accent transition-colors", showRightScroll ? "opacity-100" : "opacity-0 pointer-events-none")} aria-label="Scroll right">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </div>
  )
}