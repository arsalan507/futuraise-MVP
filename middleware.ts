import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase not configured, allow access to public routes only
  if (!supabaseUrl || !supabaseKey ||
      supabaseUrl.includes('your_supabase') ||
      supabaseKey.includes('your_')) {

    const pathname = request.nextUrl.pathname

    // Allow access to landing page and auth pages for UI testing
    if (pathname === '/' || pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }

    // Block protected routes, redirect to setup page
    if (pathname.startsWith('/student') || pathname.startsWith('/parent') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
  }

  // Supabase is configured, use normal auth middleware
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
