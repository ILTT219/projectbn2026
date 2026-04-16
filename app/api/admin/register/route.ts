import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Email của Owner — chỉ tài khoản này mới được tạo QTV mới
const OWNER_EMAIL = 't219t3@gmail.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Kiểm tra quyền Admin: Lấy email để biết có phải là Owner không.
 */
async function checkAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role !== 'admin') return null

    // Truy vấn email thực tế từ DB
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', decoded.user_id)
      .single()

    if (!user) return null
    return { id: decoded.user_id, email: user.email }
  } catch (e) {
    return null
  }
}

export async function POST(req: NextRequest) {
  const adminInfo = await checkAdminAuth(req)
  if (!adminInfo) {
    return NextResponse.json({ error: 'Chỉ Quản trị viên mới được thực hiện hành động này.' }, { status: 401 })
  }

  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
        return NextResponse.json({ error: 'Email này đã tồn tại trong hệ thống' }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const isOwner = adminInfo.email === OWNER_EMAIL || adminInfo.email.startsWith('t219t3@');

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{ email, password: hashedPassword, role: 'admin', is_approved: isOwner }])
      .select('id, email')
      .single()

    if (insertError || !newUser) {
       return NextResponse.json({ error: 'Không thể tạo Quản trị viên lúc này' }, { status: 500 })
    }

    if (isOwner) {
       return NextResponse.json({ success: true, message: `Đã tạo thành công Quản trị viên: ${newUser.email}` })
    } else {
       return NextResponse.json({ success: true, message: `Đã đề xuất thêm Quản trị viên: ${newUser.email}. Chờ Owner duyệt.` })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
