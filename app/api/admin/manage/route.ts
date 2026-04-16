import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Email của Owner — chỉ tài khoản này mới được quản lý QTV
const OWNER_EMAIL = 't219t3@gmail.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Kiểm tra quyền Owner: Chỉ owner (t219t3@gmail.com) mới được quản lý danh sách QTV.
 */
async function checkOwnerAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role !== 'admin') return null

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', decoded.user_id)
      .single()

    if (!user || user.email !== OWNER_EMAIL) return null
    return decoded.user_id
  } catch (e) {
    return null
  }
}

/**
 * GET: Lấy danh sách tất cả QTV (chỉ Owner)
 */
export async function GET(req: NextRequest) {
  if (!(await checkOwnerAuth(req))) {
    return NextResponse.json({ error: 'Chỉ Owner mới có quyền xem danh sách QTV.' }, { status: 403 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Không thể lấy danh sách QTV' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

/**
 * DELETE: Xoá một QTV (chỉ Owner, không thể xoá chính Owner)
 */
export async function DELETE(req: NextRequest) {
  if (!(await checkOwnerAuth(req))) {
    return NextResponse.json({ error: 'Chỉ Owner mới có quyền xoá QTV.' }, { status: 403 })
  }

  try {
    const { targetAdminId } = await req.json()
    if (!targetAdminId) {
      return NextResponse.json({ error: 'Thiếu ID QTV cần xoá' }, { status: 400 })
    }

    // Kiểm tra không cho phép xoá chính Owner
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('id', targetAdminId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'QTV không tồn tại' }, { status: 404 })
    }

    if (targetUser.email === OWNER_EMAIL) {
      return NextResponse.json({ error: 'Không thể xoá tài khoản Owner!' }, { status: 403 })
    }

    if (targetUser.role !== 'admin') {
      return NextResponse.json({ error: 'Đây không phải tài khoản QTV' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetAdminId)

    if (error) {
      return NextResponse.json({ error: 'Xoá QTV thất bại' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Đã xoá QTV: ${targetUser.email}` })
  } catch (e) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
