import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// System prompt tối ưu cho chatbot tư vấn sản phẩm
const SYSTEM_PROMPT = `Bạn là tư vấn viên khách hàng chuyên nghiệp cho website nông sản OCOP Bắc Ninh.

QUYẾT TẮC TRẢ LỜI:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
- Ưu tiên cung cấp thông tin dựa trên danh sách SẢN PHẨM bên dưới.
- Nếu người dùng hỏi các câu hỏi kiến thức ngoài lề (lịch sử, địa lý, lễ hội...), hãy tham khảo phần KIẾN THỨC BỔ SUNG (nếu có) và TRÍCH DẪN NGUỒN đầy đủ.
- KHÔNG tự suy đoán hay bịa chuyện nếu không có thông tin.
- Khi khách hỏi xem chi tiết sản phẩm, hãy cung cấp link dứt khoát như: "Bạn có thể xem chi tiết tại /products/[ID]"

ĐỊNH DẠNG TRÌNH BÀY:
Khi liệt kê sản phẩm, dùng format sau (rõ ràng, dễ đọc):
🔹 [ID] Tên sản phẩm
   📍 Nơi sản xuất: Xuất xứ
   📞 Liên hệ: Địa chỉ
   📝 Mô tả chi tiết...
   🔗 Xem chi tiết: /products/[ID]

Dùng emoji để làm rõ ràng:
- ✅ để chỉ có sẵn
- ❌ để chỉ không có
- 🌾 cho sản phẩm nông sản
- 📦 cho thông tin đặc biệt
- 🔗 cho link chi tiết

SẢN PHẨM:
{PRODUCT_DATA}

KIẾN THỨC BỔ SUNG TỪ WIKIPEDIA (nếu có):
{WIKI_DATA}

LUẬT QUAN TRỌNG: Luôn bao gồm link sản phẩm khi trả lời liên quan đến sản phẩm cụ thể. NẾU dùng kiến thức từ Wikipedia, PHẢI để lại link trích dẫn ở cuối câu trả lời.`

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
        .select('id, name, description, origin, contact_address')
        .limit(30)

      if (!error && products && products.length > 0) {
        productData = products
          .map((p: any) => {
            let info = `[${p.id}] ${p.name}\n  📍 ${p.origin || 'N/A'}`
            if (p.contact_address) info += `\n  📞 ${p.contact_address}`
            if (p.description) {
              const desc = p.description.trim().substring(0, 200)
              info += `\n  📝 ${desc}${p.description.length > 200 ? '...' : ''}`
            }
            // Thêm link chi tiết sản phẩm
            const productUrl = `/products/${p.id}`
            info += `\n  🔗 ${productUrl}`
            return info
          })
          .join('\n\n')
      }
    } catch (dbErr) {
      console.warn('Failed to fetch products:', dbErr)
    }

    // Web Search: Use Wikipedia if the query asks for external knowledge
    let wikiContext = "";
    try {
      const lowerMessage = message.toLowerCase();
      // Các từ khóa nghi ngờ cần tra cứu kiến thức
      const needsSearch = lowerMessage.includes('là gì') || lowerMessage.includes('lịch sử') || lowerMessage.includes('ai là') || lowerMessage.includes('tại sao') || lowerMessage.includes('hội') || lowerMessage.includes('lễ') || lowerMessage.includes('tỉnh') || lowerMessage.includes('wiki');
      
      if (needsSearch) {
        const keywords = message.replace(/[?.,!]/g, '').replace(/là gì|cho tôi biết|về|lịch sử|của|bạn có biết/gi, '').trim();
        if (keywords) {
          const wikiUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keywords)}&utf8=&format=json`;
          const wikiRes = await fetch(wikiUrl);
          const wikiData = await wikiRes.json();
          if (wikiData.query?.search?.length > 0) {
            const topResult = wikiData.query.search[0];
            wikiContext = `Tiêu đề: ${topResult.title}\nTóm tắt: ${topResult.snippet.replace(/<[^>]+>/g, '')}\nNguồn tham khảo: https://vi.wikipedia.org/wiki/${encodeURIComponent(topResult.title.replace(/ /g, '_'))}`;
          }
        }
      }
    } catch (e) {
      console.error('Wiki search error:', e);
    }

    const systemPrompt = SYSTEM_PROMPT.replace('{PRODUCT_DATA}', productData).replace('{WIKI_DATA}', wikiContext)

    const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
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