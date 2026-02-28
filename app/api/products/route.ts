import { NextResponse, NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const includeImages = searchParams.get('include_images') === 'true'

    let query = supabase.from('products').select(
      includeImages
        ? `id, name, img, view_count, images ( image_url )`
        : 'id, name, img, view_count'
    )

    if (category) {
      query = query.eq('category_id', Number(category))
    }

    let { data, error } = await query.order('view_count', { ascending: false })

    // If join failed due to RLS, try simpler query and fetch images separately
    if (error && includeImages) {
      console.error('Supabase images join error, trying fallback:', error)
      let simpleQuery = supabase.from('products').select('id, name, img, view_count')
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

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { name, category_id } = body

    if (!name || !category_id) {
      return NextResponse.json(
        { error: "Missing required fields: name and category_id" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          category_id: Number(category_id),
        },
      ])
      .select()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (err: any) {
    console.error("Server crash:", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}