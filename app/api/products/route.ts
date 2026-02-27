import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

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
          price: 1,
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