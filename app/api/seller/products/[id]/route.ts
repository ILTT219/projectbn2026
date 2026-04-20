import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'
import { Buffer } from 'buffer'

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

const supabaseAdmin = getSupabaseAdmin()

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sellerId = await checkSellerAuth(req)
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // Validate ownership
  const { data: prod } = await supabaseAdmin.from('products').select('seller_id').eq('id', id).single()
  if (!prod || (prod.seller_id !== sellerId && sellerId !== 1 /* admin bypass */)) {
    return NextResponse.json({ error: 'Khô ráo nhé, không được xoá đồ của người khác' }, { status: 403 })
  }

  // Thay vì xóa ngay, chúng ta chuyển trạng thái thành chờ admin duyệt xoá
  const { error } = await supabaseAdmin.from('products').update({ status: 'pending_delete' }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Delete request failed' }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Đã gửi yêu cầu xoá cho Quản trị viên' })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sellerId = await checkSellerAuth(req)
  if (!sellerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  // Validate ownership
  const { data: prod } = await supabaseAdmin.from('products').select('seller_id').eq('id', id).single()
  if (!prod || (prod.seller_id !== sellerId && sellerId !== 1)) {
    return NextResponse.json({ error: 'Không được sửa đồ của người khác!' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const name = formData.get('name')?.toString()
    const category_id = formData.get('category_id') ? parseInt(formData.get('category_id')!.toString()) : undefined
    const origin = formData.get('origin')?.toString()
    const description = formData.get('description')?.toString()
    const contact_address = formData.get('contact_address')?.toString()
    const phone = formData.get('phone')?.toString()

    const updatePayload: any = {}
    if (name !== undefined) updatePayload.name = name
    if (category_id !== undefined) updatePayload.category_id = category_id
    if (origin !== undefined) updatePayload.origin = origin
    if (description !== undefined) updatePayload.description = description
    if (contact_address !== undefined) updatePayload.contact_address = contact_address
    if (phone !== undefined) updatePayload.phone = phone

    const repFile = formData.get('representative') as File | null
    if (repFile && repFile.size) {
      const fileName = `${id}-representative-${Date.now()}-${repFile.name}`
      const arrayBuffer = await repFile.arrayBuffer()
      const { data: uploadData } = await supabaseAdmin.storage
        .from('product-images')
        .upload(`products/${fileName}`, Buffer.from(arrayBuffer), {
          contentType: repFile.type,
        })

      if (uploadData) {
        updatePayload.img = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      // Khi cập nhật sản phẩm, chuyển trạng thái về chờ duyệt
      updatePayload.status = 'pending_edit'
      const { error } = await supabaseAdmin.from('products').update(updatePayload).eq('id', id)
      if (error) throw error
    }

    // Handle supplementary images
    const images = formData.getAll('images') as File[]
    const rowsToInsert: { product_id: number; image_url: string; img_id: number }[] = []
    const generateImgId = () => Math.floor(Date.now() * 1000 + Math.random() * 1000)

    for (const file of images) {
      if (!file || !file.size) continue
      const randomSuffix = Math.random().toString(36).substr(2, 9)
      const fileName = `${id}-${Date.now()}-${randomSuffix}-${file.name}`
      const arrayBuffer = await file.arrayBuffer()
      const { data: uploadData } = await supabaseAdmin.storage
        .from('product-images')
        .upload(`products/${fileName}`, Buffer.from(arrayBuffer), {
          contentType: file.type,
        })

      if (uploadData) {
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
        rowsToInsert.push({ product_id: id, image_url: url, img_id: generateImgId() })
      }
    }

    if (rowsToInsert.length > 0) {
      await supabaseAdmin.from('images').insert(rowsToInsert)
    }

    return NextResponse.json({ success: true, message: 'Đã lưu và đang chờ duyệt chỉnh sửa' })
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
