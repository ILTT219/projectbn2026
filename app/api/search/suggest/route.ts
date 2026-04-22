import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) {
      return NextResponse.json({ data: [] })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Nhận diện từ khóa chung chung (Semantic/Category Matching) bằng LLM Groq
    let targetCategories: number[] = [];
    
    if (process.env.GROQ_API_KEY) {
      try {
        const groqPrompt = `You are a search intent classifier for an OCOP Vietnam platform.
Categories:
1: Lương thực (Rice, grains, seeds)
2: Thực phẩm (Food, snacks, meat, processed food, đồ ăn)
3: Dược liệu (Medicine, herbs, health, sức khỏe)
4: Thủ công mỹ nghệ (Handicrafts, souvenirs, art, quà lưu niệm)
5: Hàng tiêu dùng (Consumer goods, clothes, quần áo, gia dụng)
6: Đồ uống (Beverages, drinks, nước, trà, rượu)

User search query: "${q}"

Which category IDs match this query? Return ONLY a valid JSON array of numbers (e.g. [1, 2]). Do NOT return anything else. If no categories match or it is a specific brand/product name, return [].`;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: groqPrompt }],
            temperature: 0.1,
          })
        });
        
        if (res.ok) {
          const json = await res.json();
          const content = json.choices[0]?.message?.content || '[]';
          try {
            // Lọc ra mảng từ nội dung trả về
            const match = content.match(/\[.*\]/s);
            if (match) {
              targetCategories = JSON.parse(match[0]);
            }
          } catch (err) {
             console.error('Failed to parse Groq category array:', content);
          }
        }
      } catch (err) {
        console.error('Groq search intent error:', err);
      }
    }

    let query = supabase.from('products').select('id, name, origin, category_id').limit(10);
    
    // Nếu phát hiện category (ví dụ: gõ "đồ ăn"), ưu tiên fetch các sản phẩm thuộc category đó
    if (targetCategories.length > 0) {
      query = query.in('category_id', targetCategories);
    } else {
      // Tìm kiếm văn bản thông thường
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Suggest search error:', error);
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Suggest endpoint error:', e)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
