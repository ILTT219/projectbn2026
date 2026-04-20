import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const prompt = `
    Bạn là một chuyên gia copywriter và am hiểu sâu sắc về văn hóa Kinh Bắc (Bắc Ninh).
    Hãy viết nội dung quảng bá cho sản phẩm OCOP sau đây:
    
    - Tên sản phẩm: ${data.productName}
    - Chủ thể OCOP: ${data.subject}
    - Địa phương: ${data.location}
    - Nhóm sản phẩm: ${data.productGroup}
    - Điểm nổi bật: ${data.highlights}
    
    Yêu cầu:
    1. Mô tả chi tiết (300-600 từ): 
       - Giới thiệu về nguồn gốc, truyền thống của địa phương ${data.location} gắn liền với sản phẩm.
       - Lồng ghép khéo léo các yếu tố văn hóa Bắc Ninh (như dân ca Quan họ, làng nghề truyền thống, tinh thần hiếu học, sự tỉ mỉ của người thợ...) nếu phù hợp.
       - Phân tích sâu các điểm nổi bật: ${data.highlights}.
       - Văn phong chuyên nghiệp, truyền cảm hứng, đậm chất văn hóa.
    
    Lưu ý quan trọng: 
    - Sử dụng tiếng Việt chuẩn, không sai chính tả.
    - Tuyệt đối không sử dụng các thẻ HTML (như <p>, </p>, <br>, <div>...).
    - Định dạng nội dung là văn bản thuần túy (Plain Text).
    - Chia nội dung thành các đoạn văn rõ ràng, mỗi đoạn cách nhau bằng 2 lần xuống dòng.
    - Xuất dữ liệu ở định dạng JSON với duy nhất 1 trường là "description" chứa đoạn văn bản.
    `;

    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = response.choices[0]?.message?.content || '{}';
    return NextResponse.json(JSON.parse(result));
  } catch (err: any) {
    console.error("AI Generation Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
