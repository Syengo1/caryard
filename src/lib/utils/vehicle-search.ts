export interface SearchableVehicle {
  id: string
  slug: string
  stock_number: string
  title: string
  make_id: string
  model_id: string
  showroom_id: string | null
  make_name: string
  model_name: string
  showroom_name: string
  showroom_city: string
  year: number
  price_kes: number | null
  is_negotiable: boolean
  mileage_km: number | null
  engine_cc: number | null
  condition: string | null
  transmission: string | null
  fuel: string | null
  drive: string | null
  body_type: string | null
  exterior_color: string | null
  interior_color: string | null
  description: string | null
  features: Record<string, unknown>
  category_ids: string[]
  cover_image_path: string | null
  is_featured: boolean
  inventory_status: string
  updated_at: string
}

export interface ActiveVehicleFilters {
  makeId?: string
  modelId?: string
  year?: string
  condition?: string
  showroomId?: string
  status?: string
}

export interface ScoredVehicleResult {
  vehicle: SearchableVehicle
  score: number
  matchedTokens: number
  matchReasons: string[]
}

const SYNONYM_MAP: Record<string, string[]> = {
  auto: ['automatic'],
  manual: ['manual'],
  '4x4': ['4wd', 'awd', 'off-road'],
  '4wd': ['4wd', '4x4'],
  awd: ['awd', '4wd'],
  '2wd': ['2wd', 'fwd', 'rwd'],
  offroad: ['off-road', '4wd', 'awd'],
  import: ['foreign_used', 'foreign used'],
  foreign: ['foreign_used', 'foreign used'],
  local: ['locally_used', 'locally used'],
  locally: ['locally_used', 'locally used'],
  new: ['brand_new', 'brand new'],
  ev: ['electric', 'hybrid'],
  eco: ['hybrid', 'electric'],
  benz: ['mercedes', 'mercedes-benz'],
  merc: ['mercedes', 'mercedes-benz'],
  vw: ['volkswagen'],
  bimmer: ['bmw'],
}

function normalizeText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFeaturesText(features: Record<string, unknown> | null | undefined): string {
  if (!features || typeof features !== 'object') return ''
  const parts: string[] = []

  for (const val of Object.values(features)) {
    if (typeof val === 'string' || typeof val === 'number') {
      parts.push(String(val))
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string' || typeof item === 'number') {
          parts.push(String(item))
        }
      }
    }
  }

  return normalizeText(parts.join(' '))
}

/**
 * Ranks vehicles by multi-field relevance score against a natural language query
 * and optional active dropdown filters.
 */
export function searchAndRankVehicles(
  vehicles: SearchableVehicle[],
  rawQuery: string,
  filters?: ActiveVehicleFilters,
  categoryMap?: Map<string, string>
): ScoredVehicleResult[] {
  const normalizedQuery = normalizeText(rawQuery)
  const rawTokens = normalizedQuery.split(' ').filter((t) => t.length > 0)

  const filteredPool = vehicles.filter((v) => {
    if (filters?.makeId && filters.makeId !== 'all' && v.make_id !== filters.makeId) {
      return false
    }
    if (filters?.modelId && filters.modelId !== 'all' && v.model_id !== filters.modelId) {
      return false
    }
    if (filters?.year && filters.year !== 'all' && String(v.year) !== filters.year) {
      return false
    }
    if (filters?.condition && filters.condition !== 'all' && v.condition !== filters.condition) {
      return false
    }
    if (filters?.showroomId && filters.showroomId !== 'all' && v.showroom_id !== filters.showroomId) {
      return false
    }
    if (filters?.status && filters.status !== 'all' && v.inventory_status !== filters.status) {
      return false
    }
    return true
  })

  if (rawTokens.length === 0) {
    return filteredPool.map((vehicle) => ({
      vehicle,
      score: (vehicle.is_featured ? 20 : 0) + (vehicle.inventory_status === 'in_stock' ? 10 : 0),
      matchedTokens: 0,
      matchReasons: [],
    }))
  }

  const scoredResults: ScoredVehicleResult[] = []

  for (const v of filteredPool) {
    let score = 0
    let matchedTokens = 0
    const reasonsSet = new Set<string>()

    const titleNorm = normalizeText(v.title)
    const makeNorm = normalizeText(v.make_name)
    const modelNorm = normalizeText(v.model_name)
    const yearStr = String(v.year || '')
    const stockNorm = normalizeText(v.stock_number)
    const compositeIdentity = `${yearStr} ${makeNorm} ${modelNorm} ${titleNorm}`.trim()

    const bodyNorm = normalizeText(v.body_type)
    const fuelNorm = normalizeText(v.fuel)
    const transNorm = normalizeText(v.transmission)
    const driveNorm = normalizeText(v.drive)
    const conditionNorm = normalizeText(v.condition)
    const extColorNorm = normalizeText(v.exterior_color)
    const intColorNorm = normalizeText(v.interior_color)
    const engineStr = v.engine_cc ? `${v.engine_cc} ${v.engine_cc}cc` : ''

    const showroomNorm = normalizeText(`${v.showroom_name} ${v.showroom_city}`)
    const featuresNorm = extractFeaturesText(v.features)
    const descNorm = normalizeText(v.description)

    const categoryNamesNorm = v.category_ids
      .map((id) => normalizeText(categoryMap?.get(id) || ''))
      .join(' ')

    const titleWords = titleNorm.split(' ').filter(Boolean)

    // Tier 0: Full-Phrase Boosts
    if (stockNorm === normalizedQuery || normalizeText(v.stock_number.replace('-', '')) === normalizedQuery) {
      score += 150
      reasonsSet.add('Exact Stock #')
    }
    if (titleNorm === normalizedQuery || `${yearStr} ${makeNorm} ${modelNorm}` === normalizedQuery) {
      score += 120
      reasonsSet.add('Exact Match')
    } else if (titleNorm.startsWith(normalizedQuery) || `${makeNorm} ${modelNorm}`.startsWith(normalizedQuery)) {
      score += 90
    } else if (compositeIdentity.includes(normalizedQuery)) {
      score += 70
    }

    // Tier 1 to 3: Per-Token Evaluation
    for (const token of rawTokens) {
      let tokenMatched = false
      const expandedTerms = [token, ...(SYNONYM_MAP[token] || [])]

      for (const term of expandedTerms) {
        if (modelNorm === term) {
          score += 65
          tokenMatched = true
          reasonsSet.add('Model')
        } else if (modelNorm.startsWith(term)) {
          score += 55
          tokenMatched = true
          reasonsSet.add('Model')
        } else if (modelNorm.includes(term) && term.length >= 2) {
          score += 40
          tokenMatched = true
          reasonsSet.add('Model')
        }

        if (makeNorm === term) {
          score += 60
          tokenMatched = true
          reasonsSet.add('Make')
        } else if (makeNorm.startsWith(term)) {
          score += 50
          tokenMatched = true
          reasonsSet.add('Make')
        } else if (makeNorm.includes(term) && term.length >= 2) {
          score += 35
          tokenMatched = true
          reasonsSet.add('Make')
        }

        if (titleWords.some((w) => w === term)) {
          score += 55
          tokenMatched = true
          reasonsSet.add('Title')
        } else if (titleWords.some((w) => w.startsWith(term))) {
          score += 45
          tokenMatched = true
          reasonsSet.add('Title')
        } else if (titleNorm.includes(term) && term.length >= 2) {
          score += 30
          tokenMatched = true
          reasonsSet.add('Title')
        }

        if (yearStr === term) {
          score += 55
          tokenMatched = true
          reasonsSet.add('Year')
        } else if (yearStr.startsWith(term) && term.length >= 2) {
          score += 20
          tokenMatched = true
        }

        if (stockNorm.includes(term) && term.length >= 2) {
          score += 45
          tokenMatched = true
          reasonsSet.add('Stock #')
        }

        if (
          fuelNorm === term ||
          driveNorm === term ||
          transNorm === term ||
          bodyNorm === term ||
          conditionNorm.includes(term) ||
          engineStr.split(' ').includes(term)
        ) {
          score += 38
          tokenMatched = true
          reasonsSet.add('Specs')
        } else if (
          (fuelNorm.startsWith(term) ||
            driveNorm.startsWith(term) ||
            transNorm.startsWith(term) ||
            bodyNorm.startsWith(term)) &&
          term.length >= 2
        ) {
          score += 24
          tokenMatched = true
          reasonsSet.add('Specs')
        }

        if (
          (extColorNorm && extColorNorm.includes(term)) ||
          (intColorNorm && intColorNorm.includes(term))
        ) {
          score += 32
          tokenMatched = true
          reasonsSet.add('Color')
        }

        if (showroomNorm && showroomNorm.includes(term) && term.length >= 2) {
          score += 28
          tokenMatched = true
          reasonsSet.add('Location')
        }

        if (categoryNamesNorm && categoryNamesNorm.includes(term) && term.length >= 2) {
          score += 26
          tokenMatched = true
          reasonsSet.add('Category')
        }

        if (featuresNorm && featuresNorm.includes(term) && term.length >= 2) {
          score += 20
          tokenMatched = true
          reasonsSet.add('Features')
        }

        if (descNorm && descNorm.includes(term) && term.length >= 3) {
          score += 12
          tokenMatched = true
          reasonsSet.add('Description')
        }
      }

      if (tokenMatched) {
        matchedTokens += 1
      }
    }

    if (matchedTokens === 0) continue

    const requiredMatches = rawTokens.length <= 2 ? rawTokens.length : Math.ceil(rawTokens.length * 0.75)
    if (matchedTokens < requiredMatches) continue

    if (matchedTokens === rawTokens.length) {
      score += 40 * rawTokens.length
    }

    if (v.is_featured) score += 5
    if (v.inventory_status === 'in_stock') score += 3

    scoredResults.push({
      vehicle: v,
      score,
      matchedTokens,
      matchReasons: Array.from(reasonsSet).slice(0, 3),
    })
  }

  return scoredResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.matchedTokens !== a.matchedTokens) return b.matchedTokens - a.matchedTokens
    return (b.vehicle.year || 0) - (a.vehicle.year || 0)
  })
}

export function getVehicleCoverUrl(storagePath: string | null): string | null {
  if (!storagePath) return null
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET || 'vehicle-images'
  if (!baseUrl) return null
  return `${baseUrl}/storage/v1/object/public/${bucket}/${storagePath}`
}