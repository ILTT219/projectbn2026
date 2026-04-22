import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

// GET: Lấy danh sách reviews cho 1 sản phẩm
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = Number(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    }

    // Lấy reviews
    const { data: reviews, error } = await db()
      .from('product_reviews')
      .select('id, product_id, reviewer_name, rating, comment, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Lỗi tải đánh giá' }, { status: 500 })
    }

    // Lấy thống kê rating
    const { data: stats } = await db()
      .from('product_rating_stats')
      .select('*')
      .eq('product_id', productId)
      .single()

    return NextResponse.json({
      reviews: reviews || [],
      stats: stats || { review_count: 0, avg_rating: 0, star_5: 0, star_4: 0, star_3: 0, star_2: 0, star_1: 0 },
    })
  } catch (err: any) {
    console.error('Reviews GET error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

// POST: Tạo review mới
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = Number(id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
    }

    const body = await req.json()
    const { reviewer_name, rating, comment } = body

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Vui lòng chọn số sao (1-5)' }, { status: 400 })
    }
    if (!reviewer_name || !reviewer_name.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên' }, { status: 400 })
    }
    if (reviewer_name.trim().length > 100) {
      return NextResponse.json({ error: 'Tên quá dài (tối đa 100 ký tự)' }, { status: 400 })
    }

    // Kiểm tra sản phẩm tồn tại
    const { data: product } = await db()
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('status', 'approved')
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Sản phẩm không tồn tại' }, { status: 404 })
    }

    // Lấy user_id nếu đã đăng nhập
    let userId = null
    try {
      const jwt = require('jsonwebtoken')
      const token = req.cookies.get('admin_token')?.value
      if (token && process.env.ADMIN_JWT_SECRET) {
        const decoded: any = jwt.verify(token, process.env.ADMIN_JWT_SECRET)
        userId = decoded.user_id
      }
    } catch {}

    // Insert review
    const { data: review, error } = await db()
      .from('product_reviews')
      .insert([{
        product_id: productId,
        user_id: userId,
        reviewer_name: reviewer_name.trim(),
        rating: Math.round(rating),
        comment: comment?.trim() || null,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: 'Lỗi gửi đánh giá' }, { status: 500 })
    }

    // Phân tích sentiment sau khi insert review thành công
    try {
      const analyzeUrl = new URL('/api/reviews/analyze', req.url)
      await fetch(analyzeUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review?.id,
          product_id: productId,
          comment: comment?.trim() || '',
          rating: Math.round(rating),
        }),
      })
    } catch (analyzeErr) {
      console.warn('Sentiment analysis failed (non-blocking):', analyzeErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!',
      review,
    })
  } catch (err: any) {
    console.error('Reviews POST error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
