import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const includeImages = searchParams.get('include_images') === 'true'

    let query = supabase.from('products').select(
      includeImages
        ? `id, name, img, view_count, images ( image_url )`
        : 'id, name, img, view_count'
    ).eq('status', 'approved')

    if (category) {
      query = query.eq('category_id', Number(category))
    }

    let { data, error } = await query.order('view_count', { ascending: false })

    // If join failed due to RLS, try simpler query and fetch images separately
    if (error && includeImages) {
      console.error('Supabase images join error, trying fallback:', error)
      let simpleQuery = supabase.from('products').select('id, name, img, view_count').eq('status', 'approved')
      if (category) {
        simpleQuery = simpleQuery.eq('category_id', Number(category))
      }
      const { data: simpleData, error: simpleError } = await simpleQuery.order('view_count', { ascending: false })
      
      if (!simpleError && simpleData) {
        // fetch images for each product separately
        const productsWithImages = await Promise.all(
          simpleData.map(async (p: any) => {
            const { data: imgs } = await supabase
              .from('images')
              .select('image_url')
              .eq('product_id', p.id)
            return { ...p, images: imgs || [] }
          })
        )
        return NextResponse.json({ data: productsWithImages })
      }
      error = simpleError
    }

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('GET products error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
