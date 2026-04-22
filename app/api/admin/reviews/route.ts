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

// GET: Lấy tất cả reviews (cho admin quản lý)
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const { data: reviews, error, count } = await db()
      .from('product_reviews')
      .select(`
        id, product_id, reviewer_name, rating, comment, created_at,
        products!inner ( name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Admin reviews error:', error)
      return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 })
    }

    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      page,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (err: any) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// DELETE: Admin xóa review
export async function DELETE(req: NextRequest) {
  const admin = verifyAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  try {
    const { review_id } = await req.json()
    if (!review_id) {
      return NextResponse.json({ error: 'Thiếu review_id' }, { status: 400 })
    }

    const { error } = await db()
      .from('product_reviews')
      .delete()
      .eq('id', review_id)

    if (error) {
      console.error('Delete review error:', error)
      return NextResponse.json({ error: 'Lỗi xóa đánh giá' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Đã xóa đánh giá' })
  } catch (err: any) {
    console.error('Admin reviews DELETE error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
