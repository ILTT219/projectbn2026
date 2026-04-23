import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

let _sb: SupabaseClient | null = null
function db() {
  if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  return _sb
}

function verifySellerOrAdmin(req: NextRequest): any | null {
  const token = req.cookies.get('admin_token')?.value
  if (!token) return null
  try {
    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as any
    if (decoded.role === 'admin' || decoded.role === 'seller') return decoded
    return null
  } catch {
    return null
  }
}

// POST: Seller/Admin trả lời đánh giá
export async function POST(req: NextRequest) {
  const user = verifySellerOrAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập với tư cách seller hoặc admin' }, { status: 403 })
  }

  try {
    const { review_id, reply } = await req.json()

    if (!review_id || !reply?.trim()) {
      return NextResponse.json({ error: 'review_id và nội dung trả lời là bắt buộc' }, { status: 400 })
    }

    if (reply.trim().length > 1000) {
      return NextResponse.json({ error: 'Nội dung trả lời tối đa 1000 ký tự' }, { status: 400 })
    }

    // Kiểm tra review tồn tại
    const { data: review } = await db()
      .from('product_reviews')
      .select('id, product_id')
      .eq('id', review_id)
      .single()

    if (!review) {
      return NextResponse.json({ error: 'Đánh giá không tồn tại' }, { status: 404 })
    }

    // Nếu là seller, kiểm tra quyền sở hữu sản phẩm
    if (user.role === 'seller') {
      const { data: product } = await db()
        .from('products')
        .select('seller_id')
        .eq('id', review.product_id)
        .single()

      if (!product || product.seller_id !== user.user_id) {
        return NextResponse.json({ error: 'Bạn chỉ có thể trả lời đánh giá cho sản phẩm của mình' }, { status: 403 })
      }
    }

    // Cập nhật reply
    const { error } = await db()
      .from('product_reviews')
      .update({
        seller_reply: reply.trim(),
        seller_reply_at: new Date().toISOString(),
      })
      .eq('id', review_id)

    if (error) {
      console.error('Reply update error:', error)
      // Có thể cột chưa tồn tại
      if (error.message?.includes('column') || error.code === '42703') {
        return NextResponse.json({
          error: 'Cần thêm cột seller_reply vào bảng product_reviews. Chạy SQL:\nALTER TABLE product_reviews ADD COLUMN seller_reply TEXT;\nALTER TABLE product_reviews ADD COLUMN seller_reply_at TIMESTAMPTZ;',
          needsMigration: true,
        }, { status: 500 })
      }
      return NextResponse.json({ error: 'Lỗi cập nhật: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Đã gửi phản hồi!' })
  } catch (err: any) {
    console.error('Reply POST error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
