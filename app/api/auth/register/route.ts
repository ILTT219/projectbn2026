import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Buffer } from 'buffer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function uploadFile(file: File, prefix: string) {
  if (!file || !file.size) return null;
  const arrayBuffer = await file.arrayBuffer();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${prefix}-${Date.now()}-${randomSuffix}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
  const { data, error } = await supabaseAdmin.storage
    .from('product-images')
    .upload(`users/${fileName}`, Buffer.from(arrayBuffer), {
      contentType: file.type,
    });
  if (data) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${data.path}`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    let email, password, role, tax_id, business_registration, ocop_certificate;
    let businessFile: File | null = null;
    let ocopFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      email = formData.get('email')?.toString();
      password = formData.get('password')?.toString();
      role = formData.get('role')?.toString();
      tax_id = formData.get('tax_id')?.toString();
      business_registration = formData.get('business_registration')?.toString();
      ocop_certificate = formData.get('ocop_certificate')?.toString();
      businessFile = formData.get('business_registration_file') as File | null;
      ocopFile = formData.get('ocop_certificate_file') as File | null;
    } else {
      const body = await req.json();
      email = body.email;
      password = body.password;
      role = body.role;
      tax_id = body.tax_id;
      business_registration = body.business_registration;
      ocop_certificate = body.ocop_certificate;
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Quên bút danh hay mật thư rồi ta?' }, { status: 400 })
    }
    
    const validRole = (role === 'seller') ? 'seller' : 'user';
    if (role === 'admin') {
      return NextResponse.json({ error: 'Không thể tự phong làm quản trị viên' }, { status: 403 })
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
        return NextResponse.json({ error: 'Bút danh này đã có người xưng tên' }, { status: 400 })
    }

    if (validRole === 'seller') {
      if (businessFile) {
        const url = await uploadFile(businessFile, 'biz');
        if (url) business_registration = url;
      }
      if (ocopFile) {
        const url = await uploadFile(ocopFile, 'ocop');
        if (url) ocop_certificate = url;
      }
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([{ 
        email, 
        password: hashedPassword, 
        role: validRole, 
        is_approved: false,
        tax_id: validRole === 'seller' ? tax_id : null,
        business_registration: validRole === 'seller' ? business_registration : null,
        ocop_certificate: validRole === 'seller' ? ocop_certificate : null
      }])
      .select('id, role, is_approved')
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
    const token = jwt.sign({ user_id: newUser.id, email, role: newUser.role, is_approved: newUser.is_approved }, secret, { expiresIn: '8h' })

    const res = NextResponse.json({ success: true, role: newUser.role, message: 'Đăng ký thành công. Tài khoản đang chờ quản trị viên phê duyệt.' })
    
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
