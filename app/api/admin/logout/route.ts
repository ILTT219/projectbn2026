import { NextRequest, NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  const res = NextResponse.redirect('/admin/login')
  res.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/admin',
    maxAge: 0,
  })
  return res
}
