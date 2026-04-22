import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

function verifyAdmin(req: NextRequest): any | null {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return null
  try {
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as any
    if (decoded.role !== 'admin') return null
    return decoded
  } catch {
    return null
  }
}

// GET: Lấy danh sách IP khả nghi & bị chặn
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
  }

  try {
    // Lấy danh sách IP bị chặn
    const { data: blockedIps, error: blockedError } = await db()
      .from('blocked_ips')
      .select('*')
      .order('blocked_at', { ascending: false })

    // Lấy login attempts gần đây (48 giờ qua)
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: attempts, error: attemptsError } = await db()
      .from('login_attempts')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500)

    // Tính toán thống kê IP khả nghi
    const ipStats: Record<string, { total: number; failed: number; success: number; emails: Set<string>; last_attempt: string }> = {}

    if (attempts) {
      for (const attempt of attempts) {
        if (!ipStats[attempt.ip_address]) {
          ipStats[attempt.ip_address] = { total: 0, failed: 0, success: 0, emails: new Set(), last_attempt: attempt.created_at }
        }
        ipStats[attempt.ip_address].total++
        if (attempt.success) {
          ipStats[attempt.ip_address].success++
        } else {
          ipStats[attempt.ip_address].failed++
        }
        if (attempt.email) {
          ipStats[attempt.ip_address].emails.add(attempt.email)
        }
      }
    }

    // Chuyển đổi Set thành Array cho JSON
    const suspiciousIps = Object.entries(ipStats)
      .map(([ip, stats]) => ({
        ip_address: ip,
        total_attempts: stats.total,
        failed_attempts: stats.failed,
        success_attempts: stats.success,
        unique_emails: Array.from(stats.emails),
        email_count: stats.emails.size,
        last_attempt: stats.last_attempt,
        is_suspicious: stats.failed >= 3 || stats.emails.size >= 5,
      }))
      .filter(ip => ip.is_suspicious || ip.total_attempts >= 5)
      .sort((a, b) => b.failed_attempts - a.failed_attempts)

    return NextResponse.json({
      blocked_ips: blockedIps || [],
      suspicious_ips: suspiciousIps,
      total_attempts_48h: attempts?.length || 0,
    })
  } catch (err: any) {
    console.error('Security dashboard error:', err)
    return NextResponse.json({ error: 'Lỗi tải dữ liệu bảo mật' }, { status: 500 })
  }
}

// POST: Block/Unblock IP thủ công
export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
  }

  try {
    const { action, ip_address, reason, duration_hours, is_permanent } = await req.json()

    if (!ip_address) {
      return NextResponse.json({ error: 'Thiếu địa chỉ IP' }, { status: 400 })
    }

    if (action === 'block') {
      const blockedUntil = is_permanent
        ? null
        : new Date(Date.now() + (duration_hours || 24) * 60 * 60 * 1000).toISOString()

      const { error } = await db().from('blocked_ips').upsert([{
        ip_address,
        reason: reason || `Chặn thủ công bởi admin`,
        blocked_until: blockedUntil,
        is_permanent: !!is_permanent,
        created_by: admin.user_id,
      }], { onConflict: 'ip_address' })

      if (error) {
        console.error('Block IP error:', error)
        return NextResponse.json({ error: 'Lỗi chặn IP' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `Đã chặn IP ${ip_address}` })
    }

    if (action === 'unblock') {
      const { error } = await db()
        .from('blocked_ips')
        .delete()
        .eq('ip_address', ip_address)

      if (error) {
        console.error('Unblock IP error:', error)
        return NextResponse.json({ error: 'Lỗi gỡ chặn IP' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `Đã gỡ chặn IP ${ip_address}` })
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    console.error('Security action error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
