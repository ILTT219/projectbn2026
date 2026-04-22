import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role === 'admin') {
      return decoded.user_id
    }
    return null
  } catch (e) {
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Lấy tất cả sản phẩm, thông tin seller và đánh giá
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, users:seller_id(email, name), product_reviews(rating, sentiment)')
      .order('id', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Lỗi lấy dữ liệu' }, { status: 500 })
    }

    // Tính toán số sao trung bình và cảm xúc đa số
    const enrichedData = data.map(product => {
      const reviews = product.product_reviews || [];
      const reviewCount = reviews.length;
      let avgRating = 0;
      let majoritySentiment = 'N/A';

      if (reviewCount > 0) {
        const sumRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
        avgRating = Number((sumRating / reviewCount).toFixed(1));

        const sentiments = { positive: 0, negative: 0, neutral: 0 };
        reviews.forEach((r: any) => {
          if (r.sentiment === 'positive') sentiments.positive++;
          else if (r.sentiment === 'negative') sentiments.negative++;
          else if (r.sentiment === 'neutral') sentiments.neutral++;
        });

        // Find majority
        let maxCount = 0;
        for (const [s, count] of Object.entries(sentiments)) {
          if (count > maxCount) {
            maxCount = count;
            majoritySentiment = s;
          }
        }
      }

      // Xóa array reviews gốc để giảm payload
      delete product.product_reviews;

      return {
        ...product,
        avgRating,
        reviewCount,
        majoritySentiment,
        sellerEmail: product.users?.email || 'N/A',
        sellerName: product.users?.name || product.users?.email || 'Hệ thống'
      }
    });

    return NextResponse.json({ data: enrichedData })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetProductId, action, rejectionReason } = await req.json()
    // action: 'approve' | 'reject'
    if (!targetProductId || !action) {
       return NextResponse.json({ error: 'Thiếu ID sản phẩm hoặc hành động' }, { status: 400 })
    }

    // Lấy thông tin sản phẩm để biết status hiện tại và seller
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('status, seller_id, name')
      .eq('id', targetProductId)
      .single()

    if (!product) {
       return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }

    if (action === 'approve') {
       if (product.status === 'pending_delete') {
         // Nếu đang chờ duyệt xoá → thực hiện xoá thật
         await supabaseAdmin.from('images').delete().eq('product_id', targetProductId)
         const { error } = await supabaseAdmin
           .from('products')
           .delete()
           .eq('id', targetProductId)
         
         if (error) throw error;

         // Thông báo cho seller
         if (product.seller_id) {
            await supabaseAdmin.from('notifications').insert({
              seller_id: product.seller_id,
              message: `Yêu cầu xoá sản phẩm "${product.name}" đã được hợp tác xã duyệt. Sản phẩm đã bị gỡ khỏi hệ thống.`
            })
         }
         return NextResponse.json({ success: true, message: 'Đã duyệt yêu cầu xoá và xoá sản phẩm' })
       } else {
         // Các trạng thái khác (pending_new, pending_edit) → duyệt thành approved
         const { error } = await supabaseAdmin
           .from('products')
           .update({ status: 'approved', rejection_reason: null })
           .eq('id', targetProductId)
         if (error) throw error;

         // Thông báo cho seller
         if (product.seller_id) {
            await supabaseAdmin.from('notifications').insert({
              seller_id: product.seller_id,
              message: `Chúc mừng! Sản phẩm "${product.name}" của bạn đã được hiển thị trên hệ thống chuẩn OCOP.`
            })
         }
         return NextResponse.json({ success: true, message: 'Đã duyệt sản phẩm' })
       }
    } 
    else if (action === 'reject') {
       if (product.status === 'pending_delete') {
         // Từ chối xoá → trả lại approved
         const { error } = await supabaseAdmin
           .from('products')
           .update({ status: 'approved', rejection_reason: rejectionReason || 'Quản trị viên giữ lại sản phẩm này' })
           .eq('id', targetProductId)
         if (error) throw error;
         
         if (product.seller_id) {
            await supabaseAdmin.from('notifications').insert({
              seller_id: product.seller_id,
              message: `Yêu cầu gỡ sản phẩm "${product.name}" bị từ chối. Lý do: ${rejectionReason || 'Được giữ lại bởi quản trị viên'}. Sản phẩm vẫn đang hiển thị.`
            })
         }
         return NextResponse.json({ success: true, message: 'Đã từ chối xoá, sản phẩm được giữ lại' })
       } else {
         // Từ chối duyệt mới/sửa → CHUYỂN TRẠNG THÁI REJECTED, KO XOÁ
         if (!rejectionReason) {
            return NextResponse.json({ error: 'Cần nhập lý do từ chối để chủ thể biết chỉnh sửa' }, { status: 400 })
         }

         const { error } = await supabaseAdmin
           .from('products')
           .update({ status: 'rejected', rejection_reason: rejectionReason })
           .eq('id', targetProductId)
         
         if (error) throw error;
         
         if (product.seller_id) {
            await supabaseAdmin.from('notifications').insert({
              seller_id: product.seller_id,
              message: `Sản phẩm "${product.name}" chưa được duyệt hiển thị. Lý do: ${rejectionReason}. Vui lòng chỉnh sửa lại theo yêu cầu.`
            })
         }

         return NextResponse.json({ success: true, message: 'Đã từ chối sản phẩm. Lý do đã được gửi.' })
       }
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch(e) {
     return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
