import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { verifyOTP } from '@/lib/security'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

// POST: Xác minh mã OTP và cấp JWT
export async function POST(req: NextRequest) {
  try {
    const { user_id, otp_code } = await req.json()

    if (!user_id || !otp_code) {
      return NextResponse.json({ error: 'Thiếu mã xác minh' }, { status: 400 })
    }

    // Xác minh OTP
    const isValid = await verifyOTP(user_id, otp_code)

    if (!isValid) {
      return NextResponse.json({ error: 'Mã xác minh không đúng hoặc đã hết hạn' }, { status: 401 })
    }

    // Lấy thông tin user để tạo JWT
    const { data: user, error: userError } = await db()
      .from('users')
      .select('id, email, role, is_approved')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    // Tạo JWT token
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) throw new Error('ADMIN_JWT_SECRET is not defined')

    const token = jwt.sign(
      { user_id: user.id, email: user.email, role: user.role, is_approved: user.is_approved },
      secret,
      { expiresIn: '8h' }
    )

    const res = NextResponse.json({
      success: true,
      role: user.role,
      message: 'Xác minh thành công',
    })

    // Set cookie
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'strict',
    })

    return res
  } catch (err: any) {
    console.error('Verify OTP error:', err)
    return NextResponse.json({ error: 'Lỗi xác minh' }, { status: 500 })
  }
}
