// src/lib/actions/catalog-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireStaffOrAdmin } from '@/lib/auth/roles'
import type { ActionResponse } from '@/types/action-response'

export async function createMake(
  name: string
): Promise<ActionResponse<{ id: string; name: string; slug: string }>> {
  try {
    await requireStaffOrAdmin()
    const supabase = await createClient()

    const trimmed = name.trim()
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const { data, error } = await supabase
      .from('makes')
      .insert({ name: trimmed, slug, is_popular: false })
      .select('id, name, slug')
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create make',
    }
  }
}

export async function createModel(
  makeId: string,
  name: string
): Promise<ActionResponse<{ id: string; make_id: string; name: string; slug: string }>> {
  try {
    await requireStaffOrAdmin()
    const supabase = await createClient()

    const trimmed = name.trim()
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const { data, error } = await supabase
      .from('models')
      .insert({ make_id: makeId, name: trimmed, slug })
      .select('id, make_id, name, slug')
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create model',
    }
  }
}