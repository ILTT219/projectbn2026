import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  getClientIP,
  isIPBlocked,
  recordLoginAttempt,
  checkBruteForce,
  checkCredentialStuffing,
  generateOTP,
  saveOTP,
} from '@/lib/security'

// service role client bypasses RLS so the route can read users table
let _supabase: SupabaseClient | null = null
function getSupabaseAdmin() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Quên bút danh hay mật thư rồi ta?' }, { status: 400 })
    }

    // === BƯỚC 1: Lấy IP và kiểm tra block ===
    const clientIP = getClientIP(req.headers)
    const userAgent = req.headers.get('user-agent') || null

    const blockStatus = await isIPBlocked(clientIP)
    if (blockStatus.blocked) {
      return NextResponse.json({
        error: `IP của bạn đã bị chặn. Lý do: ${blockStatus.reason || 'Vi phạm bảo mật'}`,
        blocked: true,
        blocked_until: blockStatus.blocked_until,
      }, { status: 403 })
    }

    // === BƯỚC 2: Kiểm tra credential stuffing TRƯỚC KHI xác thực ===
    const isStuffing = await checkCredentialStuffing(clientIP)
    if (isStuffing) {
      return NextResponse.json({
        error: 'IP của bạn đã bị chặn vĩnh viễn do phát hiện hành vi đáng ngờ (nhiều tài khoản đăng nhập trong thời gian ngắn)',
        blocked: true,
        blocked_until: 'Vĩnh viễn',
      }, { status: 403 })
    }

    // === BƯỚC 3: Xác thực email/password ===
    const { data, error } = await getSupabaseAdmin()
      .from('users')
      .select('id, password, role, is_approved, two_factor_enabled, phone')
      .eq('email', email)
      .single()

    if (error || !data) {
      // Ghi nhận lần đăng nhập thất bại
      await recordLoginAttempt(clientIP, email, null, false, userAgent)
      // Kiểm tra brute force
      const isBrute = await checkBruteForce(clientIP)
      if (isBrute) {
        return NextResponse.json({
          error: 'IP của bạn đã bị tạm chặn 30 phút do quá nhiều lần đăng nhập thất bại',
          blocked: true,
        }, { status: 403 })
      }
      console.error("Supabase fetch user error:", error);
      return NextResponse.json({ error: 'Người này không tồn tại trong Sổ' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, data.password)
    if (!match) {
      // Ghi nhận lần đăng nhập thất bại
      await recordLoginAttempt(clientIP, email, data.id, false, userAgent)
      // Kiểm tra brute force
      const isBrute = await checkBruteForce(clientIP)
      if (isBrute) {
        return NextResponse.json({
          error: 'IP của bạn đã bị tạm chặn 30 phút do quá nhiều lần đăng nhập thất bại',
          blocked: true,
        }, { status: 403 })
      }
      return NextResponse.json({ error: 'Mật thư sai toét' }, { status: 401 })
    }

    if (!data.is_approved && data.role !== 'admin') {
      return NextResponse.json({ error: 'Tài khoản của bạn đang chờ Quản trị viên duyệt' }, { status: 403 })
    }

    // === BƯỚC 4: Kiểm tra 2FA ===
    if (data.two_factor_enabled && data.phone) {
      // Tạo và gửi OTP
      const otpCode = generateOTP()
      await saveOTP(data.id, otpCode)

      // Ghi nhận đăng nhập thành công (bước 1)
      await recordLoginAttempt(clientIP, email, data.id, true, userAgent)

      // Mask số điện thoại
      const maskedPhone = data.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')

      console.log(`[DEMO OTP] User ${data.id} - Phone: ${data.phone} - OTP: ${otpCode}`)

      return NextResponse.json({
        success: true,
        requires_2fa: true,
        user_id: data.id,
        masked_phone: maskedPhone,
        // DEMO: Trả về OTP. XÓA KHI TRIỂN KHAI THỰC TẾ!
        demo_otp: otpCode,
        message: `Mã xác minh đã được gửi đến ${maskedPhone}`,
      })
    }

    // === BƯỚC 5: Đăng nhập thành công (không 2FA) ===
    // Ghi nhận đăng nhập thành công
    await recordLoginAttempt(clientIP, email, data.id, true, userAgent)

    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not defined')
    }
    
    // Đóng gói thông tin phân quyền vào Phiếu bảo hành (JWT)
    const token = jwt.sign({ user_id: data.id, email, role: data.role, is_approved: data.is_approved }, secret, { expiresIn: '8h' })

    const res = NextResponse.json({ success: true, role: data.role })
    
    // Gắn thẻ này vào máy khách, có hạn 8 tiếng
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'strict',
    })
    return res
  } catch (err: any) {
    console.error('Login error', err)
    return NextResponse.json({ error: 'Lực lượng chức năng đang bận' }, { status: 500 })
  }
}
