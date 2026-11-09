import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/auth/roles'
import type { SearchableVehicle } from '@/lib/utils/vehicle-search'

/**
 * Fetches the complete inventory for the Admin Dashboard
 */
export async function getAdminInventory() {
  await requireStaffOrAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      stock_number,
      title,
      year,
      price_kes,
      inventory_status,
      publication_status,
      updated_at,
      makes ( name ),
      models ( name ),
      vehicle_images ( id, storage_path, is_cover )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Admin inventory error: ${error.message}`)
  return data
}

/**
 * Fetches a single vehicle with its private details for the Admin Edit Wizard
 */
export async function getVehicleForEdit(id: string) {
  await requireStaffOrAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      vehicle_private_details (*),
      vehicle_categories ( category_id ),
      vehicle_images ( id, storage_path, is_cover, display_order )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(`Edit vehicle error: ${error.message}`)
  return data
}

/**
 * Fetches only published vehicles for the public-facing catalog
 */
export async function getPublicVehicles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      slug,
      title,
      year,
      price_kes,
      mileage_km,
      transmission,
      fuel,
      inventory_status,
      makes ( name ),
      models ( name ),
      vehicle_images ( storage_path, is_cover, display_order )
    `)
    .eq('publication_status', 'published')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Public catalog error: ${error.message}`)

  return data.map((vehicle) => {
    const sortedImages = [...(vehicle.vehicle_images || [])].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })

    return {
      ...vehicle,
      cover_image: sortedImages[0]?.storage_path || null,
    }
  })
}

// Internal raw row type for safe casting from Supabase
interface RawSearchableVehicleRow {
  id: string
  slug: string
  stock_number: string
  title: string
  make_id: string
  model_id: string
  showroom_id: string | null
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
  features: Record<string, unknown> | null
  is_featured: boolean
  inventory_status: string
  updated_at: string
  makes: { name: string } | { name: string }[] | null
  models: { name: string } | { name: string }[] | null
  showrooms: { name: string; city: string } | { name: string; city: string }[] | null
  vehicle_categories: { category_id: string }[] | null
  vehicle_images: { storage_path: string; is_cover: boolean; display_order: number }[] | null
}

/**
 * Fetches rich searchable vehicle records for the instant Hero & Catalog search engine
 */
export async function getSearchableVehicles(): Promise<SearchableVehicle[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      slug,
      stock_number,
      title,
      make_id,
      model_id,
      showroom_id,
      year,
      price_kes,
      is_negotiable,
      mileage_km,
      engine_cc,
      condition,
      transmission,
      fuel,
      drive,
      body_type,
      exterior_color,
      interior_color,
      description,
      features,
      is_featured,
      inventory_status,
      updated_at,
      makes ( name ),
      models ( name ),
      showrooms ( name, city ),
      vehicle_categories ( category_id ),
      vehicle_images ( storage_path, is_cover, display_order )
    `)
    .eq('publication_status', 'published')
    .order('is_featured', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`Searchable vehicles error: ${error.message}`)

  const rows = (data || []) as unknown as RawSearchableVehicleRow[]

  return rows.map((row) => {
    const makeObj = Array.isArray(row.makes) ? row.makes[0] : row.makes
    const modelObj = Array.isArray(row.models) ? row.models[0] : row.models
    const showroomObj = Array.isArray(row.showrooms) ? row.showrooms[0] : row.showrooms

    const sortedImages = [...(row.vehicle_images || [])].sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })

    return {
      id: row.id,
      slug: row.slug,
      stock_number: row.stock_number,
      title: row.title,
      make_id: row.make_id,
      model_id: row.model_id,
      showroom_id: row.showroom_id,
      make_name: makeObj?.name || '',
      model_name: modelObj?.name || '',
      showroom_name: showroomObj?.name || '',
      showroom_city: showroomObj?.city || '',
      year: row.year,
      price_kes: row.price_kes,
      is_negotiable: row.is_negotiable,
      mileage_km: row.mileage_km,
      engine_cc: row.engine_cc,
      condition: row.condition,
      transmission: row.transmission,
      fuel: row.fuel,
      drive: row.drive,
      body_type: row.body_type,
      exterior_color: row.exterior_color,
      interior_color: row.interior_color,
      description: row.description,
      features: row.features || {},
      category_ids: (row.vehicle_categories || []).map((c) => c.category_id),
      cover_image_path: sortedImages[0]?.storage_path || null,
      // NEW: Pass the 2nd uploaded photo (or fallback to cover) for the inner Layer 2 file card
      secondary_image_path:
        sortedImages[1]?.storage_path || sortedImages[0]?.storage_path || null,
      image_count: sortedImages.length,
      is_featured: row.is_featured,
      inventory_status: row.inventory_status,
      updated_at: row.updated_at,
    }
  })
}

/**
 * Fetches recent unfinished drafts for the Draft Recovery screen
 */
export async function getRecentDrafts() {
  await requireStaffOrAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      title,
      updated_at,
      makes ( name ),
      models ( name )
    `)
    .eq('publication_status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(3)

  if (error) throw new Error(`Drafts error: ${error.message}`)
  return data || []
}


export interface PublicVehicleDetail {
  id: string
  slug: string
  stock_number: string
  title: string
  make_id: string
  model_id: string
  showroom_id: string | null
  make_name: string
  make_slug: string
  model_name: string
  model_slug: string
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
  features: {
    horsepower?: string | null
    torque?: string | null
    zero_to_hundred?: string | null
    seat_capacity?: number | null
    upholstery?: string | null
    cargo_space?: string | null
    sound_system?: string | null
    climate_control?: string | null
    fuel_efficiency?: string | null
    ground_clearance?: string | null
    towing_capacity?: string | null
    interior_lighting?: string | null
    infotainment?: string | null
    duty_status?: string | null
    additional_features?: string[]
  }
  is_featured: boolean
  inventory_status: string
  published_at: string | null
  updated_at: string
  images: {
    id: string
    url: string
    storage_path: string
    alt_text: string | null
    is_cover: boolean
    display_order: number
  }[]
  categories: {
    id: string
    name: string
    slug: string
  }[]
  showroom: {
    id: string
    name: string
    city: string
    address: string
    phone: string
    whatsapp_number: string
    google_maps_url: string | null
    opening_hours: string | null
  } | null
  financeSettings: {
    businessName: string
    primaryPhone: string
    primaryWhatsapp: string
    minDepositPct: number
    defaultMonths: number
    annualInterestPct: number
  }
}

/**
 * Fetches a single published vehicle by slug with full gallery, showroom, and finance settings
 */
export async function getPublicVehicleBySlug(
  slug: string
): Promise<PublicVehicleDetail | null> {
  const supabase = await createClient()

  const [vehicleRes, settingsRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select(`
        id,
        slug,
        stock_number,
        title,
        make_id,
        model_id,
        showroom_id,
        year,
        price_kes,
        is_negotiable,
        mileage_km,
        engine_cc,
        condition,
        transmission,
        fuel,
        drive,
        body_type,
        exterior_color,
        interior_color,
        description,
        features,
        is_featured,
        inventory_status,
        published_at,
        updated_at,
        makes ( id, name, slug ),
        models ( id, name, slug ),
        showrooms ( id, name, city, address, phone, whatsapp_number, google_maps_url, opening_hours ),
        vehicle_categories ( categories ( id, name, slug ) ),
        vehicle_images ( id, storage_path, alt_text, is_cover, display_order )
      `)
      .eq('slug', slug)
      .eq('publication_status', 'published')
      .maybeSingle(),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  if (vehicleRes.error || !vehicleRes.data) {
    return null
  }

  const row = vehicleRes.data as Record<string, unknown>
  const makeObj = (Array.isArray(row.makes) ? row.makes[0] : row.makes) as
    | { id: string; name: string; slug: string }
    | null
  const modelObj = (Array.isArray(row.models) ? row.models[0] : row.models) as
    | { id: string; name: string; slug: string }
    | null
  const showroomObj = (
    Array.isArray(row.showrooms) ? row.showrooms[0] : row.showrooms
  ) as PublicVehicleDetail['showroom']

  const rawImages = (row.vehicle_images || []) as {
    id: string
    storage_path: string
    alt_text: string | null
    is_cover: boolean
    display_order: number
  }[]

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_VEHICLE_BUCKET || 'vehicle-images'

  const sortedImages = [...rawImages]
    .sort((a, b) => {
      if (a.is_cover && !b.is_cover) return -1
      if (!a.is_cover && b.is_cover) return 1
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })
    .map((img) => ({
      ...img,
      url: `${baseUrl}/storage/v1/object/public/${bucket}/${img.storage_path}`,
    }))

  const rawCategories = (row.vehicle_categories || []) as {
    categories:
      | { id: string; name: string; slug: string }
      | { id: string; name: string; slug: string }[]
      | null
  }[]

  const categories = rawCategories
    .map((item) =>
      Array.isArray(item.categories) ? item.categories[0] : item.categories
    )
    .filter(
      (cat): cat is { id: string; name: string; slug: string } =>
        cat !== null && cat !== undefined
    )

  const settings = settingsRes.data

  return {
    id: String(row.id),
    slug: String(row.slug),
    stock_number: String(row.stock_number || ''),
    title:
      String(row.title || '') ||
      `${row.year || ''} ${makeObj?.name || ''} ${modelObj?.name || ''}`.trim(),
    make_id: String(row.make_id || ''),
    model_id: String(row.model_id || ''),
    showroom_id: row.showroom_id ? String(row.showroom_id) : null,
    make_name: makeObj?.name || '',
    make_slug: makeObj?.slug || '',
    model_name: modelObj?.name || '',
    model_slug: modelObj?.slug || '',
    year: Number(row.year || new Date().getFullYear()),
    price_kes: row.price_kes !== null ? Number(row.price_kes) : null,
    is_negotiable: Boolean(row.is_negotiable),
    mileage_km: row.mileage_km !== null ? Number(row.mileage_km) : null,
    engine_cc: row.engine_cc !== null ? Number(row.engine_cc) : null,
    condition: row.condition ? String(row.condition) : null,
    transmission: row.transmission ? String(row.transmission) : null,
    fuel: row.fuel ? String(row.fuel) : null,
    drive: row.drive ? String(row.drive) : null,
    body_type: row.body_type ? String(row.body_type) : null,
    exterior_color: row.exterior_color ? String(row.exterior_color) : null,
    interior_color: row.interior_color ? String(row.interior_color) : null,
    description: row.description ? String(row.description) : null,
    features: (row.features as PublicVehicleDetail['features']) || {},
    is_featured: Boolean(row.is_featured),
    inventory_status: String(row.inventory_status || 'in_stock'),
    published_at: row.published_at ? String(row.published_at) : null,
    updated_at: String(row.updated_at || ''),
    images: sortedImages,
    categories,
    showroom: showroomObj || null,
    financeSettings: {
      businessName: settings?.business_name || 'MotaMotors',
      primaryPhone:
        showroomObj?.phone || settings?.primary_phone || '+254 700 000 000',
      primaryWhatsapp:
        showroomObj?.whatsapp_number ||
        settings?.primary_whatsapp ||
        '254700000000',
      minDepositPct: Number(settings?.finance_min_deposit_pct ?? 30),
      defaultMonths: Number(settings?.finance_default_months ?? 24),
      annualInterestPct: Number(settings?.finance_annual_interest_pct ?? 14),
    },
  }
}

/**
 * Recommends up to 6 similar published vehicles based on body type, price band, make, and specs
 */
export async function getSimilarVehicles(
  current: PublicVehicleDetail,
  limit = 6
): Promise<SearchableVehicle[]> {
  const allVehicles = await getSearchableVehicles()

  const candidates = allVehicles.filter((v) => v.id !== current.id)

  const scored = candidates.map((candidate) => {
    let similarity = 0

    // 1. Same Body Type (e.g., SUV, Saloon, Hatchback)
    if (
      current.body_type &&
      candidate.body_type &&
      current.body_type.toLowerCase() === candidate.body_type.toLowerCase()
    ) {
      similarity += 35
    }

    // 2. Price proximity (within +/- 30%)
    if (current.price_kes && candidate.price_kes) {
      const diffRatio =
        Math.abs(current.price_kes - candidate.price_kes) / current.price_kes
      if (diffRatio <= 0.15) similarity += 30
      else if (diffRatio <= 0.3) similarity += 20
      else if (diffRatio <= 0.5) similarity += 10
    }

    // 3. Same Make / Manufacturer
    if (current.make_id === candidate.make_id) {
      similarity += 25
    }

    // 4. Same Model
    if (current.model_id === candidate.model_id) {
      similarity += 20
    }

    // 5. Matching Fuel, Drivetrain, Condition & Categories
    if (current.fuel && current.fuel === candidate.fuel) similarity += 10
    if (current.drive && current.drive === candidate.drive) similarity += 10
    if (current.condition && current.condition === candidate.condition) similarity += 8

    const sharedCategories = candidate.category_ids.filter((catId) =>
      current.categories.some((c) => c.id === catId)
    ).length
    similarity += sharedCategories * 12

    // Prefer in-stock units
    if (candidate.inventory_status === 'in_stock') similarity += 5

    return { vehicle: candidate, similarity }
  })

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((item) => item.vehicle)
}