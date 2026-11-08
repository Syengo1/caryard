// src/lib/actions/vehicle-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { type SupabaseClient } from '@supabase/supabase-js'
import { type Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin, requireAdmin } from '@/lib/auth/roles'
import {
  saveDraftVehicleSchema,
  publishVehicleSchema,
  type SaveDraftVehicleInput,
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

  const makeObj = Array.isArray(data?.makes) ? data.makes[0] : data?.makes
  const makeName = makeObj?.name || 'vehicle'
  const modelName = data?.name || 'model'

  const raw = `${year}-${makeName}-${modelName}-${stockNumber}`
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function saveVehicleDraft(
  input: SaveDraftVehicleInput
): Promise<ActionResponse<{ id: string; stock_number: string; slug: string }>> {
  try {
    await requireStaffOrAdmin()

    const parsed = saveDraftVehicleSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const data = parsed.data
    if (!data.make_id || !data.model_id || !data.year) {
      return {
        success: false,
        error: 'Make, Model, and Year are required to save a vehicle to the database.',
      }
    }

    const supabase = await createClient()

    // Preserve existing stock_number if editing an existing vehicle and stock_number wasn't sent
    let existingStockNumber: string | null = null
    let existingPubStatus: Database['public']['Enums']['publication_status'] = 'draft'

    if (data.id) {
      const { data: existing } = await supabase
        .from('vehicles')
        .select('stock_number, publication_status')
        .eq('id', data.id)
        .maybeSingle()

      existingStockNumber = existing?.stock_number ?? null
      if (existing?.publication_status) {
        existingPubStatus = existing.publication_status
      }
    }

    const stockNumber =
      data.stock_number ||
      existingStockNumber ||
      `CY-${Date.now().toString().slice(-6)}`

    let slug = `draft-${stockNumber.toLowerCase()}`
    try {
      slug = await generateVehicleSlug(supabase, data.year, data.make_id, data.model_id, stockNumber)
    } catch (e) {
      console.warn('Failed to generate pretty slug, using fallback.', e)
    }

    // Only keep 'published' if the caller requested it AND it passes publish completeness rules
    const canRemainPublished =
      (data.publication_status === 'published' || existingPubStatus === 'published') &&
      Boolean(
        data.title &&
          data.price_kes &&
          data.mileage_km !== undefined &&
          data.mileage_km !== null &&
          data.condition &&
          data.transmission &&
          data.fuel &&
          data.drive &&
          data.showroom_id &&
          data.description &&
          data.description.trim().length >= 20
      )

    const targetPublicationStatus = canRemainPublished ? ('published' as const) : ('draft' as const)

    const vehiclePayload = {
      ...(data.id ? { id: data.id } : {}),
      stock_number: stockNumber,
      slug,
      title: data.title ?? null,
      make_id: data.make_id,
      model_id: data.model_id,
      year: data.year,
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
      features: (data.features || {}) as Database['public']['Tables']['vehicles']['Insert']['features'],
      is_featured: data.is_featured ?? false,
      inventory_status: data.inventory_status || 'in_stock',
      publication_status: targetPublicationStatus,
      showroom_id: data.showroom_id ?? null,
    }

    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .upsert(vehiclePayload, { onConflict: 'id' })
      .select('id, stock_number, slug')
      .single()

    if (vehicleError) throw new Error(`Vehicle error: ${vehicleError.message}`)

    const vehicleId = vehicle.id

    // Note: trg_vehicles_sync_private_lifecycle automatically creates the row in vehicle_private_details,
    // so we update the financial/internal columns on it.
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
        const { error: catError } = await supabase.from('vehicle_categories').insert(categoryInserts)
        if (catError) throw new Error(`Category error: ${catError.message}`)
      }
    }

    revalidatePath('/admin/vehicles')
    return {
      success: true,
      data: {
        id: vehicleId,
        stock_number: vehicle.stock_number || stockNumber,
        slug: vehicle.slug || slug,
      },
    }
  } catch (error) {
    console.error('[Server Action] Save Draft Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft',
    }
  }
}

export async function publishVehicle(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireStaffOrAdmin()

    const supabase = await createClient()

    // Hydrate stock_number from DB if missing from form state
    const rawInput = (typeof input === 'object' && input !== null ? { ...input } : {}) as Record<string, unknown>
    if (rawInput.id && !rawInput.stock_number) {
      const { data: existing } = await supabase
        .from('vehicles')
        .select('stock_number')
        .eq('id', String(rawInput.id))
        .maybeSingle()

      rawInput.stock_number = existing?.stock_number || `CY-${Date.now().toString().slice(-6)}`
    }

    const parsed = publishVehicleSchema.safeParse(rawInput)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Publishing requirements not met',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const data = parsed.data
    const vehicleId = data.id

    const { count: coverCount } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .eq('is_cover', true)

    if (!coverCount || coverCount === 0) {
      return { success: false, error: 'A cover image must be set before publishing.' }
    }

    const slug = await generateVehicleSlug(
      supabase,
      data.year,
      data.make_id,
      data.model_id,
      data.stock_number
    )

    const vehiclePayload = {
      stock_number: data.stock_number,
      slug,
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
      features: data.features as Database['public']['Tables']['vehicles']['Update']['features'],
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

    revalidatePath('/')
    revalidatePath('/vehicles')
    revalidatePath('/admin/vehicles')

    return { success: true, data: { id: vehicleId } }
  } catch (error) {
    console.error('[Server Action] Publish Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish vehicle',
    }
  }
}

export async function deleteVehicle(id: string): Promise<ActionResponse<boolean>> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(error.message)

    revalidatePath('/')
    revalidatePath('/vehicles')
    revalidatePath('/admin/vehicles')

    return { success: true, data: true }
  } catch (error) {
    console.error('[Server Action] Delete Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete vehicle',
    }
  }
}