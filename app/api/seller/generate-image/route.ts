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
      ? `ROLE: You are a professional product photographer. Your ONLY task is to place the EXACT product from the reference image onto a new background with improved lighting.

ABSOLUTE RULES — VIOLATION = FAILURE:
1. The product/object MUST be pixel-perfect identical to the reference. DO NOT alter, redraw, or reimagine it.
2. DO NOT change: shape, proportions, colors, textures, text, labels, logos, packaging design, material appearance.
3. DO NOT add: decorations, patterns, elements, text, watermarks, or anything not in the original.
4. DO NOT remove any part of the original product.

WHAT YOU MAY CHANGE (AND ONLY THIS):
- Background: Replace with ${requirementsEn || 'clean, minimal studio background'}.
- Lighting: Professional studio lighting, soft shadows, cinematic quality.
- Camera angle: Keep same angle as reference.

Product: ${productNameEn}. Origin: ${locationEn}.
Output: 8k photorealistic DSLR quality. The product must look EXACTLY like a photograph of the real item.`
      : `ROLE: Expert commercial product photographer for Vietnamese OCOP artisan products.

CREATE: A photorealistic product photo of "${productNameEn}" — a Vietnamese OCOP product from ${locationEn}.

RULES:
1. NO fictional text, NO watermarks, NO logos, NO added typography.
2. Product must look realistic and authentic — NOT over-stylized or cartoonish.
3. Clean, professional composition with the product as the centerpiece.

STYLE: ${requirementsEn || 'Minimal white studio background, soft natural lighting'}.
FEATURES: ${highlightsEn}.

Output: 8k DSLR photorealistic, cinematic studio lighting, masterpiece quality.`;

    // If reference image provided, try Gemini first (supports image input)
    if (referenceImagesBase64.length > 0 && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // Step 1: Extract visual description to reduce hallucination
        let visualDescription = '';
        try {
           const descParts: any[] = [{ text: "Analyze this product image. Describe its physical appearance in extreme detail: exact shape, dominant colors, materials, packaging style, and any text visible. Output ONLY the English description, making it concise and optimized as an image generation prompt." }];
           for (const base64 of referenceImagesBase64) {
             descParts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
           }
           const descResponse = await ai.models.generateContent({
             model: 'gemini-1.5-flash',
             contents: { role: 'user', parts: descParts }
           });
           if (descResponse.candidates && descResponse.candidates.length > 0) {
             const textPart = descResponse.candidates[0]?.content?.parts?.find(p => p.text);
             if (textPart) visualDescription = textPart.text || '';
           }
        } catch (e) {
           console.log('Failed to extract visual description', e);
        }

        const enhancedPrompt = basePrompt + (visualDescription ? `\n\nEXACT VISUAL DETAILS TO MATCH:\n${visualDescription}` : '');

        // Step 2: Generate Image
        const parts: any[] = [{ text: enhancedPrompt }];
        for (const base64 of referenceImagesBase64) {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64 } });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: { parts },
          config: { responseModalities: ['IMAGE'] },
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
            height: aspectRatio === '16:9' ? 720 : 1024,
            prompt: basePrompt,
            width: aspectRatio === '16:9' ? 1280 : 1024,
            num_images: 1,
            modelId: '1e60896f-3c26-4296-8ecc-53e2afecc132', // Leonardo Diffusion XL
          })
        };
        const leoRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', leoOptions);
        if (leoRes.ok) {
          const leoData = await leoRes.json();
          const generationId = leoData.sdGenerationJob.generationId;
          
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

    // 2. Pollinations.ai — free image generation (shorter prompt for URL compatibility)
    const shortPrompt = `Professional product photography of ${productNameEn}, ${requirementsEn}, Vietnamese OCOP product, studio lighting, 8k, clean background, photorealistic`;
    const dimensions = aspectRatio === '16:9' ? 'width=1280&height=720' : 'width=1024&height=1024';
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?${dimensions}&seed=${Date.now()}&nologo=true&model=flux-realism`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OCOPBot/1.0)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength > 1000) {
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const ct = res.headers.get('content-type') || 'image/jpeg';
          return NextResponse.json({ image: `data:${ct};base64,${base64}` });
        }
        console.log('Pollinations returned too small response:', arrayBuffer.byteLength);
      } else {
        console.log('Pollinations HTTP error:', res.status, res.statusText);
      }
    } catch (pollErr: any) {
      console.log('Pollinations error:', pollErr.message);
    }

    // 2b. Pollinations fallback with flux model
    try {
      const simplePrompt = `${productNameEn} product photo, clean white background, professional lighting`;
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=1024&height=1024&seed=${Date.now()}&nologo=true&model=flux`;
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 60000);
      const res2 = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OCOPBot/1.0)' },
        signal: controller2.signal,
      });
      clearTimeout(timeout2);

      if (res2.ok) {
        const arrayBuffer = await res2.arrayBuffer();
        if (arrayBuffer.byteLength > 1000) {
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const ct = res2.headers.get('content-type') || 'image/jpeg';
          return NextResponse.json({ image: `data:${ct};base64,${base64}` });
        }
      }
    } catch (poll2Err: any) {
      console.log('Pollinations fallback error:', poll2Err.message);
    }

    // Fallback: try Gemini without reference image
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: { parts: [{ text: basePrompt }] },
          config: { responseModalities: ['IMAGE'] },
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
