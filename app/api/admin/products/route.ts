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
    // Lấy các sản phẩm đang chờ duyệt
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*, users:seller_id(email)')
      .neq('status', 'approved')
      .order('id', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Lỗi lấy dữ liệu' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetProductId, action } = await req.json()
    // action: 'approve' | 'reject'
    if (!targetProductId || !action) {
       return NextResponse.json({ error: 'Thiếu ID sản phẩm hoặc hành động' }, { status: 400 })
    }

    if (action === 'approve') {
       // Kiểm tra trạng thái hiện tại
       const { data: product } = await supabaseAdmin
         .from('products')
         .select('status')
         .eq('id', targetProductId)
         .single()

       if (product?.status === 'pending_delete') {
         // Nếu đang chờ duyệt xoá → thực hiện xoá thật
         await supabaseAdmin.from('images').delete().eq('product_id', targetProductId)
         const { error } = await supabaseAdmin
           .from('products')
           .delete()
           .eq('id', targetProductId)
         if (error) throw error;
         return NextResponse.json({ success: true, message: 'Đã duyệt yêu cầu xoá và xoá sản phẩm' })
       } else {
         // Các trạng thái khác (pending_new, pending_edit) → duyệt thành approved
         const { error } = await supabaseAdmin
           .from('products')
           .update({ status: 'approved' })
           .eq('id', targetProductId)
         if (error) throw error;
         return NextResponse.json({ success: true, message: 'Đã duyệt sản phẩm' })
       }
    } 
    else if (action === 'reject') {
       // Nếu là từ chối pending_delete → khôi phục lại trạng thái approved
       const { data: product } = await supabaseAdmin
         .from('products')
         .select('status')
         .eq('id', targetProductId)
         .single()

       if (product?.status === 'pending_delete') {
         const { error } = await supabaseAdmin
           .from('products')
           .update({ status: 'approved' })
           .eq('id', targetProductId)
         if (error) throw error;
         return NextResponse.json({ success: true, message: 'Đã từ chối xoá, sản phẩm được giữ lại' })
       } else {
         // Từ chối sản phẩm mới/chỉnh sửa → xoá sản phẩm
         const { error } = await supabaseAdmin
           .from('products')
           .delete()
           .eq('id', targetProductId)
         if (error) throw error;
         return NextResponse.json({ success: true, message: 'Đã từ chối và xoá sản phẩm' })
       }
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch(e) {
     return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
