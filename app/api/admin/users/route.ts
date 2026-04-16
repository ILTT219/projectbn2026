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

export async function GET(req: NextRequest) {
  const adminDoc = await checkAdminAuth(req)
  if (!adminDoc) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isOwner = adminDoc.email === 't219t3' || adminDoc.email?.startsWith('t219t3@');

  try {
    let query = supabaseAdmin
      .from('users')
      .select('id, email, role, created_at, tax_id, business_registration, ocop_certificate')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })

    if (!isOwner) {
      query = query.neq('role', 'admin') // Chỉ có owner mới thấy admin rác
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Không thể lấy danh sách người dùng' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const adminDoc = await checkAdminAuth(req)
  if (!adminDoc) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isOwner = adminDoc.email === 't219t3' || adminDoc.email?.startsWith('t219t3@');

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
       return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })
    }

    const { data: userToApprove } = await supabaseAdmin.from('users').select('role').eq('id', targetUserId).single()
    if (userToApprove?.role === 'admin' && !isOwner) {
       return NextResponse.json({ error: 'Chỉ Owner mới có quyền duyệt Quản trị viên' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_approved: true })
      .eq('id', targetUserId)
      .select('id, email')
      .single()

    if (error || !data) {
       return NextResponse.json({ error: 'Phê duyệt thất bại' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Đã phê duyệt tài khoản ${data.email}` })
  } catch(e) {
     return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const adminDoc = await checkAdminAuth(req)
  if (!adminDoc) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isOwner = adminDoc.email === 't219t3' || adminDoc.email?.startsWith('t219t3@');

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
       return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })
    }

    const { data: userToDelete } = await supabaseAdmin.from('users').select('role').eq('id', targetUserId).single()
    if (userToDelete?.role === 'admin' && !isOwner) {
       return NextResponse.json({ error: 'Chỉ Owner mới có quyền từ chối Quản trị viên' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (error) {
       return NextResponse.json({ error: 'Từ chối thất bại' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch(e) {
     return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
