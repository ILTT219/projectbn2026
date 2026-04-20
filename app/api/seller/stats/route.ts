import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

async function checkSellerAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role === 'seller' || decoded.role === 'admin') return decoded
    return null
  } catch (e) {
    return null
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const user = await checkSellerAuth(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // If admin, show all; if seller, only their products
    let query = supabaseAdmin
      .from('products')
      .select('id, name, category_id, view_count, status, img')
      .order('view_count', { ascending: false })

    if (user.role === 'seller') {
      query = query.eq('seller_id', user.user_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('error fetching stats', error)
      return NextResponse.json({ error: 'Unable to fetch stats' }, { status: 500 })
    }

    // Calculate summary
    const totalViews = (data || []).reduce((sum: number, p: any) => sum + (p.view_count || 0), 0)
    const totalProducts = (data || []).length
    const approvedProducts = (data || []).filter((p: any) => p.status === 'approved').length

    return NextResponse.json({ 
      data, 
      summary: { totalViews, totalProducts, approvedProducts } 
    })
  } catch (err: any) {
    console.error('GET stats error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}