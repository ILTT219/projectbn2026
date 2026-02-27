import { NextRequest, NextResponse } from 'next/server'

const HF_MODEL = process.env.HF_MODEL || 'google/flan-t5-small'
const HF_API = `https://router.huggingface.co/models/${HF_MODEL}`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) return NextResponse.json({ reply: '' })

    const apiKey = process.env.HF_API_KEY
    if (!apiKey) {
      console.error('HF_API_KEY not set')
      return NextResponse.json({ reply: 'AI not configured (missing API key).' }, { status: 500 })
    }

    const payload = { inputs: message }

    const res = await fetch(HF_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('HF error', res.status, txt, 'url=', HF_API)
      // return body to client for debugging
      return NextResponse.json({ reply: 'AI service error', status: res.status, body: txt, url: HF_API }, { status: 502 })
    }

    const data = await res.json()
    let reply = ''
    if (Array.isArray(data)) {
      reply = data[0]?.generated_text ?? ''
    } else if (typeof data === 'object' && data !== null) {
      reply = (data as any).generated_text ?? (data as any).text ?? ''
    }

    return NextResponse.json({ reply })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}