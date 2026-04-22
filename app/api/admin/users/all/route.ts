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
      return { id: decoded.user_id, email: decoded.email }
    }
    return null
  } catch (e) {
    return null
  }
}

// GET: Lấy tất cả user (không chỉ pending)
export async function GET(req: NextRequest) {
  const adminDoc = await checkAdminAuth(req)
  if (!adminDoc) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_approved, created_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Không thể lấy danh sách người dùng' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

// DELETE: Xoá tài khoản cụ thể
export async function DELETE(req: NextRequest) {
  const adminDoc = await checkAdminAuth(req)
  if (!adminDoc) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })
    }

    // Không cho xoá admin
    const { data: userToDelete } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', targetUserId)
      .single()

    if (!userToDelete) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    if (userToDelete.role === 'admin') {
      return NextResponse.json({ error: 'Không thể xoá tài khoản quản trị viên từ đây' }, { status: 403 })
    }

    // Xoá sản phẩm liên quan nếu là seller
    if (userToDelete.role === 'seller') {
      // Lấy danh sách sản phẩm của seller
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('seller_id', targetUserId)

      if (products && products.length > 0) {
        const productIds = products.map(p => p.id)
        // Xoá ảnh sản phẩm
        await supabaseAdmin.from('images').delete().in('product_id', productIds)
        // Xoá đánh giá
        await supabaseAdmin.from('product_reviews').delete().in('product_id', productIds)
        // Xoá sản phẩm
        await supabaseAdmin.from('products').delete().eq('seller_id', targetUserId)
      }

      // Xoá thông báo
      await supabaseAdmin.from('notifications').delete().eq('seller_id', targetUserId)
      // Xoá seller profiles
      await supabaseAdmin.from('seller_profiles').delete().eq('user_id', targetUserId)
    }

    // Xoá user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (error) {
      return NextResponse.json({ error: 'Xoá tài khoản thất bại: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Đã xoá tài khoản ${userToDelete.email}` })
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ: ' + e.message }, { status: 500 })
  }
}
