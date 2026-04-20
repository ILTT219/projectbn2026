import { NextResponse } from 'next/server';

/**
 * Dịch prompt tiếng Việt sang tiếng Anh bằng Groq LLaMA
 */
async function translateToEnglish(vietnameseText: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !vietnameseText.trim()) return vietnameseText;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a translator. Translate the following Vietnamese text to English. Only output the English translation, nothing else. Keep it concise and descriptive for image generation purposes." 
          },
          { role: "user", content: vietnameseText }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices[0]?.message?.content?.trim() || vietnameseText;
    }
  } catch (err) {
    console.log('Translation failed, using original text');
  }
  return vietnameseText;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Dịch các trường tiếng Việt sang tiếng Anh cho image model
    const [productNameEn, highlightsEn, requirementsEn, locationEn] = await Promise.all([
      translateToEnglish(data.productName || ''),
      translateToEnglish(data.highlights || 'Sản phẩm chất lượng cao'),
      translateToEnglish(data.requirements || 'Chuyên nghiệp, tối giản, màu sáng'),
      translateToEnglish(data.location || 'Bắc Ninh, Vietnam'),
    ]);
    
    const promptText = 
      `Professional product photography, studio lighting, white clean background. ` +
      `Vietnamese OCOP product: ${productNameEn}. ` +
      `Origin: ${locationEn}. ` +
      `Features: ${highlightsEn}. ` +
      `Style: ${requirementsEn}. ` +
      `High-end commercial photo, realistic, appealing, no text overlay, no watermark.`;

    // Pollinations.ai — free image generation
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

    try {
      const res = await fetch(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OCOPBot/1.0)' },
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return NextResponse.json({ image: `data:${contentType};base64,${base64}` });
      }
    } catch (pollErr: any) {
      console.log('Pollinations error:', pollErr.message);
    }

    // Fallback: try Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: promptText }] },
          config: { imageConfig: { aspectRatio: '1:1' } },
        });

        if (response.candidates && response.candidates.length > 0) {
          const parts = response.candidates[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              return NextResponse.json({ 
                image: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` 
              });
            }
          }
        }
      } catch (geminiErr: any) {
        console.log('Gemini fallback failed:', geminiErr.message);
      }
    }

    return NextResponse.json({ error: "Không thể tạo hình ảnh. Vui lòng thử lại." }, { status: 500 });

  } catch (err: any) {
    console.error("Image Generation Error", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo hình ảnh" }, { status: 500 });
  }
}
