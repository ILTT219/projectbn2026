import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // Xoá thẻ
    sameSite: 'strict',
  })
  return res
}
