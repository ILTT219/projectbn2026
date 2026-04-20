import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'buffer'
import jwt from 'jsonwebtoken'

async function checkSellerAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role === 'seller' || decoded.role === 'admin') {
      return decoded.user_id
    }
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
  const sellerId = await checkSellerAuth(req)
  if (!sellerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('id', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Unable to fetch products' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sellerId = await checkSellerAuth(req)
  if (!sellerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const name = formData.get('name')?.toString() || ''
    const category_id = parseInt(formData.get('category_id')?.toString() || '0')
    const origin = formData.get('origin')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const contact_address = formData.get('contact_address')?.toString() || ''
    const phone = formData.get('phone')?.toString() || ''

    if (!name || !category_id) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const { data: prodData, error: prodErr } = await supabaseAdmin
      .from('products')
      .insert([
        {
          name,
          category_id,
          origin: origin || null,
          description: description || null,
          contact_address: contact_address || null,
          phone: phone || null,
          seller_id: sellerId
        },
      ])
      .select()
      .single()

    if (prodErr || !prodData) {
      return NextResponse.json({ error: 'Unable to create product' }, { status: 500 })
    }

    const productId = prodData.id

    const repFile = formData.get('representative') as File | null
    if (repFile && repFile.size) {
      const fileName = `${productId}-representative-${Date.now()}-${repFile.name}`
      const arrayBuffer = await repFile.arrayBuffer()
      const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
        .from('product-images')
        .upload(`products/${fileName}`, Buffer.from(arrayBuffer), {
          contentType: repFile.type,
        })

      if (!uploadErr && uploadData) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
        await supabaseAdmin
          .from('products')
          .update({ img: url })
          .eq('id', productId)
      }
    }

    const images = formData.getAll('images') as File[]
    const rowsToInsert: { product_id: number; image_url: string; img_id: number }[] = []
    const generateImgId = () => Math.floor(Date.now() * 1000 + Math.random() * 1000)

    for (const file of images) {
      if (!file || !file.size) continue
      const randomSuffix = Math.random().toString(36).substr(2, 9)
      const fileName = `${productId}-${Date.now()}-${randomSuffix}-${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
        .from('product-images')
        .upload(`products/${fileName}`, Buffer.from(arrayBuffer), {
          contentType: file.type,
        })

      if (uploadData) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
        rowsToInsert.push({ product_id: productId, image_url: url, img_id: generateImgId() })
      }
    }

    if (rowsToInsert.length > 0) {
      await supabaseAdmin.from('images').insert(rowsToInsert)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
