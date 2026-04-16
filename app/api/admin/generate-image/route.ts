import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trong môi trường (.env.local)" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      Create a professional artistic advertising background for a Vietnamese OCOP (One Commune, One Product) product.
      
      Product Name: ${data.productName}
      Origin: ${data.location}
      Key Features: ${data.highlights}
      User Requirements: ${data.requirements || 'Professional, minimalist, bright colors'}
      
      Design Style Requirements:
      - High-end commercial photography style, studio lighting.
      - The product should be the central focus, looking realistic and appealing.
      - Incorporate subtle traditional Vietnamese cultural elements or motifs related to ${data.location} if applicable (e.g., Kinh Bac patterns, traditional silk, bamboo, or local landscapes).
      - Composition should be balanced, clean, and professional.
      - Lighting should be natural and enhance the product's texture and details.
      - Overall mood: Trustworthy, premium, authentic, and culturally rich.
      - No distorted shapes, maintain realistic product features.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let imageUrl = null;

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
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
