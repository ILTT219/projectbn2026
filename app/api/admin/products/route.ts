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
       const { error } = await supabaseAdmin
          .from('products')
          .update({ status: 'approved' })
          .eq('id', targetProductId)
          
       if (error) throw error;
       return NextResponse.json({ success: true, message: `Đã duyệt sản phẩm` })
    } 
    else if (action === 'reject') {
       // Nếu là từ chối một sản phẩm pending_new, ta có thể đổi trạng thái thành rejected hoặc xóa
       // Ở đây ta xoá để dễ dọn rác
       const { error } = await supabaseAdmin
          .from('products')
          .delete() // Tạm thời xoá sản phẩm bị từ chối
          .eq('id', targetProductId)
          
       if (error) throw error;
       return NextResponse.json({ success: true, message: 'Đã từ chối và xoá sản phẩm' })
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch(e) {
     return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
