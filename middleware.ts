import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // development helper: skip authentication entirely when env flag set
  if (process.env.SKIP_ADMIN_AUTH === 'true') {
    return NextResponse.next()
  }

  // only check admin pages (excluding api routes)
  if (pathname.startsWith('/admin')) {
    // allow login page and api endpoints through
    if (pathname === '/admin/login' || pathname.startsWith('/api/admin')) {
      return NextResponse.next()
    }

    const token = req.cookies.get('admin_token')?.value
    const secret = process.env.ADMIN_JWT_SECRET
    if (!token || !secret) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    try {
      jwt.verify(token, secret)
      return NextResponse.next()
    } catch (e) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

export const runtime = 'nodejs'
