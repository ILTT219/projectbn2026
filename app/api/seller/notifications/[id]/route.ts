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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await checkAuth(req)
  if (!user || user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    // Đảm bảo notification thuộc về seller này
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', parseInt(id))
      .eq('seller_id', user.user_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
