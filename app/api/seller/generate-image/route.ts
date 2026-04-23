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

    const basePrompt = `Bạn là hệ thống xử lý và tổng hợp ảnh sản phẩm chuyên nghiệp cho sản phẩm OCOP Bắc Ninh.
Nhiệm vụ:
Kết hợp HAI ảnh sản phẩm đầu vào thành MỘT ảnh hoàn chỉnh, tự nhiên và chuyên nghiệp.
GIAI ĐOẠN 1 — PHÂN TÍCH
• Xác định sản phẩm chính trong mỗi ảnh
• Xác định góc nhìn, ánh sáng, tỉ lệ của từng sản phẩm
• Đảm bảo mỗi ảnh có sản phẩm rõ ràng
• ảnh chụp gần sản phẩm
Nếu không xác định được sản phẩm trong bất kỳ ảnh nào:
→ Trả về:
{
"status": "rejected",
"reason": "Không xác định được sản phẩm rõ ràng"
}
GIAI ĐOẠN 2 — TÁCH NỀN (BẮT BUỘC)
• Tách nền của cả hai ảnh
• Giữ lại sản phẩm với độ chính xác cao
• Không làm mất chi tiết viền, không làm mờ sản phẩm
GIAI ĐOẠN 3 — GHÉP SẢN PHẨM
• Đặt hai sản phẩm vào cùng một bố cục hợp lý:
o Có thể cạnh nhau, tương tác hoặc bổ trợ nhau
o Cân đối về kích thước và tỉ lệ
o Không chồng lấn bất hợp lý
o Tuyệt đối không thay đổi chi tiết sản phẩm
• Điều chỉnh:
o Góc nhìn (perspective) để thống nhất
o Ánh sáng và hướng bóng đổ
o Tỉ lệ kích thước thực tế
GIAI ĐOẠN 4 — THAY NỀN (THEO NGỮ CẢNH)
• Tạo nền mới phù hợp với:
o Loại sản phẩm (${productName})
o Ngữ cảnh sử dụng (${requirements})
o Văn hóa địa phương (ví dụ: Việt Nam, phong cách đời sống, màu sắc quen thuộc)
Ví dụ:
• Đồ ăn → bối cảnh bàn ăn Việt
• Mỹ phẩm → nền sạch, sang trọng, tối giản
• Đồ gia dụng → không gian nhà ở thực tế

GIAI ĐOẠN 5 — RÀNG BUỘC NGHIÊM NGẶT
TUYỆT ĐỐI KHÔNG ĐƯỢC:
• Không được thay đổi hình dạng, chi tiết sản phẩm ở cả 2 ảnh
• Không được thêm hoặc xóa chi tiết sản phẩm
• Không được làm biến dạng hoặc stylize sản phẩm
• Không được hay đổi màu sắc thật của sản phẩm
QUY TẮC QUAN TRỌNG:
• Giữ nguyên 100% chi tiết sản phẩm từ ảnh gốc
• Chỉ được xử lý nền, ánh sáng, và bố cục
GIAI ĐOẠN 6 — HOÀN THIỆN
• Làm ảnh trông tự nhiên, không lộ dấu ghép
• Ánh sáng đồng nhất
• Bóng đổ hợp lý
• Màu sắc hài hòa tổng thể
OUTPUT
{
"status": "success",
"actions": [
"background_removed",
"products_combined",
"new_background_applied",
"lighting_adjusted"
],
"note": "Giữ nguyên chi tiết sản phẩm"
}
QUY TẮC CUỐI
Ưu tiên tạo ảnh tự nhiên, chân thực như ảnh chụp thật.
Nếu việc ghép làm ảnh hưởng đến tính toàn vẹn sản phẩm: Trả về ảnh gốc với nền mới.`;

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
    const shortPrompt = `A beautiful, clean, EMPTY background for a product. ${requirementsEn || 'minimalism'}, professional studio lighting, soft shadows. STRICT RULE: NO PRODUCTS, NO OBJECTS, COMPLETELY EMPTY IN THE CENTER. 8k, photorealistic background only`;
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
      const simplePrompt = `Empty product photography background. STRICT RULE: NO PRODUCT, NO OBJECTS. Only background and lighting. ${requirementsEn || 'clean studio'}.`;
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
