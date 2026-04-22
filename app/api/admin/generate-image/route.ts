import { NextResponse } from 'next/server';
import { getImagePromptContext } from '@/lib/prompt-loader';

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
    let data: any = {};
    let imageFile: File | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      data.productName = formData.get('productName') as string;
      data.highlights = formData.get('highlights') as string;
      data.requirements = formData.get('requirements') as string;
      data.location = formData.get('location') as string;
      imageFile = formData.get('referenceImage1') as File;
    } else {
      data = await req.json();
    }

    // Lấy anti-hallucination prompt cho ảnh từ prompt-tu-lieu
    const imagePromptContext = getImagePromptContext();

    // Dịch các trường tiếng Việt sang tiếng Anh cho image model
    const [productNameEn, highlightsEn, requirementsEn, locationEn] = await Promise.all([
      translateToEnglish(data.productName || ''),
      translateToEnglish(data.highlights || 'Sản phẩm chất lượng cao'),
      translateToEnglish(data.requirements || 'Chuyên nghiệp, tối giản, màu sáng'),
      translateToEnglish(data.location || 'Bắc Ninh, Vietnam'),
    ]);

    // Phân tích hình ảnh tư liệu (nếu có) bằng Gemini để giảm hallucination
    let visualDescription = '';
    if (imageFile && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: {
             role: "user",
             parts: [
               { text: "Analyze this product image. Describe its physical appearance in extreme detail: exact shape, dominant colors, materials, packaging style, and any text visible. Output ONLY the English description, making it concise and optimized as an image generation prompt." },
               { inlineData: { data: base64Data, mimeType: imageFile.type } }
             ]
          }
        });
        
        if (response.candidates && response.candidates.length > 0) {
           const textPart = response.candidates[0]?.content?.parts?.find(p => p.text);
           if (textPart) visualDescription = textPart.text || '';
        }
      } catch (err: any) {
        console.error('Failed to analyze image with Gemini:', err.message);
      }
    }
    
    // Tích hợp nguyên tắc từ prompt-tu-lieu vào prompt tạo ảnh
    const promptText = 
      `Product photography, pure product isolation. Center focus on the main object: ${productNameEn}. ` +
      `CRITICAL REQUIREMENT: The core object MUST REMAIN 100% ORIGINAL and UNTOUCHED. Do not change its shape, color, text, logo, or design. ` +
      (visualDescription ? `EXACT PRODUCT APPEARANCE TO MATCH: ${visualDescription}. ` : '') +
      `ONLY change the SURROUNDING BACKGROUND and LIGHTING to: ${requirementsEn}. Features: ${highlightsEn}. ` +
      `Cinematic studio lighting, 8k resolution, photorealistic DSLR, masterpiece. NO fictional text, NO watermarks.`;

    // 1. Nếu có Leonardo AI API Key, ưu tiên dùng Leonardo
    if (process.env.LEONARDO_API_KEY) {
      try {
        const leoOptions = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${process.env.LEONARDO_API_KEY}`
          },
          body: JSON.stringify({
            height: 1024,
            prompt: promptText,
            width: 1024,
            num_images: 1,
            modelId: '1e60896f-3c26-4296-8ecc-53e2afecc132', // Leonardo Diffusion XL
          })
        };
        const leoRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', leoOptions);
        if (leoRes.ok) {
          const leoData = await leoRes.json();
          const generationId = leoData.sdGenerationJob.generationId;
          
          // Polling to wait for image
          let imageUrl = null;
          for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
              headers: {
                accept: 'application/json',
                authorization: `Bearer ${process.env.LEONARDO_API_KEY}`
              }
            });
            const pollData = await pollRes.json();
            if (pollData.generations_by_pk && pollData.generations_by_pk.status === 'COMPLETE') {
              if (pollData.generations_by_pk.generated_images.length > 0) {
                imageUrl = pollData.generations_by_pk.generated_images[0].url;
              }
              break;
            }
          }

          if (imageUrl) {
            // Fetch image and return as base64
            const imgRes = await fetch(imageUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            return NextResponse.json({ image: `data:${contentType};base64,${base64}` });
          }
        }
      } catch (leoErr: any) {
        console.error('Leonardo AI error:', leoErr.message);
      }
    }

    // 2. Pollinations.ai — free image generation (Fallback to flux-realism model)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux-realism`;

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
