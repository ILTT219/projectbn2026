import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '6')

    if (!categoryId) {
      return NextResponse.json({ error: 'category_id required' }, { status: 400 })
    }

    // get top viewed products in category, with their images
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        img,
        view_count,
        images (
          image_url
        )
      `)
      .eq('category_id', categoryId)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('supabase featured error', error)
      // if the join fails due to RLS we can still return products without images
      // try a simpler query as a fallback
      const { data: simple, error: simpleErr } = await supabase
        .from('products')
        .select('id, name, img, view_count')
        .eq('category_id', categoryId)
        .order('view_count', { ascending: false })
        .limit(limit)
      if (simpleErr) {
        console.error('supabase featured fallback error', simpleErr)
        return NextResponse.json({ error: 'Unable to fetch products' }, { status: 500 })
      }
      return NextResponse.json({ data: simple || [] })
    }

    return NextResponse.json({ data: products || [] })
  } catch (err: any) {
    console.error('featured products error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
