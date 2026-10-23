import { createServerClient } from '@supabase/ssr'
import { createClient as createEdgeClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 1. Initialize SSR client to read/refresh cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Helper function to verify admin/staff role securely in the Edge Runtime
  const verifyUserRole = async (userId: string) => {
    const adminSupabase = createEdgeClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const { data } = await adminSupabase
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', userId)
      .single()
    
    return data
  }

  // 2. Guard protected /admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    const userRole = await verifyUserRole(user.id)

    if (!userRole || !userRole.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Clear existing params to avoid URL bloat, then set the error
      url.searchParams.forEach((_, key) => url.searchParams.delete(key))
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  // 3. Smart /login routing logic
  if (pathname === '/login' && user) {
    const userRole = await verifyUserRole(user.id)

    // ONLY redirect to /admin if they actually have a valid staff/admin role.
    // If they don't, we let them render the /login page so they can log in as someone else.
    if (userRole && userRole.is_active) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.searchParams.delete('error')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}