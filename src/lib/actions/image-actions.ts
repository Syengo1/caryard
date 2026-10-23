'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffOrAdmin, requireAdmin } from '@/lib/auth/roles'
import type { ActionResponse } from '@/types/action-response'

/**
 * Registers an uploaded image into the database.
 * Call this immediately after uploading via the browser client.
 */
export async function registerVehicleImage(
  vehicleId: string,
  storagePath: string,
  displayOrder: number = 0,
  dimensions?: { width: number; height: number }
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireStaffOrAdmin()
    const supabase = await createClient()

    // If it's the first image, make it the cover automatically
    const { count } = await supabase
      .from('vehicle_images')
      .select('id', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)

    const isCover = count === 0

    const { data, error } = await supabase
      .from('vehicle_images')
      .insert({
        vehicle_id: vehicleId,
        storage_path: storagePath,
        display_order: displayOrder,
        is_cover: isCover,
        width: dimensions?.width,
        height: dimensions?.height,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    return { success: true, data: { id: data.id } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to register image' }
  }
}

/**
 * Safely swaps the cover photo using the dedicated RPC.
 */
export async function setCoverImage(
  vehicleId: string,
  imageId: string
): Promise<ActionResponse<boolean>> {
  try {
    await requireStaffOrAdmin()
    const supabase = await createClient()

    const { error } = await supabase.rpc('set_vehicle_cover_image', {
      p_vehicle_id: vehicleId,
      p_image_id: imageId,
    })

    if (error) throw new Error(error.message)

    return { success: true, data: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to set cover image' }
  }
}

/**
 * Deletes an image record. 
 * The PostgreSQL trigger will automatically queue the file for deletion.
 */
export async function deleteVehicleImage(imageId: string): Promise<ActionResponse<boolean>> {
  try {
    await requireStaffOrAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('vehicle_images')
      .delete()
      .eq('id', imageId)

    if (error) throw new Error(error.message)

    return { success: true, data: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete image' }
  }
}

/**
 * ADMIN ONLY: Processes the storage_cleanup_queue.
 * Reads queued paths, hard-deletes them from Supabase Storage, and marks them processed.
 * Can be triggered manually via dashboard or setup as an Edge Cron Job.
 */
export async function processStorageCleanupQueue(): Promise<ActionResponse<{ processed: number }>> {
  try {
    // Only an active admin can trigger the cleanup queue manually
    await requireAdmin()
    
    // We use the admin client because the RLS on objects might prevent 
    // staff from deleting files associated with hard-deleted vehicles
    const adminSupabase = createAdminClient()

    const { data: queueItems, error: fetchError } = await adminSupabase
      .from('storage_cleanup_queue')
      .select('*')
      .is('processed_at', null)
      .order('queued_at', { ascending: true })
      .limit(50)

    if (fetchError) throw fetchError
    if (!queueItems || queueItems.length === 0) {
      return { success: true, data: { processed: 0 } }
    }

    let successCount = 0

    for (const item of queueItems) {
      const { error: storageError } = await adminSupabase.storage
        .from(item.bucket_id)
        .remove([item.storage_path])

      if (storageError && !storageError.message.includes('Object not found')) {
        // Increment attempts and log error
        await adminSupabase
          .from('storage_cleanup_queue')
          .update({
            attempts: item.attempts + 1,
            last_error: storageError.message,
          })
          .eq('id', item.id)
      } else {
        // Mark successful (or safely ignore if file was already missing)
        await adminSupabase
          .from('storage_cleanup_queue')
          .update({
            processed_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', item.id)
          
        successCount++
      }
    }

    return { success: true, data: { processed: successCount } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process storage queue' }
  }
}