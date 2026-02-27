import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    // Test 1: Fetch all products
    const { data: allProducts, error: allError } = await supabase
      .from("products")
      .select("*")

    // Test 2: Fetch product by ID (if exists)
    const { data: productById, error: byIdError } = await supabase
      .from("products")
      .select("*")
      .eq("id", 1)
      .single()

    // Test 3: Check images table
    const { data: allImages, error: imagesError } = await supabase
      .from("images")
      .select("*")

    return NextResponse.json({
      allProducts: { count: allProducts?.length || 0, data: allProducts, error: allError },
      productById: { data: productById, error: byIdError },
      allImages: { count: allImages?.length || 0, data: allImages, error: imagesError },
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
