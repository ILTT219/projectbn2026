import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET

  if (!token || !secret) {
    return NextResponse.json({ loggedIn: false })
  }

  try {
    const decoded: any = jwt.verify(token, secret)

    // Lấy thông tin bổ sung từ DB (phone, 2FA status)
    const { data: user } = await db()
      .from('users')
      .select('id, phone, two_factor_enabled')
      .eq('id', decoded.user_id)
      .single()

    return NextResponse.json({
      loggedIn: true,
      role: decoded.role,
      email: decoded.email,
      user_id: decoded.user_id,
      phone: user?.phone || null,
      two_factor_enabled: user?.two_factor_enabled || false,
    })
  } catch (e) {
    return NextResponse.json({ loggedIn: false })
  }
}
