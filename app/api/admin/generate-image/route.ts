import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const prompt = `Professional commercial product photography of a Vietnamese OCOP product named "${data.productName}" originated from "${data.location}". Style: High-end advertising photography, studio lighting. Extra requirements: ${data.requirements || 'clean, professional, aesthetic'}. Ensure the product is the central focus, highly detailed, realistic, culturally rich background.`;

    const width = data.aspectRatio === '16:9' ? 1280 : 1024;
    const height = data.aspectRatio === '16:9' ? 720 : 1024;
    const seed = Math.floor(Math.random() * 100000000);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

    return NextResponse.json({ image: imageUrl });
  } catch (err: any) {
    console.error("Image Generation Error", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo hình ảnh" }, { status: 500 });
  }
}
