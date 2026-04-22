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

// GET: Lấy danh sách alerts
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const resolved = searchParams.get('resolved')
    const severity = searchParams.get('severity')

    let query = db()
      .from('admin_alerts')
      .select(`
        id, review_id, product_id, alert_type, severity, message, 
        keywords_found, suggested_response, is_resolved, created_at,
        product_reviews ( reviewer_name, rating, comment, created_at ),
        products ( name, img )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (resolved === 'true') query = query.eq('is_resolved', true)
    else if (resolved === 'false') query = query.eq('is_resolved', false)

    if (severity) query = query.eq('severity', severity)

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        // Table does not exist error
        return NextResponse.json({ 
          error: 'Bảng dữ liệu chưa được tạo. Vui lòng chạy file scripts/sentiment-migration.sql trong Supabase SQL Editor.',
          needsMigration: true
        }, { status: 500 })
      }
      console.error('Alerts fetch error:', error)
      return NextResponse.json({ error: 'Lỗi tải dữ liệu: ' + error.message }, { status: 500 })
    }

    // Stats
    const { data: statsData } = await db()
      .from('admin_alerts')
      .select('severity, is_resolved')

    const stats = {
      total: statsData?.length || 0,
      unresolved: statsData?.filter(s => !s.is_resolved).length || 0,
      critical: statsData?.filter(s => s.severity === 'critical' && !s.is_resolved).length || 0,
      warning: statsData?.filter(s => s.severity === 'warning' && !s.is_resolved).length || 0,
    }

    return NextResponse.json({ alerts: data || [], stats })
  } catch (err: any) {
    console.error('Alerts GET error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// PATCH: Đánh dấu alert đã xử lý
export async function PATCH(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { alert_id } = await req.json()
    if (!alert_id) return NextResponse.json({ error: 'alert_id bắt buộc' }, { status: 400 })

    const { error } = await db()
      .from('admin_alerts')
      .update({
        is_resolved: true,
        resolved_by: admin.user_id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alert_id)

    if (error) {
      return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
