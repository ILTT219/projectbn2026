import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

// POST: Bật/tắt 2FA và lưu số điện thoại
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) throw new Error('ADMIN_JWT_SECRET is not defined')

    const decoded = jwt.verify(token, secret) as any
    const userId = decoded.user_id

    const { phone, enabled } = await req.json()

    if (enabled && !phone) {
      return NextResponse.json({ error: 'Vui lòng nhập số điện thoại để bật 2FA' }, { status: 400 })
    }

    // Validate phone format (Vietnamese phone numbers)
    if (phone) {
      const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 })
      }
    }

    const { error } = await db()
      .from('users')
      .update({
        phone: phone || null,
        two_factor_enabled: !!enabled,
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating 2FA settings:', error)
      return NextResponse.json({ error: 'Lỗi cập nhật cài đặt bảo mật' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: enabled ? 'Đã bật xác minh 2 bước' : 'Đã tắt xác minh 2 bước',
      two_factor_enabled: !!enabled,
    })
  } catch (err: any) {
    console.error('2FA setup error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
