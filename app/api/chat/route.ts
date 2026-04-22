import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// System prompt tối ưu cho chatbot tư vấn sản phẩm
const SYSTEM_PROMPT = `Bạn là tư vấn viên chuyên nghiệp cho website nông sản OCOP Bắc Ninh.

QUY TẮC TƯ VẤN SẢN PHẨM (MÔ HÌNH THÁC NƯỚC - BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
Khi khách hàng yêu cầu tìm kiếm sản phẩm, bạn phải quét DANH SÁCH SẢN PHẨM và đối chiếu theo thứ tự độc lập sau:
1. TIÊU CHÍ 1: Khớp Tên gọi.
2. TIÊU CHÍ 2: Khớp Nguyên liệu (dựa vào Tên hoặc Mô tả để phân tích).
=> LUẬT THÉP: Nếu KHÔNG CÓ sản phẩm nào khớp Tiêu chí 1 hoặc Tiêu chí 2, bạn BẮT BUỘC phải nói rõ: "Trong cơ sở dữ liệu hiện không có sản phẩm nào thỏa mãn yêu cầu của bạn".
3. ĐỀ XUẤT THAY THẾ: Chỉ sau khi đã nói rõ câu trên, bạn mới được phép đề xuất các sản phẩm khác có cùng tính chất, công dụng hoặc cùng danh mục để thay thế.

QUY TẮC TRÌNH BÀY (RẤT QUAN TRỌNG):
- TRÌNH BÀY LINK ĐÚNG CHUẨN: Khi nhắc đến bất kỳ sản phẩm nào, TUYỆT ĐỐI KHÔNG in ID khô khan (ví dụ: "[123]"). Bạn BẮT BUỘC phải nhúng link bằng Markdown: [Tên Sản Phẩm](/products/ID).
   -> Viết ĐÚNG: Bạn có thể thử [Bánh Phu Thê Đình Bảng](/products/5)
   -> Viết SAI: Bánh Phu Thê [5] hoặc /products/5
- KHÔNG lặp lại link, không thừa, không thiếu link.
- KHÔNG BỊA ĐẶT SẢN PHẨM NGOÀI DANH SÁCH.

DANH SÁCH SẢN PHẨM KHẢ DỤNG:
{PRODUCT_DATA}

KIẾN THỨC BỔ SUNG TỪ WIKIPEDIA (nếu có):
{WIKI_DATA}`

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
        .select('id, name, description, origin, contact_address, category_id')
        .limit(30)

      if (!error && products && products.length > 0) {
          productData = products
            .map((p: any) => {
              let info = `- ID: ${p.id} | Tên: ${p.name}\n  📍 Xuất xứ: ${p.origin || 'N/A'}`
              if (p.category_id) info += `\n  🏷️ ID Danh mục: ${p.category_id}`
              if (p.contact_address) info += `\n  📞 Liên hệ: ${p.contact_address}`
              if (p.description) {
                const desc = p.description.trim().substring(0, 200)
                info += `\n  📝 Mô tả: ${desc}${p.description.length > 200 ? '...' : ''}`
              }
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

      try {
        const parsed = JSON.parse(txt)

        // Rate limit (429) — trả thông báo thân thiện cho người dùng
        if (res.status === 429 || parsed?.error?.code === 'rate_limit_exceeded') {
          const retryMatch = parsed?.error?.message?.match(/try again in (.+?)\./i)
          const retryInfo = retryMatch ? retryMatch[1] : 'một lúc nữa'
          return NextResponse.json({
            reply: `⏳ Hệ thống AI đang tạm nghỉ do quá tải. Vui lòng thử lại sau **${retryInfo}**.\n\n_Mẹo: Bạn vẫn có thể duyệt sản phẩm bình thường trong thời gian chờ._`
          })
        }

        // Model decommissioned
        if (parsed?.error?.code === 'model_decommissioned') {
          return NextResponse.json({
            reply: '⚠️ Model AI hiện tại đã ngừng hỗ trợ. Vui lòng liên hệ quản trị viên để cập nhật.'
          })
        }
      } catch (e) {
        // ignore JSON parse errors
      }

      return NextResponse.json({ reply: '❌ Lỗi kết nối AI, vui lòng thử lại sau.' }, { status: 502 })
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