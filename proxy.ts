import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (process.env.SKIP_ADMIN_AUTH === 'true') {
    return NextResponse.next()
  }

  // Bảo vệ khu vực Admin & Seller
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
    
    // Nếu vào cổng đăng nhập hệ thống mới, cho qua thoải mái
    if (pathname === '/login' || pathname.startsWith('/api/auth/login')) {
      return NextResponse.next()
    }

    const token = req.cookies.get('admin_token')?.value
    const secret = process.env.ADMIN_JWT_SECRET
    
    if (!token || !secret) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    try {
      const decoded: any = jwt.verify(token, secret)
      const userRole = decoded.role
      
      // Luật cấm: Chủ xưởng (seller) không được bò vào phòng Quản trị (Admin)
      if (pathname.startsWith('/admin') && userRole !== 'admin') {
         return NextResponse.redirect(new URL('/seller', req.url))
      }
      
      // Khách hàng (User) thì cấm tiệt vào cả 2
      if (userRole === 'user') {
         return NextResponse.redirect(new URL('/', req.url))
      }

      // Admin thì vào được cả Admin lẫn Seller, hoặc Seller vào vùng Seller
      return NextResponse.next()
    } catch (e) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*'],
}
