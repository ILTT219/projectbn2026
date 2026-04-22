import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

let _supabaseAdmin: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

// ===== CẤU HÌNH BẢO MẬT =====
export const SECURITY_CONFIG = {
  // Brute force: tối đa bao nhiêu lần thất bại
  MAX_FAILED_ATTEMPTS: 5,
  // Trong khoảng thời gian bao nhiêu phút
  FAILED_WINDOW_MINUTES: 15,
  // Block bao lâu (phút)
  BLOCK_DURATION_MINUTES: 30,

  // Credential stuffing: tối đa bao nhiêu tài khoản khác nhau
  MAX_ACCOUNTS_PER_IP: 10,
  // Trong khoảng thời gian bao nhiêu giây
  ACCOUNTS_WINDOW_SECONDS: 30,

  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
}

// ===== LẤY IP TỪ REQUEST =====
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '127.0.0.1'
}

// ===== KIỂM TRA IP BỊ BLOCK =====
export async function isIPBlocked(ip: string): Promise<{ blocked: boolean; reason?: string; blocked_until?: string }> {
  const { data, error } = await getSupabase()
    .from('blocked_ips')
    .select('*')
    .eq('ip_address', ip)
    .single()

  if (error || !data) {
    return { blocked: false }
  }

  // Nếu block vĩnh viễn
  if (data.is_permanent) {
    return { blocked: true, reason: data.reason, blocked_until: 'Vĩnh viễn' }
  }

  // Nếu block có thời hạn, kiểm tra đã hết hạn chưa
  if (data.blocked_until) {
    const blockedUntil = new Date(data.blocked_until)
    if (blockedUntil > new Date()) {
      return { blocked: true, reason: data.reason, blocked_until: data.blocked_until }
    } else {
      // Đã hết hạn block, xóa record
      await getSupabase().from('blocked_ips').delete().eq('id', data.id)
      return { blocked: false }
    }
  }

  return { blocked: false }
}

// ===== GHI NHẬN LẦN ĐĂNG NHẬP =====
export async function recordLoginAttempt(
  ip: string,
  email: string | null,
  userId: number | null,
  success: boolean,
  userAgent: string | null
) {
  await getSupabase().from('login_attempts').insert([{
    ip_address: ip,
    email,
    user_id: userId,
    success,
    user_agent: userAgent,
  }])
}

// ===== KIỂM TRA BRUTE FORCE (≥5 fails / 15 phút) =====
export async function checkBruteForce(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - SECURITY_CONFIG.FAILED_WINDOW_MINUTES * 60 * 1000).toISOString()

  const { count, error } = await getSupabase()
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('created_at', windowStart)

  if (error) {
    console.error('Error checking brute force:', error)
    return false
  }

  if (count !== null && count >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
    // Auto-block IP 30 phút
    const blockedUntil = new Date(Date.now() + SECURITY_CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000).toISOString()
    await getSupabase().from('blocked_ips').upsert([{
      ip_address: ip,
      reason: `Tự động chặn: ${count} lần đăng nhập thất bại trong ${SECURITY_CONFIG.FAILED_WINDOW_MINUTES} phút`,
      blocked_until: blockedUntil,
      is_permanent: false,
    }], { onConflict: 'ip_address' })
    return true
  }

  return false
}

// ===== KIỂM TRA CREDENTIAL STUFFING (≥10 tài khoản / 30 giây) =====
export async function checkCredentialStuffing(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - SECURITY_CONFIG.ACCOUNTS_WINDOW_SECONDS * 1000).toISOString()

  // Đếm số email khác nhau đăng nhập từ cùng IP trong 30 giây
  const { data, error } = await getSupabase()
    .from('login_attempts')
    .select('email')
    .eq('ip_address', ip)
    .gte('created_at', windowStart)

  if (error || !data) {
    console.error('Error checking credential stuffing:', error)
    return false
  }

  // Đếm số email unique (khác null)
  const uniqueEmails = new Set(data.filter(d => d.email).map(d => d.email))

  if (uniqueEmails.size >= SECURITY_CONFIG.MAX_ACCOUNTS_PER_IP) {
    // Auto-block IP vĩnh viễn
    await getSupabase().from('blocked_ips').upsert([{
      ip_address: ip,
      reason: `Tự động chặn vĩnh viễn: ${uniqueEmails.size} tài khoản khác nhau trong ${SECURITY_CONFIG.ACCOUNTS_WINDOW_SECONDS} giây (Credential Stuffing)`,
      is_permanent: true,
      blocked_until: null,
    }], { onConflict: 'ip_address' })
    return true
  }

  return false
}

// ===== TẠO MÃ OTP =====
export function generateOTP(): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < SECURITY_CONFIG.OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

// ===== LƯU MÃ OTP VÀO DATABASE =====
export async function saveOTP(userId: number, code: string) {
  // Xóa tất cả OTP cũ của user
  await getSupabase().from('otp_codes').delete().eq('user_id', userId)

  // Lưu OTP mới
  const expiresAt = new Date(Date.now() + SECURITY_CONFIG.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()
  await getSupabase().from('otp_codes').insert([{
    user_id: userId,
    code,
    expires_at: expiresAt,
    is_used: false,
  }])
}

// ===== XÁC MINH MÃ OTP =====
export async function verifyOTP(userId: number, code: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('otp_codes')
    .select('*')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('is_used', false)
    .single()

  if (error || !data) return false

  // Kiểm tra hết hạn
  if (new Date(data.expires_at) < new Date()) {
    return false
  }

  // Đánh dấu đã dùng
  await getSupabase().from('otp_codes').update({ is_used: true }).eq('id', data.id)
  return true
}

// ===== GIẢI MÃ JWT TOKEN =====
export function verifyToken(token: string): any | null {
  try {
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret)
  } catch {
    return null
  }
}

// ===== LẤY SUPABASE ADMIN CLIENT =====
export function getSecuritySupabaseAdmin() {
  return getSupabase()
}
