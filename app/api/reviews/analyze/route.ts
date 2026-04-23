import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _sb: SupabaseClient | null = null
function db() {
  if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  return _sb
}

// Từ khóa nguy hiểm — chỉ dùng làm fallback khi AI không khả dụng
// Lưu ý: Các từ ngắn (≤2 ký tự) phải được match theo word boundary
const CRITICAL_KEYWORDS = [
  'chất lượng kém', 'chất lượng tệ', 'mất vệ sinh',
  'ôi thiu', 'bị mốc', 'côn trùng', 'hàng giả', 'hàng nhái',
  'quá hạn', 'hết hạn', 'không đảm bảo', 'ngộ độc',
  'lừa đảo', 'bị bẩn', 'độc hại', 'dị ứng',
  'bị gãy', 'bị vỡ', 'bị nứt', 'bị rách', 'bị hư', 'bị hỏng',
  'thất vọng', 'tệ nhất', 'kinh khủng', 'ghê tởm',
]

const WARNING_KEYWORDS = [
  'không hài lòng', 'không tốt', 'rất tệ', 'rất dở', 'rất kém',
  'giao hàng chậm', 'đóng gói kém', 'bao bì xấu',
  'quá đắt', 'quá mắc', 'không xứng', 'không đáng',
  'bị sai', 'bị nhầm', 'bị thiếu',
]

/**
 * Kiểm tra keyword theo word boundary (tránh false positive như "bình thường" → "hư")
 * Dùng regex: keyword phải nằm ở đầu/cuối chuỗi hoặc được bao quanh bởi khoảng trắng/dấu câu
 */
function matchKeyword(text: string, keyword: string): boolean {
  // Escape special regex chars trong keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Word boundary cho tiếng Việt: đầu chuỗi/space/dấu câu trước + sau keyword
  const regex = new RegExp(`(?:^|[\\s,\\.!?;:"'()\\[\\]{}])${escaped}(?:$|[\\s,\\.!?;:"'()\\[\\]{}])`, 'i')
  // Thêm space ở đầu/cuối để regex hoạt động đúng cho keyword ở đầu/cuối chuỗi
  return regex.test(` ${text} `)
}

export async function POST(req: NextRequest) {
  try {
    const { review_id, product_id, comment, rating } = await req.json()

    if (!review_id || !product_id) {
      return NextResponse.json({ error: 'review_id và product_id bắt buộc' }, { status: 400 })
    }

    const text = (comment || '').trim()
    const textLower = text.toLowerCase()
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    let severity: 'critical' | 'warning' | 'info' = 'info'
    let foundKeywords: string[] = []
    let aiAnalyzed = false

    // ========== PHƯƠNG PHÁP 1: Phân tích bằng AI (ưu tiên) ==========
    const apiKey = process.env.GROQ_API_KEY
    if (apiKey && text.length > 0) {
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
                content: `Bạn là hệ thống phân tích cảm xúc đánh giá sản phẩm OCOP.
Phân tích đánh giá và trả về JSON duy nhất (không thêm text):
{
  "sentiment": "positive" | "neutral" | "negative",
  "severity": "info" | "warning" | "critical",
  "keywords": ["từ khóa tiêu cực nếu có"],
  "reason": "lý do ngắn gọn"
}

Quy tắc:
- "critical": đánh giá đề cập đến vấn đề an toàn, sức khỏe, gian lận, hàng giả, ngộ độc
- "warning": đánh giá thể hiện sự không hài lòng rõ ràng
- "info": đánh giá bình thường hoặc tích cực
- CHỈ đánh dấu negative khi người dùng THỰC SỰ phàn nàn. Ví dụ "bình thường" = neutral, KHÔNG phải negative.
- Phân biệt rõ ngữ cảnh: "sản phẩm bị hư" = negative, "bình thường" = neutral (dù chứa ký tự "hư")
- Rating ≤ 2 mà comment tích cực → tin theo comment. Rating ≥ 4 mà comment tiêu cực → tin theo comment.`
              },
              {
                role: 'user',
                content: `Rating: ${rating}/5 sao\nĐánh giá: "${text}"`
              }
            ],
            temperature: 0.1,
            max_tokens: 200,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const content = data.choices?.[0]?.message?.content || ''
          // Parse JSON từ response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            sentiment = parsed.sentiment || sentiment
            severity = parsed.severity || severity
            foundKeywords = parsed.keywords || []
            aiAnalyzed = true
          }
        }
      } catch (e) {
        console.warn('AI sentiment analysis failed, falling back to keyword matching:', e)
      }
    }

    // ========== PHƯƠNG PHÁP 2: Fallback keyword matching (word boundary) ==========
    if (!aiAnalyzed) {
      // Rating-based
      if (rating >= 4) sentiment = 'positive'
      else if (rating <= 2) sentiment = 'negative'

      if (textLower) {
        // Quét critical keywords với word boundary
        for (const kw of CRITICAL_KEYWORDS) {
          if (matchKeyword(textLower, kw)) {
            sentiment = 'negative'
            severity = 'critical'
            foundKeywords.push(kw)
          }
        }
        // Quét warning keywords nếu chưa critical
        if (severity !== 'critical') {
          for (const kw of WARNING_KEYWORDS) {
            if (matchKeyword(textLower, kw)) {
              sentiment = 'negative'
              severity = 'warning'
              foundKeywords.push(kw)
            }
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

    // Nếu negative → tạo alert cho admin
    if (sentiment === 'negative') {
      const { data: product } = await db()
        .from('products')
        .select('name')
        .eq('id', product_id)
        .single()

      const productName = product?.name || `SP #${product_id}`

      // Tạo gợi ý phản hồi bằng AI
      let suggestedResponse = ''
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
                  content: `Sản phẩm: ${productName}\nĐánh giá: ${text}\nRating: ${rating}/5 sao`
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
        ? `🔴 CẢNH BÁO KHẨN: Đánh giá tiêu cực về "${productName}"${foundKeywords.length > 0 ? ` - phát hiện: ${foundKeywords.join(', ')}` : ''}`
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

    return NextResponse.json({
      sentiment,
      severity: severity as string,
      keywords: foundKeywords,
      ai_analyzed: aiAnalyzed,
    })
  } catch (err: any) {
    console.error('Analyze review error:', err)
    return NextResponse.json({ error: 'Lỗi phân tích' }, { status: 500 })
  }
}
