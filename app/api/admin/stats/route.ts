import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

async function checkAuth(req: NextRequest) {
  if (process.env.SKIP_ADMIN_AUTH === 'true') return true
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return false
  try {
    jwt.verify(token, secret)
    return true
  } catch (e) {
    return false
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, category_id, view_count')
      .order('view_count', { ascending: false })

    if (error) {
      console.error('error fetching stats', error)
      return NextResponse.json({ error: 'Unable to fetch stats' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('GET stats error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}