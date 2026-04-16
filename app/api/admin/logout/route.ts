import { NextRequest, NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  try {
    const res = NextResponse.redirect(new URL('/admin/login', req.url))
    res.cookies.delete('admin_token')
    return res
  } catch (err: any) {
    console.error('Logout error:', err.message)
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}
