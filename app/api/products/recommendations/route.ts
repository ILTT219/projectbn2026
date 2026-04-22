import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ánh xạ danh mục văn hóa liên quan
const RELATED_CATEGORIES: Record<number, number[]> = {
  1: [2, 6],       // Lương thực → Thực phẩm, Đồ uống
  2: [1, 6],       // Thực phẩm → Lương thực, Đồ uống
  3: [2, 5],       // Dược liệu → Thực phẩm, Hàng tiêu dùng
  4: [5],          // Thủ công mỹ nghệ → Hàng tiêu dùng
  5: [4, 3],       // Hàng tiêu dùng → Thủ công mỹ nghệ, Dược liệu
  6: [2, 1],       // Đồ uống → Thực phẩm, Lương thực
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = Number(searchParams.get('product_id'))
    const categoryId = Number(searchParams.get('category_id'))
    const viewedIdsStr = searchParams.get('viewed_ids') || ''
    const limit = Math.min(Number(searchParams.get('limit') || '6'), 12)

    if (!productId && !categoryId) {
      return NextResponse.json({ error: 'product_id hoặc category_id bắt buộc' }, { status: 400 })
    }

    const viewedIds = viewedIdsStr
      .split(',')
      .map(Number)
      .filter(n => !isNaN(n) && n > 0)

    const excludeIds = productId ? [productId, ...viewedIds] : viewedIds
    const targetCategory = categoryId || 0
    const relatedCategories = RELATED_CATEGORIES[targetCategory] || []

    const sameCatLimit = Math.ceil(limit * 0.6) // 60% cho cùng danh mục (VD: 4/6)
    const historyLimit = limit - sameCatLimit   // 40% cho lịch sử (VD: 2/6)

    // Hàm tính điểm đánh giá trung bình và sắp xếp theo ưu tiên: Lượt xem > Đánh giá
    const processAndSort = (items: any[]) => {
      return items.map(p => {
        const reviews = p.product_reviews || [];
        const reviewCount = reviews.length;
        let avgRating = 0;
        if (reviewCount > 0) {
          const sum = reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
          avgRating = sum / reviewCount;
        }
        delete p.product_reviews;
        return { ...p, avgRating };
      }).sort((a, b) => {
        if (b.view_count !== a.view_count) {
          return (b.view_count || 0) - (a.view_count || 0);
        }
        return b.avgRating - a.avgRating;
      });
    }

    // 1. Sản phẩm cùng danh mục (Ưu tiên 60%)
    let sameCategory: any[] = []
    if (targetCategory) {
      const { data } = await supabase
        .from('products')
        .select('id, name, img, origin, category_id, view_count, product_reviews(rating)')
        .eq('status', 'approved')
        .eq('category_id', targetCategory)
        .not('id', 'in', `(${excludeIds.length > 0 ? excludeIds.join(',') : '0'})`)
        .order('view_count', { ascending: false })
        .limit(10) // Lấy dư để sort lại
      
      if (data) {
        sameCategory = processAndSort(data).slice(0, sameCatLimit)
      }
    }

    // 2. Phân tích lịch sử xem GẦN ĐÂY NHẤT (Lấy 40%)
    let historyBased: any[] = []
    if (viewedIds.length > 0) {
      // Chỉ phân tích 5 sản phẩm xem gần đây nhất để phản ánh đúng interest hiện tại
      const recentViewedIds = viewedIds.slice(0, 5)
      const { data: viewedProducts } = await supabase
        .from('products')
        .select('category_id')
        .in('id', recentViewedIds)
      
      if (viewedProducts && viewedProducts.length > 0) {
        // Lấy danh sách các category unique
        const recentCats = Array.from(new Set(viewedProducts.map(p => p.category_id)))
          .filter(id => id !== targetCategory)

        if (recentCats.length > 0) {
          const allExclude = [...excludeIds, ...sameCategory.map(p => p.id)]
          const { data } = await supabase
            .from('products')
            .select('id, name, img, origin, category_id, view_count, product_reviews(rating)')
            .eq('status', 'approved')
            .in('category_id', recentCats)
            .not('id', 'in', `(${allExclude.length > 0 ? allExclude.join(',') : '0'})`)
            .order('view_count', { ascending: false })
            .limit(10)
          
          if (data) {
             historyBased = processAndSort(data).slice(0, historyLimit)
          }
        }
      }
    }

    // 3. Nếu vẫn thiếu slot thì lấp đầy bằng Danh mục liên quan hoặc cùng danh mục
    let relatedProducts: any[] = []
    const totalSoFar = sameCategory.length + historyBased.length
    if (totalSoFar < limit) {
      const needed = limit - totalSoFar
      const allExclude = [...excludeIds, ...sameCategory.map(p => p.id), ...historyBased.map(p => p.id)]
      
      const { data } = await supabase
        .from('products')
        .select('id, name, img, origin, category_id, view_count, product_reviews(rating)')
        .eq('status', 'approved')
        .in('category_id', relatedCategories.length > 0 ? relatedCategories : [targetCategory])
        .not('id', 'in', `(${allExclude.length > 0 ? allExclude.join(',') : '0'})`)
        .order('view_count', { ascending: false })
        .limit(10)
        
      if (data) {
        relatedProducts = processAndSort(data).slice(0, needed)
      }
    }

    // Gộp tất cả lại (Cùng danh mục lên đầu, sau đó lịch sử)
    const recommendations = [...sameCategory, ...historyBased, ...relatedProducts].slice(0, limit)

    return NextResponse.json({
      recommendations,
      meta: {
        same_category: sameCategory.length,
        history_based: historyBased.length,
        related: relatedProducts.length,
      }
    })
  } catch (err: any) {
    console.error('Recommendations error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
