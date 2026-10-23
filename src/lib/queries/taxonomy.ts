import { createClient } from '@/lib/supabase/server'

export async function getTaxonomyData() {
  const supabase = await createClient()

  const [makesRes, modelsRes, categoriesRes, showroomsRes] = await Promise.all([
    supabase.from('makes').select('id, name, slug').order('display_order', { ascending: true }),
    supabase.from('models').select('id, make_id, name, slug, default_body_type').order('name', { ascending: true }),
    // FIXED: Added 'description' to the select query
    supabase.from('categories').select('id, name, slug, description').eq('is_active', true).order('display_order', { ascending: true }),
    supabase.from('showrooms').select('id, name, city').eq('is_active', true)
  ])

  if (makesRes.error) throw new Error(`Makes error: ${makesRes.error.message}`)
  if (modelsRes.error) throw new Error(`Models error: ${modelsRes.error.message}`)
  if (categoriesRes.error) throw new Error(`Categories error: ${categoriesRes.error.message}`)
  if (showroomsRes.error) throw new Error(`Showrooms error: ${showroomsRes.error.message}`)

  return {
    makes: makesRes.data,
    models: modelsRes.data,
    categories: categoriesRes.data,
    showrooms: showroomsRes.data,
  }
}