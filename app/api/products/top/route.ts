import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _sb: SupabaseClient | null = null
function db() { if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); return _sb }

// GET: Top sản phẩm theo rating & Top sellers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'products' // 'products' | 'sellers'
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 20)

    if (type === 'sellers') {
      // Top sellers = nhà cung cấp có nhiều sản phẩm đánh giá cao nhất
      const { data, error } = await db()
        .from('product_rating_stats')
        .select('*')
        .gt('review_count', 0)
        .order('avg_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Top sellers error:', error)
        return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 })
      }

      // Group by contact_address (seller)
      const sellerMap: Record<string, { name: string; total_products: number; avg_rating: number; total_reviews: number; products: any[] }> = {}

      for (const item of (data || [])) {
        const seller = item.contact_address || 'Chưa xác định'
        if (!sellerMap[seller]) {
          sellerMap[seller] = { name: seller, total_products: 0, avg_rating: 0, total_reviews: 0, products: [] }
        }
        sellerMap[seller].total_products++
        sellerMap[seller].total_reviews += Number(item.review_count)
        sellerMap[seller].products.push({
          id: item.product_id,
          name: item.product_name,
          img: item.img,
          avg_rating: Number(item.avg_rating),
          review_count: Number(item.review_count),
        })
      }

      // Calculate avg rating per seller
      const sellers = Object.values(sellerMap)
        .map(s => {
          const totalRating = s.products.reduce((sum: number, p: any) => sum + p.avg_rating * p.review_count, 0)
          s.avg_rating = s.total_reviews > 0 ? Math.round((totalRating / s.total_reviews) * 10) / 10 : 0
          return s
        })
        .sort((a, b) => b.avg_rating - a.avg_rating || b.total_reviews - a.total_reviews)
        .slice(0, limit)

      return NextResponse.json({ sellers })
    }

    // Top products by rating
    const { data, error } = await db()
      .from('product_rating_stats')
      .select('*')
      .gt('review_count', 0)
      .order('avg_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Top products error:', error)
      return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 })
    }

    const products = (data || []).map(item => ({
      id: item.product_id,
      name: item.product_name,
      img: item.img,
      origin: item.origin,
      contact_address: item.contact_address,
      avg_rating: Number(item.avg_rating),
      review_count: Number(item.review_count),
    }))

    return NextResponse.json({ products })
  } catch (err: any) {
    console.error('Top API error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
