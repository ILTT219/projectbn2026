import { NextResponse } from 'next/server';
import { getContentPromptContext } from '@/lib/prompt-loader';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY in .env.local" }, { status: 500 });
    }

    // Inject anti-hallucination prompt từ prompt-tu-lieu
    const promptContext = getContentPromptContext();

    const prompt = `
${promptContext}

Hãy viết nội dung quảng bá cho sản phẩm OCOP sau đây:
      
- Tên sản phẩm: ${data.productName}
- Chủ thể OCOP: ${data.subject}
- Địa phương: ${data.location}
- Nhóm sản phẩm: ${data.productGroup}
- Điểm nổi bật: ${data.highlights}
- Hạng chứng nhận OCOP: ${data.certification || 'Chưa cung cấp'}
- Câu chuyện địa phương: ${data.localStory || 'Chưa cung cấp'}
      
Yêu cầu:
1. Mô tả chi tiết (300-600 từ): 
   - Giới thiệu về nguồn gốc, truyền thống của địa phương ${data.location} gắn liền với sản phẩm.
   - Phân tích sâu các điểm nổi bật: ${data.highlights}.
   - Đề cập văn phong chuyên nghiệp, truyền cảm hứng.
      
2. Nội dung chuẩn SEO:
   - Tiêu đề SEO (dưới 60 ký tự).
   - Meta Description (dưới 160 ký tự).
   - Danh sách 5-7 từ khóa chính.
      
Chỉ xuất ra đúng 1 object JSON hợp lệ với 2 khóa:
{
  "description": "Nội dung phần 1",
  "seoContent": "Nội dung phần 2"
}
Tuyệt đối KHÔNG trả về markdown, không có text dư thừa ngoài định dạng JSON!
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error: ${errText}`);
    }

    const groqData = await res.json();
    const resultText = groqData.choices[0].message.content;
    const parsed = JSON.parse(resultText);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Content Generation Error", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo nội dung." }, { status: 500 });
  }
}
