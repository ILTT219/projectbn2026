import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ error: 'Thiếu ID sản phẩm' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Lấy thông tin sản phẩm và người bán
    const { data: product, error } = await supabase
      .from('products')
      .select('name, description, ingredients, origin, price, category_id, seller_id, contact_phone, contact_address')
      .eq('id', productId)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Không tìm thấy sản phẩm' }, { status: 404 })
    }

    // Nếu không có Groq API Key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY chưa được cấu hình' }, { status: 500 })
    }

    // Xây dựng nội dung gốc để AI tham chiếu (tránh bịa đặt)
    const productContext = `
Tên sản phẩm: ${product.name}
Nguồn gốc/Xuất xứ: ${product.origin || 'Chưa rõ'}
Thành phần/Nguyên liệu: ${product.ingredients || 'Đang cập nhật'}
Giá tham khảo: ${product.price ? product.price.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}
Liên hệ: ${product.contact_phone || 'Chưa cập nhật'} - ${product.contact_address || ''}
Mô tả gốc: ${product.description || 'Không có mô tả chi tiết'}
    `.trim()

    const systemPrompt = `Bạn là một Chuyên gia Copywriter và Marketing xuất sắc.
Nhiệm vụ của bạn là viết một bài đăng quảng cáo (Facebook/Social Media Post) cho một sản phẩm nông sản/đặc sản OCOP.

YÊU CẦU BẮT BUỘC (CRITICAL):
1. TRÍCH DẪN THỰC TẾ 100%: Bạn CHỈ ĐƯỢC PHÉP sử dụng các thông tin trong phần "Dữ liệu sản phẩm". TUYỆT ĐỐI KHÔNG BỊA ĐẶT, không tự chế ra các công dụng thần kỳ, không tự bịa thêm thành phần hay giải thưởng nếu dữ liệu không có.
2. VĂN PHONG: Hấp dẫn, thu hút người đọc, có sử dụng Emoji phù hợp (nhưng không lạm dụng).
3. BỐ CỤC BÀI VIẾT:
   - Tiêu đề (Bắt tai, in hoa hoặc nhấn mạnh)
   - Lời dẫn hấp dẫn (1-2 câu)
   - Nêu bật thông tin sản phẩm (Nguồn gốc, thành phần dựa sát dữ liệu thật)
   - Lời kêu gọi hành động (Call to Action) kèm Thông tin Liên hệ (Lấy chính xác số điện thoại/địa chỉ trong dữ liệu).
   - Hashtag liên quan (#OCOP #DacSan #...)

Dữ liệu sản phẩm:
${productContext}`

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'system',
          content: systemPrompt
        }],
        temperature: 0.3, // Temperature thấp để tránh sáng tạo quá mức (bịa đặt)
        max_tokens: 1024
      })
    })

    if (!groqRes.ok) {
      throw new Error('Lỗi khi gọi AI API')
    }

    const groqData = await groqRes.json()
    const content = groqData.choices[0]?.message?.content || ''

    return NextResponse.json({ content })

  } catch (err: any) {
    console.error('Marketing AI Error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống khi tạo bài viết' }, { status: 500 })
  }
}
