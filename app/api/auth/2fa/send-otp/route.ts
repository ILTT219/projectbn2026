import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateOTP, saveOTP } from '@/lib/security'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

// POST: Tạo và gửi mã OTP
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Thiếu thông tin người dùng' }, { status: 400 })
    }

    // Lấy thông tin user
    const { data: user, error: userError } = await db()
      .from('users')
      .select('id, phone, two_factor_enabled')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    if (!user.two_factor_enabled) {
      return NextResponse.json({ error: '2FA chưa được bật cho tài khoản này' }, { status: 400 })
    }

    // Tạo mã OTP
    const otpCode = generateOTP()

    // Lưu OTP vào database
    await saveOTP(user.id, otpCode)

    // === CHẾ ĐỘ DEMO ===
    // Trong thực tế, gửi SMS qua Twilio/Vonage ở đây
    // Ví dụ: await twilioClient.messages.create({ body: `Mã OTP: ${otpCode}`, to: user.phone, from: '+1234567890' })
    console.log(`[DEMO OTP] User ${user.id} - Phone: ${user.phone} - OTP: ${otpCode}`)

    // Mask số điện thoại để hiển thị
    const maskedPhone = user.phone
      ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
      : '***'

    return NextResponse.json({
      success: true,
      message: `Mã xác minh đã được gửi đến ${maskedPhone}`,
      masked_phone: maskedPhone,
      // DEMO ONLY: Trả về OTP cho mục đích demo. XÓA DÒNG NÀY KHI TRIỂN KHAI THỰC TẾ!
      demo_otp: otpCode,
    })
  } catch (err: any) {
    console.error('Send OTP error:', err)
    return NextResponse.json({ error: 'Lỗi gửi mã xác minh' }, { status: 500 })
  }
}
