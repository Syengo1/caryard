'use server'

import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin, requireAdmin } from '@/lib/auth/roles'
import { 
  saveDraftVehicleSchema, 
  publishVehicleSchema,
  type SaveDraftVehicleInput
} from '@/lib/validations/vehicle'
import type { ActionResponse } from '@/types/action-response'

async function generateVehicleSlug(
  supabase: SupabaseClient<Database>,
  year: number,
  makeId: string,
  modelId: string,
  stockNumber: string
): Promise<string> {
  const { data } = await supabase
    .from('models')
    .select('name, makes(name)')
    .eq('id', modelId)
    .single()

  const makeObj = data?.makes as { name: string } | null
  const makeName = makeObj?.name || 'vehicle'
  const modelName = data?.name || 'model'
  
  const raw = `${year}-${makeName}-${modelName}-${stockNumber}`
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function saveVehicleDraft(
  input: SaveDraftVehicleInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireStaffOrAdmin()
    
    const parsed = saveDraftVehicleSchema.safeParse(input)
    if (!parsed.success) {
      console.error("[Server Action] Zod Validation Failed:", parsed.error.flatten())
      return { 
        success: false, 
        error: 'Validation failed', 
        fieldErrors: parsed.error.flatten().fieldErrors 
      }
    }

    const data = parsed.data

    if (!data.make_id || !data.model_id || !data.year) {
      return { 
        success: false, 
        error: 'Make, Model, and Year are required to save a vehicle to the database.' 
      }
    }

    const supabase = await createClient()

    const stockNumber = data.stock_number || `CY-${Date.now().toString().slice(-6)}`
    
    // FIXED: Removed data.slug since Zod no longer tracks it (Server generated only)
    let slug = `draft-${stockNumber}-${Date.now().toString().slice(-4)}`
    
    if (data.make_id && data.model_id && data.year) {
      try {
         slug = await generateVehicleSlug(supabase, data.year, data.make_id, data.model_id, stockNumber)
      } catch (e) {
         console.warn('Failed to generate pretty slug, using fallback.', e)
      }
    }

    const vehiclePayload = {
      ...(data.id ? { id: data.id } : {}),
      stock_number: stockNumber,
      slug: slug,
      title: data.title || 'Draft Vehicle',
      make_id: data.make_id ?? null,
      model_id: data.model_id ?? null,
      year: data.year ?? null,
      price_kes: data.price_kes ?? null,
      is_negotiable: data.is_negotiable ?? true,
      mileage_km: data.mileage_km ?? null,
      condition: data.condition ?? null,
      transmission: data.transmission ?? null,
      fuel: data.fuel ?? null,
      drive: data.drive ?? null,
      body_type: data.body_type ?? null,
      engine_cc: data.engine_cc ?? null,
      exterior_color: data.exterior_color ?? null,
      interior_color: data.interior_color ?? null,
      description: data.description ?? null,
      features: data.features || {},
      is_featured: data.is_featured ?? false,
      inventory_status: data.inventory_status || 'in_stock',
      publication_status: 'draft' as const,
      showroom_id: data.showroom_id ?? null,
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .upsert(vehiclePayload, { onConflict: 'id' })
      .select('id')
      .single()

    if (vehicleError) throw new Error(`Vehicle error: ${vehicleError.message}`)

    const vehicleId = vehicle.id

    const privatePayload = {
      vehicle_id: vehicleId,
      purchase_price_kes: data.purchase_price_kes ?? null,
      supplier_name: data.supplier_name ?? null,
      vin_or_chassis: data.vin_or_chassis ?? null,
      internal_notes: data.internal_notes ?? null,
    }

    const { error: privateError } = await supabase
      .from('vehicle_private_details')
      .upsert(privatePayload, { onConflict: 'vehicle_id' })

    if (privateError) throw new Error(`Private details error: ${privateError.message}`)

    if (data.category_ids) {
      await supabase.from('vehicle_categories').delete().eq('vehicle_id', vehicleId)
      
      if (data.category_ids.length > 0) {
        const categoryInserts = data.category_ids.map((catId: string) => ({
          vehicle_id: vehicleId,
          category_id: catId,
        }))
        await supabase.from('vehicle_categories').insert(categoryInserts)
      }
    }

    return { success: true, data: { id: vehicleId } }
  } catch (error) {
    console.error("[Server Action] Save Draft Error:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save draft' }
  }
}

export async function publishVehicle(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireStaffOrAdmin()

    const parsed = publishVehicleSchema.safeParse(input)
    if (!parsed.success) {
      console.error("[Server Action] Zod Publish Validation Failed:", parsed.error.flatten())
      return { 
        success: false, 
        error: 'Publishing requirements not met', 
        fieldErrors: parsed.error.flatten().fieldErrors 
      }
    }

    const data = parsed.data
    const vehicleId = data.id

    const supabase = await createClient()

    const { count: coverCount } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .eq('is_cover', true)

    if (!coverCount || coverCount === 0) {
      return { success: false, error: 'A cover image must be set before publishing.' }
    }

    const slug = await generateVehicleSlug(supabase, data.year, data.make_id, data.model_id, data.stock_number)

    const vehiclePayload = {
      id: vehicleId,
      stock_number: data.stock_number,
      slug: slug,
      title: data.title,
      make_id: data.make_id,
      model_id: data.model_id,
      year: data.year,
      price_kes: data.price_kes,
      is_negotiable: data.is_negotiable,
      mileage_km: data.mileage_km,
      condition: data.condition,
      transmission: data.transmission,
      fuel: data.fuel,
      drive: data.drive,
      body_type: data.body_type ?? null,
      engine_cc: data.engine_cc ?? null,
      exterior_color: data.exterior_color ?? null,
      interior_color: data.interior_color ?? null,
      description: data.description,
      features: data.features,
      is_featured: data.is_featured,
      inventory_status: data.inventory_status,
      publication_status: 'published' as const,
      showroom_id: data.showroom_id,
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update(vehiclePayload)
      .eq('id', vehicleId)

    if (vehicleError) throw new Error(`Publish error: ${vehicleError.message}`)

    const privatePayload = {
      purchase_price_kes: data.purchase_price_kes ?? null,
      supplier_name: data.supplier_name ?? null,
      vin_or_chassis: data.vin_or_chassis ?? null,
      internal_notes: data.internal_notes ?? null,
    }

    await supabase
      .from('vehicle_private_details')
      .update(privatePayload)
      .eq('vehicle_id', vehicleId)

    await supabase.from('vehicle_categories').delete().eq('vehicle_id', vehicleId)
    if (data.category_ids.length > 0) {
      const categoryInserts = data.category_ids.map((catId: string) => ({
        vehicle_id: vehicleId,
        category_id: catId,
      }))
      await supabase.from('vehicle_categories').insert(categoryInserts)
    }

    return { success: true, data: { id: vehicleId } }
  } catch (error) {
    console.error("[Server Action] Publish Error:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to publish vehicle' }
  }
}

export async function deleteVehicle(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireAdmin()
    const supabase = await createClient()
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true, data: true }
  } catch (error) {
    console.error("[Server Action] Delete Error:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete vehicle' }
  }
}