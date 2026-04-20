import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkAuth(req: NextRequest) {
  const token = req.cookies.get('user_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    return decoded
  } catch (e) {
    return null
  }
}

export async function GET(req: NextRequest) {
  const user = await checkAuth(req)
  if (!user || user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('seller_id', user.user_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
