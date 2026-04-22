import { NextRequest, NextResponse } from 'next/server'
import { isIPBlocked, getClientIP } from '@/lib/security'

// GET: Kiểm tra IP hiện tại có bị block không
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIP(req.headers)
    const result = await isIPBlocked(ip)

    return NextResponse.json({
      ip,
      ...result,
    })
  } catch (err: any) {
    console.error('IP check error:', err)
    return NextResponse.json({ error: 'Lỗi kiểm tra IP' }, { status: 500 })
  }
}
