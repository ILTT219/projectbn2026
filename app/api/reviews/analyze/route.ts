import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _sb: SupabaseClient | null = null
function db() {
  if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  return _sb
}

// Từ khóa nguy hiểm cần cảnh báo khẩn cấp
const CRITICAL_KEYWORDS = [
  'chất lượng kém', 'chất lượng tệ', 'vệ sinh', 'mất vệ sinh',
  'ôi thiu', 'hỏng', 'mốc', 'côn trùng', 'giả', 'nhái',
  'quá hạn', 'hết hạn', 'không đảm bảo', 'ngộ độc',
  'lừa đảo', 'lừa', 'bẩn', 'độc hại', 'dị ứng',
  'gãy', 'vỡ', 'nứt', 'rách', 'hư',
  'thất vọng', 'tệ nhất', 'kinh khủng', 'ghê tởm',
]

const WARNING_KEYWORDS = [
  'không hài lòng', 'không tốt', 'tệ', 'dở', 'kém',
  'chậm', 'muộn', 'sai', 'nhầm', 'thiếu',
  'đắt', 'mắc', 'không xứng', 'không đáng',
  'bao bì xấu', 'đóng gói kém', 'giao hàng chậm',
]

export async function POST(req: NextRequest) {
  try {
    const { review_id, product_id, comment, rating } = await req.json()

    if (!review_id || !product_id) {
      return NextResponse.json({ error: 'review_id và product_id bắt buộc' }, { status: 400 })
    }

    const text = (comment || '').toLowerCase()
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    let severity: 'critical' | 'warning' | 'info' = 'info'
    const foundKeywords: string[] = []

    // Phân tích rating-based
    if (rating >= 4) sentiment = 'positive'
    else if (rating <= 2) sentiment = 'negative'

    // Phân tích text-based (override rating nếu phát hiện từ khóa)
    if (text) {
      for (const kw of CRITICAL_KEYWORDS) {
        if (text.includes(kw)) {
          sentiment = 'negative'
          severity = 'critical'
          foundKeywords.push(kw)
        }
      }
      if (severity !== 'critical') {
        for (const kw of WARNING_KEYWORDS) {
          if (text.includes(kw)) {
            sentiment = 'negative'
            severity = 'warning'
            foundKeywords.push(kw)
          }
        }
      }
    }

    // Cập nhật sentiment cho review
    try {
      await db()
        .from('product_reviews')
        .update({ sentiment })
        .eq('id', review_id)
    } catch (e) {
      console.warn('Could not update sentiment column (may not exist yet):', e)
    }

    // Nếu negative → tạo alert
    if (sentiment === 'negative') {
      // Lấy tên sản phẩm
      const { data: product } = await db()
        .from('products')
        .select('name')
        .eq('id', product_id)
        .single()

      const productName = product?.name || `SP #${product_id}`

      // Tạo gợi ý phản hồi bằng AI
      let suggestedResponse = ''
      const apiKey = process.env.GROQ_API_KEY
      if (apiKey && text) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: `Bạn là chuyên gia xử lý khủng hoảng truyền thông cho thương hiệu OCOP.
Tạo MỘT câu phản hồi chuyên nghiệp, chân thành cho đánh giá tiêu cực sau.
Phản hồi phải: lịch sự, cảm ơn phản hồi, xin lỗi nếu cần, cam kết cải thiện.
Chỉ trả về câu phản hồi, không thêm gì khác. Viết bằng tiếng Việt.`
                },
                {
                  role: 'user',
                  content: `Sản phẩm: ${productName}\nĐánh giá: ${comment}\nRating: ${rating}/5 sao`
                }
              ],
              temperature: 0.5,
              max_tokens: 200,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            suggestedResponse = data.choices?.[0]?.message?.content || ''
          }
        } catch (e) {
          console.warn('AI suggestion failed:', e)
        }
      }

      const alertMessage = severity === 'critical'
        ? `🔴 CẢNH BÁO KHẨN: Đánh giá tiêu cực về "${productName}" - phát hiện từ khóa: ${foundKeywords.join(', ')}`
        : `🟡 Cảnh báo: Đánh giá tiêu cực cho "${productName}" (${rating}/5 sao)`

      try {
        await db().from('admin_alerts').insert({
          review_id,
          product_id,
          alert_type: 'negative_review',
          severity,
          message: alertMessage,
          keywords_found: foundKeywords.join(', ') || null,
          suggested_response: suggestedResponse || null,
        })
      } catch (e) {
        console.warn('Could not insert alert (table may not exist yet):', e)
      }
    }

    return NextResponse.json({ sentiment, severity: severity as string, keywords: foundKeywords })
  } catch (err: any) {
    console.error('Analyze review error:', err)
    return NextResponse.json({ error: 'Lỗi phân tích' }, { status: 500 })
  }
}
