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
    const contentType = req.headers.get('content-type') || '';
    
    let productName = '';
    let highlights = '';
    let requirements = '';
    let location = '';
    let aspectRatio = '1:1';
    let referenceImagesBase64: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData with reference image
      const formData = await req.formData();
      productName = formData.get('productName')?.toString() || '';
      highlights = formData.get('highlights')?.toString() || '';
      requirements = formData.get('requirements')?.toString() || '';
      location = formData.get('location')?.toString() || '';
      aspectRatio = formData.get('aspectRatio')?.toString() || '1:1';
      
      const refImage1 = formData.get('referenceImage1') as File | null;
      if (refImage1 && refImage1.size) {
        const arrayBuffer = await refImage1.arrayBuffer();
        referenceImagesBase64.push(Buffer.from(arrayBuffer).toString('base64'));
      }
      
      const refImage2 = formData.get('referenceImage2') as File | null;
      if (refImage2 && refImage2.size) {
        const arrayBuffer = await refImage2.arrayBuffer();
        referenceImagesBase64.push(Buffer.from(arrayBuffer).toString('base64'));
      }
    } else {
      // Handle JSON body
      const data = await req.json();
      productName = data.productName || '';
      highlights = data.highlights || '';
      requirements = data.requirements || '';
      location = data.location || '';
      aspectRatio = data.aspectRatio || '1:1';
    }

    // Dịch các trường tiếng Việt sang tiếng Anh cho image model
    const [productNameEn, highlightsEn, requirementsEn, locationEn] = await Promise.all([
      translateToEnglish(productName),
      translateToEnglish(highlights || 'Sản phẩm chất lượng cao'),
      translateToEnglish(requirements || 'Chuyên nghiệp, tối giản, màu sáng'),
      translateToEnglish(location || 'Bắc Ninh, Vietnam'),
    ]);

    const basePrompt = referenceImagesBase64.length > 0
      ? `CRITICAL INSTRUCTION: You are a high-end commercial product photographer. I am providing reference image(s) of a real product. 
You MUST extract the exact product shown and place it in a new professional setting. 
RULE 1: The product itself (shape, colors, text, branding, materials, details) MUST NOT BE ALTERED, MORPHED, OR REDESIGNED in any way. Keep it EXACTLY identical to the reference.
RULE 2: The final image must be hyper-realistic, photographic, and indistinguishable from a real photograph. No cartoonish, painted, or overly stylized AI look.
RULE 3: Do NOT add any fake text, fictional fonts, or watermarks.

Context details for the environment:
- Product Theme: Vietnamese OCOP product, ${productNameEn}.
- Origin/Vibe: ${locationEn}.
- Key Features: ${highlightsEn}.
- Desired Style/Background: ${requirementsEn}.

Create a stunning, photorealistic studio photography shot.`
      : `CRITICAL INSTRUCTION: You are a high-end commercial product photographer. 
Create a hyper-realistic, photorealistic product photography shot. It must look identical to a real photograph taken with a DSLR camera. No painting, no 3D render look, no cartoonish styles.
RULE 1: Do NOT add any fictional text, weird fonts, or watermarks. 
RULE 2: Create a minimal, clean, professional composition.

Context details:
- Product Theme: Vietnamese OCOP product, ${productNameEn}.
- Origin/Vibe: ${locationEn}.
- Key Features: ${highlightsEn}.
- Desired Style/Background: ${requirementsEn}.

Studio setup, perfect lighting, 8k resolution, highly detailed realism.`;

    // If reference image provided, try Gemini first (supports image input)
    if (referenceImagesBase64.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const parts: any[] = [{ text: basePrompt }];
        for (const base64 of referenceImagesBase64) {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-05-20',
          contents: { parts },
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });

        if (response.candidates && response.candidates.length > 0) {
          const resParts = response.candidates[0]?.content?.parts || [];
          for (const part of resParts) {
            if (part.inlineData) {
              return NextResponse.json({ 
                image: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}` 
              });
            }
          }
        }
      } catch (geminiErr: any) {
        console.log('Gemini with reference images failed:', geminiErr.message);
      }
    }

    // Pollinations.ai — free image generation (no reference image support)
    const dimensions = aspectRatio === '16:9' ? 'width=1280&height=720' : 'width=1024&height=1024';
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?${dimensions}&seed=${Date.now()}&nologo=true`;

    try {
      const res = await fetch(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OCOPBot/1.0)' },
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const ct = res.headers.get('content-type') || 'image/jpeg';
        return NextResponse.json({ image: `data:${ct};base64,${base64}` });
      }
    } catch (pollErr: any) {
      console.log('Pollinations error:', pollErr.message);
    }

    // Fallback: try Gemini without reference image
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-05-20',
          contents: { parts: [{ text: basePrompt }] },
          config: { responseModalities: ['TEXT', 'IMAGE'] },
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
