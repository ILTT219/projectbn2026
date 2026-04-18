import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (process.env.SKIP_ADMIN_AUTH === 'true') {
    return NextResponse.next()
  }

  const isAdminLoginPage = pathname.startsWith('/admin/login')
  const isSellerRoute = pathname.startsWith('/seller')
  const isAdminRoute = pathname.startsWith('/admin')

  // Not a protected route
  if (!isSellerRoute && (!isAdminRoute || isAdminLoginPage)) {
    return NextResponse.next()
  }

  const token = req.cookies.get('admin_token')?.value

  if (!token) {
    if (isAdminRoute) return NextResponse.redirect(new URL('/admin/login', req.url))
    if (isSellerRoute) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    // Basic edge decoding of JWT payload (without signature verification, which is done on API routes)
    const payloadBase64 = token.split('.')[1]
    const decodedVal = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    const decoded = JSON.parse(decodedVal)

    if (isAdminRoute && decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    if (isSellerRoute && decoded.role !== 'seller' && decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Nếu chưa được duyệt, không cho vào trong (ngoại trừ QTV)
    if (!decoded.is_approved && decoded.role !== 'admin') {
       return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  } catch (error) {
    if (isAdminRoute) return NextResponse.redirect(new URL('/admin/login', req.url))
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*']
}
