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
  const adminId = await checkAdminAuth(req)
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at, tax_id, business_registration, ocop_certificate')
      .eq('is_approved', false)
      .neq('role', 'admin') // Lỡ có admin rác thì không liệt kê ở đây
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Không thể lấy danh sách người dùng' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const adminId = await checkAdminAuth(req)
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
       return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })
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
  const adminId = await checkAdminAuth(req)
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { targetUserId } = await req.json()
    if (!targetUserId) {
       return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })
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
