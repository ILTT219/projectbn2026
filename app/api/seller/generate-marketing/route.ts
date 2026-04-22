import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getContentPromptContext } from '@/lib/prompt-loader'

function checkSellerAuth(req: NextRequest): any | null {
  const token = req.cookies.get('admin_token')?.value
  const secret = process.env.ADMIN_JWT_SECRET
  if (!token || !secret) return null
  try {
    const decoded: any = jwt.verify(token, secret)
    if (decoded.role === 'seller' || decoded.role === 'admin') return decoded
    return null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const user = checkSellerAuth(req)
  if (!user) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { productName, description, highlights, category, contentType } = data

    if (!productName?.trim()) {
      return NextResponse.json({ error: 'Tên sản phẩm bắt buộc' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY chưa cấu hình' }, { status: 500 })
    }

    const promptContext = getContentPromptContext()

    let systemPrompt = ''
    let userPrompt = ''

    const productInfo = `
Tên sản phẩm: ${productName}
Mô tả: ${description || 'Chưa có'}
Điểm nổi bật: ${highlights || 'Chưa có'}
Nhóm sản phẩm: ${category || 'Chưa có'}
`

    if (contentType === 'seo') {
      systemPrompt = `${promptContext}

Bạn là chuyên gia SEO và content marketing cho sản phẩm OCOP Bắc Ninh.
Tạo nội dung chuẩn SEO chuyên nghiệp, hấp dẫn, tối ưu cho công cụ tìm kiếm.
CHỈ dựa trên thông tin được cung cấp, KHÔNG bịa thêm.

Trả về JSON:
{
  "title": "Tiêu đề SEO (dưới 60 ký tự)",
  "metaDescription": "Meta description (dưới 160 ký tự)",
  "keywords": ["từ khóa 1", "từ khóa 2", ...],
  "content": "Nội dung mô tả chi tiết 300-600 từ, chia đoạn rõ ràng"
}`
      userPrompt = `Tạo nội dung SEO cho sản phẩm OCOP:\n${productInfo}`

    } else if (contentType === 'social') {
      systemPrompt = `${promptContext}

Bạn là chuyên gia viết nội dung mạng xã hội (Facebook, Zalo) cho sản phẩm OCOP.
Viết caption hấp dẫn, gần gũi, có cảm xúc, phù hợp người Việt.
CHỈ dựa trên thông tin được cung cấp, KHÔNG bịa thêm.

Trả về JSON:
{
  "caption": "Caption chính (150-300 từ, có emoji, gợi cảm xúc)",
  "hashtags": "#hashtag1 #hashtag2 ...",
  "cta": "Lời kêu gọi hành động ngắn gọn",
  "tip": "Gợi ý thời điểm đăng bài tốt nhất"
}`
      userPrompt = `Viết bài Facebook/Zalo cho sản phẩm OCOP:\n${productInfo}`

    } else if (contentType === 'tiktok') {
      systemPrompt = `${promptContext}

Bạn là chuyên gia sáng tạo kịch bản video ngắn TikTok/Reels cho sản phẩm OCOP.
Kịch bản phải gây tò mò, thu hút trong 3 giây đầu, phù hợp Gen Z và millennials.
CHỈ dựa trên thông tin được cung cấp, KHÔNG bịa thêm.

Trả về JSON:
{
  "hook": "3 giây đầu - câu hook gây tò mò (PHẢI thu hút ngay lập tức)",
  "scenes": [
    {"time": "0-3s", "visual": "Mô tả hình ảnh", "script": "Lời nói/text trên màn hình"},
    {"time": "3-8s", "visual": "...", "script": "..."},
    {"time": "8-15s", "visual": "...", "script": "..."},
    {"time": "15-25s", "visual": "...", "script": "..."},
    {"time": "25-30s", "visual": "...", "script": "..."}
  ],
  "music": "Gợi ý nhạc nền phù hợp",
  "cta": "Lời kêu gọi hành động cuối video",
  "trending_sounds": "Gợi ý xu hướng âm thanh TikTok phù hợp"
}`
      userPrompt = `Viết kịch bản TikTok cho sản phẩm OCOP:\n${productInfo}`
    } else {
      return NextResponse.json({ error: 'contentType phải là seo, social, hoặc tiktok' }, { status: 400 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Groq marketing error:', errText)
      return NextResponse.json({ error: 'Lỗi AI, thử lại sau' }, { status: 502 })
    }

    const groqData = await res.json()
    const resultText = groqData.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(resultText)

    return NextResponse.json({ result: parsed, contentType })
  } catch (err: any) {
    console.error('Generate marketing error:', err)
    return NextResponse.json({ error: err.message || 'Lỗi hệ thống' }, { status: 500 })
  }
}
