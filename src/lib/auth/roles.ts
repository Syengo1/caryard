import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type AppRole = Database['public']['Enums']['app_role']

export interface CurrentStaff {
  userId: string
  fullName: string
  role: AppRole
}

/**
 * Returns current staff profile if authenticated and active, otherwise null.
 */
export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: roleRecord } = await supabase
    .from('user_roles')
    .select('full_name, role, is_active')
    .eq('user_id', user.id)
    .single()

  if (!roleRecord || !roleRecord.is_active) {
    return null
  }

  return {
    userId: user.id,
    fullName: roleRecord.full_name,
    role: roleRecord.role,
  }
}

/**
 * Throws an error if the user is not an active staff or admin.
 */
export async function requireStaffOrAdmin(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff()
  if (!staff) {
    throw new Error('Forbidden: Active staff or admin session required.')
  }
  return staff
}

/**
 * Throws an error if the user is not an active admin.
 */
export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await requireStaffOrAdmin()
  if (staff.role !== 'admin') {
    throw new Error('Forbidden: Administrative privileges required.')
  }
  return staff
}