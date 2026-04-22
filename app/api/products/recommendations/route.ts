import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = Number(searchParams.get('product_id'))
    const categoryId = Number(searchParams.get('category_id'))
    const limit = Math.min(Number(searchParams.get('limit') || '6'), 12)

    if (!productId && !categoryId) {
      return NextResponse.json({ error: 'product_id hoặc category_id bắt buộc' }, { status: 400 })
    }

    // Lấy sản phẩm cùng danh mục, loại trừ sản phẩm hiện tại, sắp xếp theo lượt xem
    const { data, error } = await supabase
      .from('products')
      .select('id, name, img, origin, category_id')
      .eq('status', 'approved')
      .eq('category_id', categoryId || 0)
      .not('id', 'in', `(${productId || 0})`)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: 'Lỗi truy vấn dữ liệu' }, { status: 500 })
    }

    return NextResponse.json({ recommendations: data || [] })
  } catch (err: any) {
    console.error('Recommendations error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
