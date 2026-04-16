import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// service role client bypasses RLS so the route can read users table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Quên bút danh hay mật thư rồi ta?' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, password, role, is_approved')
      .eq('email', email)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Người này không tồn tại trong Sổ' }, { status: 401 })
    }

    const match = await bcrypt.compare(password, data.password)
    if (!match) {
      return NextResponse.json({ error: 'Mật thư sai toét' }, { status: 401 })
    }

    if (!data.is_approved && data.role !== 'admin') {
      return NextResponse.json({ error: 'Tài khoản của bạn đang chờ Quản trị viên duyệt' }, { status: 403 })
    }

    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not defined')
    }
    
    // Đóng gói thông tin phân quyền vào Phiếu bảo hành (JWT)
    const token = jwt.sign({ user_id: data.id, email, role: data.role, is_approved: data.is_approved }, secret, { expiresIn: '8h' })

    const res = NextResponse.json({ success: true, role: data.role })
    
    // Gắn thẻ này vào máy khách, có hạn 8 tiếng
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'strict',
    })
    return res
  } catch (err: any) {
    console.error('Login error', err)
    return NextResponse.json({ error: 'Lực lượng chức năng đang bận' }, { status: 500 })
  }
}
