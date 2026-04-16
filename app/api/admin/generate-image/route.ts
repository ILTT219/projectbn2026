import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trong môi trường (.env.local)" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const hasRealImages = data.realImagesBase64 && data.realImagesBase64.length > 0;
    const hasLogo = !!data.logoBase64;

    const prompt = `
      Create a professional artistic advertising background for a Vietnamese OCOP (One Commune, One Product) product.
      
      ${hasRealImages ? \`I have provided \${data.realImagesBase64.length} real photo(s) of the product. Please use these photos as the primary reference for the product's appearance, packaging, and label. Ensure the product in the poster looks consistent with the provided images.\` : ''}
      
      Product Name: ${data.productName}
      Origin: ${data.location}
      Key Features: ${data.highlights}
      Logo/Brand: ${hasLogo ? 'I have provided the EXACT brand logo image. You MUST use this specific logo as the only source for the brand identity. Do not generate a new logo.' : 'Professional brand logo'}
      User Requirements: ${data.requirements || 'Professional, minimalist, bright colors'}
      
      Design Style Requirements:
      - High-end commercial photography style, studio lighting.
      - The product should be the central focus, looking realistic and appealing.
      - ${hasLogo ? 'IMPORTANT: Use the EXACT logo provided in the input image. Place this original logo at the TOP CENTER of the generated image. Do not invent, modify, or generate a new logo. The logo should look like it was professionally placed on the final poster.' : ''}
      - DO NOT include any other arbitrary text, typography, or letters on the image. No product names or origin text should be rendered as text labels.
      - Focus entirely on the artistic context, background, and the visual presentation of the product.
      - Incorporate subtle traditional Vietnamese cultural elements or motifs related to ${data.location} if applicable (e.g., Kinh Bac patterns, traditional silk, bamboo, or local landscapes).
      - Composition should be balanced, clean, and professional.
      - Lighting should be natural and enhance the product's texture and details.
      - Overall mood: Trustworthy, premium, authentic, and culturally rich.
      - Aspect ratio: ${data.aspectRatio || '1:1'}.
      - No distorted shapes, maintain realistic product features.
    `;

    const parts: any[] = [{ text: prompt }];

    if (hasLogo) {
      const match = data.logoBase64.match(/data:(.*?);base64,/);
      parts.unshift({
        inlineData: {
          data: data.logoBase64.split(',')[1],
          mimeType: match ? match[1] : 'image/png'
        }
      });
    }

    if (hasRealImages) {
      data.realImagesBase64.forEach((imgData: string) => {
        const match = imgData.match(/data:(.*?);base64,/);
        parts.unshift({
          inlineData: {
            data: imgData.split(',')[1],
            mimeType: match ? match[1] : 'image/png'
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: data.aspectRatio || '1:1',
        },
      },
    });

    let imageUrl = null;

    if (response.candidates && response.candidates.length > 0) {
      const resParts = response.candidates[0]?.content?.parts || [];
      for (const part of resParts) {
        if (part.inlineData) {
          imageUrl = \`data:\${part.inlineData.mimeType || 'image/png'};base64,\${part.inlineData.data}\`;
          break;
        }
      }
    }

    if (imageUrl) {
      return NextResponse.json({ image: imageUrl });
    } else {
      return NextResponse.json({ error: "Không tìm thấy nội dung hình ảnh từ phản hồi của AI." }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Image Generation Error", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo hình ảnh" }, { status: 500 });
  }
}
