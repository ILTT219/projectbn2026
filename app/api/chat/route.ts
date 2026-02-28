import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// System prompt tối ưu cho chatbot tư vấn sản phẩm
const SYSTEM_PROMPT = `Bạn là tư vấn viên khách hàng chuyên nghiệp cho website nông sản.

QUYẾT TẮC TRẢ LỜI:
- CHỈ trả lời dựa trên thông tin sản phẩm được cung cấp
- Nếu không có dữ liệu: "Hiện tại hệ thống chưa có dữ liệu về sản phẩm này"
- KHÔNG tự suy đoán hay bịa chuyện
- Trả lời tiếng Việt, thân thiện

ĐỊNH DẠNG TRÌNH BÀY:
Khi liệt kê sản phẩm, dùng format sau (rõ ràng, dễ đọc):
🔹 [ID] Tên sản phẩm
   📍 Nơi sản xuất: Xuất xứ
   📞 Liên hệ: Địa chỉ

Dùng emoji để làm rõ ràng:
- ✅ để chỉ có sẵn
- ❌ để chỉ không có
- 🌾 cho sản phẩm nông sản
- 📦 cho thông tin đặc biệt

SẢN PHẨM:
{PRODUCT_DATA}

Trả lời giúp khách hàng dễ hiểu được.`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || !message.trim()) return NextResponse.json({ reply: '' })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: 'Error: GROQ_API_KEY not configured' }, { status: 500 })
    }

    // Lấy thông tin sản phẩm từ Supabase - tối ưu
    let productData = "Chưa có sản phẩm."
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, origin, contact_address')
        .limit(30)

      if (!error && products && products.length > 0) {
        productData = products
          .map((p: any) => {
            let info = `[${p.id}] ${p.name}\n  📍 ${p.origin || 'N/A'}`
            if (p.contact_address) info += `\n  📞 ${p.contact_address}`
            return info
          })
          .join('\n\n')
      }
    } catch (dbErr) {
      console.warn('Failed to fetch products:', dbErr)
    }

    const systemPrompt = SYSTEM_PROMPT.replace('{PRODUCT_DATA}', productData)

    const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
    console.log('Using GROQ_MODEL=', GROQ_MODEL)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 512,
      }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('Groq error', res.status, txt)
      // If the model was decommissioned, provide a helpful message to the developer
      try {
        const parsed = JSON.parse(txt)
        if (parsed?.error?.code === 'model_decommissioned') {
          return NextResponse.json({
            reply: `Model decommissioned: ${parsed.error.message}. Set a supported model via GROQ_MODEL in your .env.local. See https://console.groq.com/docs/deprecations for recommendations.`,
            status: res.status,
            body: parsed,
            model: GROQ_MODEL,
            apiKeyPresent: !!apiKey
          }, { status: 502 })
        }
      } catch (e) {
        // ignore JSON parse errors
      }

      // return the provider body to client for easier debugging
      return NextResponse.json({ reply: 'Groq API error', status: res.status, body: txt, model: GROQ_MODEL, apiKeyPresent: !!apiKey }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? 'No response'

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Chat error:', err.message)
    return NextResponse.json(
      { reply: 'Error: ' + err.message },
      { status: 500 }
    )
  }
}