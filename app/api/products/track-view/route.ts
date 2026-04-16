import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// use service role key here so that tracking works regardless of RLS
// (anon key may not have update permission if RLS is enabled)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    // increment view count
    const { data, error } = await supabase
      .from('products')
      .select('view_count')
      .eq('id', product_id)
      .single()

    if (error || !data) {
      console.error('track-view select error', error)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', product_id)
      .select('view_count')

    if (updateError) {
      console.error('track-view update error', updateError)
      return NextResponse.json({ error: 'Unable to update' }, { status: 500 })
    }
    console.log('track-view success, new count', updated?.[0]?.view_count)

    if (updateError) {
      console.error('update error', updateError)
      return NextResponse.json({ error: 'Unable to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('track view error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
