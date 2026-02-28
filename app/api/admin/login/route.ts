import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// service role client bypasses RLS so the route can read admin table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('admin')
      .select('password')
      .eq('email', email)
      .single()

    if (error || !data) {
      console.log('no row for', email)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // debug info - remove in production
    console.log('stored hash for', email, ':', data.password)
    const match = await bcrypt.compare(password, data.password)
    console.log('bcrypt.compare result', match)
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const secret = process.env.ADMIN_JWT_SECRET
    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET is not defined')
    }
    const token = jwt.sign({ email }, secret, { expiresIn: '2h' })

    const res = NextResponse.json({ success: true })
    // cookie scope to /admin so it doesn't flood other routes
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 2 * 60 * 60, // 2 hours
      sameSite: 'strict',
    })
    return res
  } catch (err: any) {
    console.error('Login error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
