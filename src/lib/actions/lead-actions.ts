// src/lib/actions/lead-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createLeadSchema,
  createLeadEventSchema,
  type CreateLeadInput,
  type CreateLeadEventInput,
} from '@/lib/validations/lead'
import type { ActionResponse } from '@/types/action-response'
import type { Database } from '@/types/database.types'

export async function submitPublicLead(
  input: CreateLeadInput
): Promise<ActionResponse<boolean>> {
  try {
    const parsed = createLeadSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: 'Please check the form fields and try again.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const data = parsed.data
    const supabase = await createClient()

    // Clean empty metadata keys so the payload stays compact
    const cleanMetadata = Object.fromEntries(
      Object.entries(data.metadata || {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== '' && !Number.isNaN(v)
      )
    )

    const { error } = await supabase.from('leads').insert({
      vehicle_id: data.vehicle_id || null,
      lead_type: data.lead_type,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      message: data.message || null,
      metadata: cleanMetadata as Database['public']['Tables']['leads']['Insert']['metadata'],
    })

    if (error) {
      console.error('[submitPublicLead] Supabase error:', error.message)
      throw new Error('Could not submit your inquiry at this moment. Please try again.')
    }

    return { success: true, data: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit inquiry.',
    }
  }
}

export async function logLeadEventAction(
  input: CreateLeadEventInput
): Promise<ActionResponse<boolean>> {
  try {
    const parsed = createLeadEventSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Invalid event payload' }
    }

    const supabase = await createClient()
    await supabase.from('lead_events').insert({
      vehicle_id: parsed.data.vehicle_id || null,
      event_type: parsed.data.event_type,
      source_path: parsed.data.source_path || null,
    })

    return { success: true, data: true }
  } catch {
    // Non-blocking telemetry
    return { success: false, error: 'Failed to log event' }
  }
}