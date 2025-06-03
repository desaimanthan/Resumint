import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  
  console.log('🔍 Middleware triggered:')
  console.log('  - Hostname:', hostname)
  console.log('  - Pathname:', url.pathname)
  console.log('  - Full URL:', request.url)
  
  // Skip middleware for API routes, static files, and internal Next.js routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.') && !url.pathname.endsWith('/')
  ) {
    console.log('  ⏭️ Skipping middleware for:', url.pathname)
    return NextResponse.next()
  }

  // Extract subdomain from hostname (remove port if present)
  const hostnameWithoutPort = hostname.split(':')[0]
  const parts = hostnameWithoutPort.split('.')
  console.log('  - Hostname without port:', hostnameWithoutPort)
  console.log('  - Hostname parts:', parts)
  
  // Check if this is a subdomain (not localhost or main domain)
  // For localhost development, we expect format: subdomain.localhost
  if (parts.length >= 2 && parts[1] === 'localhost' && parts[0] !== 'www' && parts[0] !== 'localhost') {
    const subdomain = parts[0]
    console.log('  🎯 Subdomain detected:', subdomain)
    
    // Skip if already on portfolio route to avoid infinite redirects
    if (url.pathname.startsWith('/portfolio/')) {
      console.log('  ⏭️ Already on portfolio route, skipping')
      return NextResponse.next()
    }
    
    // Rewrite subdomain to portfolio route
    const newPath = `/portfolio/${subdomain}`
    console.log('  🔄 Rewriting to:', newPath)
    url.pathname = newPath
    return NextResponse.rewrite(url)
  }

  console.log('  ⏭️ No subdomain detected, continuing')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
