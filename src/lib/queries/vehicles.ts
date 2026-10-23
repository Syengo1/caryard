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