import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Quên bút danh hay mật thư rồi ta?' }, { status: 400 })
    }
    
    const validRole = (role === 'seller') ? 'seller' : 'user';

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
        return NextResponse.json({ error: 'Bút danh này đã có người xưng tên' }, { status: 400 })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{ email, password: hashedPassword, role: validRole }])
      .select('id, role')
      .single()

    if (insertError || !newUser) {
       console.error("Insert error:", insertError)
       return NextResponse.json({ error: 'Lỗi ghi chép vào sổ' }, { status: 500 })
    }

    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not defined')
    }
    
    // Đóng gói thông tin phân quyền vào Phiếu bảo hành (JWT)
    const token = jwt.sign({ user_id: newUser.id, email, role: newUser.role }, secret, { expiresIn: '8h' })

    const res = NextResponse.json({ success: true, role: newUser.role })
    
    // Gắn thẻ này vào máy khách, có hạn 8 tiếng
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 8 * 60 * 60,
      sameSite: 'strict',
    })
    return res
  } catch (err: any) {
    console.error('Register error', err)
    return NextResponse.json({ error: 'Lực lượng chức năng đang bận' }, { status: 500 })
  }
}
