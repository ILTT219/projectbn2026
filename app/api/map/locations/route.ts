import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tọa độ các làng nghề nổi tiếng Bắc Ninh
const CRAFT_VILLAGES: Record<string, { lat: number; lng: number; village: string; specialty: string }> = {
  'đồng kỵ': { lat: 21.0847, lng: 106.0083, village: 'Làng nghề Đồng Kỵ', specialty: 'Gỗ mỹ nghệ' },
  'phù lãng': { lat: 21.1667, lng: 106.1833, village: 'Làng gốm Phù Lãng', specialty: 'Gốm sứ' },
  'đại bái': { lat: 21.1200, lng: 106.2300, village: 'Làng đồng Đại Bái', specialty: 'Đồ đồng' },
  'từ sơn': { lat: 21.1167, lng: 106.0000, village: 'Thị xã Từ Sơn', specialty: 'Gỗ, sắt thép' },
  'lim': { lat: 21.0900, lng: 106.0500, village: 'Làng Lim', specialty: 'Quan họ, văn hóa' },
  'tiên du': { lat: 21.0833, lng: 106.0667, village: 'Huyện Tiên Du', specialty: 'Văn hóa, nông sản' },
  'quế võ': { lat: 21.1500, lng: 106.1500, village: 'Huyện Quế Võ', specialty: 'Nông sản, dược liệu' },
  'thuận thành': { lat: 21.0333, lng: 106.1333, village: 'Huyện Thuận Thành', specialty: 'Tương, bánh' },
  'gia bình': { lat: 21.0667, lng: 106.2000, village: 'Huyện Gia Bình', specialty: 'Đồ đồng, nông sản' },
  'lương tài': { lat: 21.0167, lng: 106.2333, village: 'Huyện Lương Tài', specialty: 'Nông sản' },
  'yên phong': { lat: 21.1667, lng: 106.0167, village: 'Huyện Yên Phong', specialty: 'Công nghiệp, nông sản' },
  'bắc ninh': { lat: 21.1861, lng: 106.0763, village: 'TP. Bắc Ninh', specialty: 'Trung tâm OCOP' },
  'tương giang': { lat: 21.1100, lng: 105.9900, village: 'Làng nghề Tương Giang', specialty: 'Sắt thép' },
  'đình bảng': { lat: 21.1000, lng: 105.9800, village: 'Đình Bảng', specialty: 'Gỗ mỹ nghệ' },
  'hạ mỗ': { lat: 21.1400, lng: 106.0600, village: 'Làng tranh Đông Hồ', specialty: 'Tranh dân gian' },
  'đông hồ': { lat: 21.1400, lng: 106.0600, village: 'Làng tranh Đông Hồ', specialty: 'Tranh dân gian Đông Hồ' },
  'phù khê': { lat: 21.1050, lng: 106.0000, village: 'Làng nghề Phù Khê', specialty: 'Gỗ mỹ nghệ' },
}

function matchLocation(origin: string): { lat: number; lng: number } {
  const lower = (origin || '').toLowerCase()
  for (const [key, val] of Object.entries(CRAFT_VILLAGES)) {
    if (lower.includes(key)) {
      // Thêm jitter nhỏ để không chồng marker
      return {
        lat: val.lat + (Math.random() - 0.5) * 0.005,
        lng: val.lng + (Math.random() - 0.5) * 0.005,
      }
    }
  }
  // Gán địa chỉ phân phối phổ biến trong tỉnh Bắc Ninh nếu không rõ tọa độ (Tâm TP Bắc Ninh)
  return {
    lat: 21.1861 + (Math.random() - 0.5) * 0.08,
    lng: 106.0763 + (Math.random() - 0.5) * 0.08,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('category')

    let query = supabase
      .from('products')
      .select('id, name, img, origin, contact_address, category_id, phone')
      .eq('status', 'approved')
      .not('origin', 'is', null)

    if (categoryId) {
      query = query.eq('category_id', Number(categoryId))
    }

    const { data: products, error } = await query.order('view_count', { ascending: false })

    if (error) {
      console.error('Map locations error:', error)
      return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 })
    }

    // Map products to locations
    const locations = (products || [])
      .map((p: any) => {
        const coords = matchLocation(p.origin || '')
        return {
          id: p.id,
          name: p.name,
          img: p.img,
          origin: p.origin || 'Bắc Ninh',
          contact_address: p.contact_address,
          category_id: p.category_id,
          phone: p.phone,
          lat: coords.lat,
          lng: coords.lng,
        }
      })

    // Danh sách làng nghề với thông tin
    const villages = Object.entries(CRAFT_VILLAGES).map(([key, val]) => ({
      key,
      name: val.village,
      specialty: val.specialty,
      lat: val.lat,
      lng: val.lng,
      productCount: locations.filter((l: any) =>
        (l.origin || '').toLowerCase().includes(key)
      ).length,
    }))

    return NextResponse.json({
      locations,
      villages,
      total: locations.length,
    })
  } catch (err: any) {
    console.error('Map API error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
