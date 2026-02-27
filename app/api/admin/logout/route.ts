import { NextRequest, NextResponse } from 'next/server'

export function GET(req: NextRequest) {
  const res = NextResponse.redirect('/admin/login')
  res.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return res
}
