import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const productName = formData.get('productName')?.toString() || "";
    const location = formData.get('location')?.toString() || "";
    const requirements = formData.get('requirements')?.toString() || "";
    const features = formData.get('features')?.toString() || "";
    const aspectRatio = formData.get('aspectRatio')?.toString() || "1:1";
    
    const logoFile = formData.get('logoFile') as File | null;
    const productFile0 = formData.get('productFile0') as File | null;
    const productFile1 = formData.get('productFile1') as File | null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Thiếu GEMINI_API_KEY ở máy chủ" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Base prompt
    const prompt = `
        Create a professional artistic advertising background for a Vietnamese OCOP (One Commune, One Product) product.
        
        Product Name: ${productName}
        Origin: ${location}
        Key Features: ${features}
        User Requirements: ${requirements}
        
        Design Style Requirements:
        - High-end commercial photography style, studio lighting.
        - The product should be the central focus, looking realistic and appealing.
        - IMPORTANT: If a logo is provided in the input, place it accurately at the TOP CENTER.
        - DO NOT include any other arbitrary text or typography in the background.
        - Feature traditional Vietnamese elements related to ${location} if applicable.
        - Maintain overall mood: Trustworthy, premium, authentic.
        - Aspect ratio constraint applies. No distorted shapes.
      `;

    const parts: any[] = [{ text: prompt }];

    // Helper file to part
    async function addFileToParts(file: File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      parts.unshift({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type || 'image/png'
        }
      });
    }

    if (logoFile) {
      await addFileToParts(logoFile);
    }
    if (productFile0) {
      await addFileToParts(productFile0);
    }
    if (productFile1) {
      await addFileToParts(productFile1);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio === '16:9' ? '16:9' : '1:1',
        },
      },
    });

    let imageUrl = null;
    let textResponse = "";

    if (response.candidates && response.candidates.length > 0) {
      const partsResult = response.candidates[0].content?.parts || [];
      for (const part of partsResult) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    }

    if (imageUrl) {
      return NextResponse.json({ image: imageUrl });
    } else {
      if (textResponse) {
        throw new Error(`AI model error message: ${textResponse}`);
      } else {
        throw new Error("Không thể trích xuất hình ảnh từ phản hồi của AI.");
      }
    }

  } catch (err: any) {
    console.error("Image Generation Error", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo hình ảnh" }, { status: 500 });
  }
}
