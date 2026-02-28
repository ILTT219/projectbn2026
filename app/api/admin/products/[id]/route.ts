import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'buffer'
import jwt from 'jsonwebtoken'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// reuse the auth helper from parent route if desired; duplicate for simplicity
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // allow larger uploads when updating a product
    },
  },
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      console.error('fetch product error', error)
      return NextResponse.json({ error: 'Unable to fetch product' }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('GET product error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const formData = await req.formData()
    const name = formData.get('name')?.toString() || ''
    const category_id = parseInt(formData.get('category_id')?.toString() || '0')
    const origin = formData.get('origin')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const contact_address = formData.get('contact_address')?.toString() || ''

    if (!name || !category_id) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    // update main fields
    const { error: updErr } = await supabaseAdmin
      .from('products')
      .update({
        name,
        category_id,
        origin: origin || null,
        description: description || null,
        contact_address: contact_address || null,
      })
      .eq('id', id)

    if (updErr) {
      console.error('update product error', updErr)
      return NextResponse.json({ error: 'Unable to update product' }, { status: 500 })
    }

    // handle representative image if new file provided
    const repFile = formData.get('representative') as File | null
    if (repFile && repFile.size) {
      const fileName = `${id}-representative-${Date.now()}-${repFile.name}`
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
          .eq('id', id)
      }
    }

    // handle additional gallery images on update as well
    const images = formData.getAll('images') as File[]
    if (images.length > 0) {
      // delete existing gallery rows so the product detail shows only the new set
      await supabaseAdmin.from('images').delete().eq('product_id', id)

      const rowsToInsert: { product_id: number; image_url: string; img_id: number }[] = []
      const generateImgId = () => {
        return Math.floor(Date.now() * 1000 + Math.random() * 1000)
      }

      for (const file of images) {
        if (!file || !file.size) continue
        const randomSuffix = Math.random().toString(36).substr(2, 9)
        const fileName = `${id}-${Date.now()}-${randomSuffix}-${file.name}`
        const arrayBuffer = await file.arrayBuffer()
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from('product-images')
          .upload(`products/${fileName}`, Buffer.from(arrayBuffer), {
            contentType: file.type,
          })

        if (uploadErr) {
          console.error('upload error for', file.name, uploadErr)
          continue
        }

        if (uploadData) {
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
          rowsToInsert.push({ product_id: idNum, image_url: url, img_id: generateImgId() })
        }
      }

      if (rowsToInsert.length > 0) {
        const { data: inserted, error: insertErr } = await supabaseAdmin.from('images').insert(rowsToInsert)
        if (insertErr) {
          console.error('images insert error on update', insertErr)
          return NextResponse.json({ error: 'Unable to save product images', details: insertErr.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('PUT product error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const idNum = Number(id)
  if (isNaN(idNum)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    // remove related images first
    await supabaseAdmin.from('images').delete().eq('product_id', id)
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) {
      console.error('delete product error', error)
      return NextResponse.json({ error: 'Unable to delete product' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE product error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
