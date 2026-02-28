import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) return NextResponse.json({ reply: '' })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: 'Error: GROQ_API_KEY not configured' }, { status: 500 })
    }

    const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
    console.log('Using GROQ_MODEL=', GROQ_MODEL)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('Groq error', res.status, txt)
      // If the model was decommissioned, provide a helpful message to the developer
      try {
        const parsed = JSON.parse(txt)
        if (parsed?.error?.code === 'model_decommissioned') {
          return NextResponse.json({
            reply: `Model decommissioned: ${parsed.error.message}. Set a supported model via GROQ_MODEL in your .env.local. See https://console.groq.com/docs/deprecations for recommendations.`,
            status: res.status,
            body: parsed,
            model: GROQ_MODEL,
            apiKeyPresent: !!apiKey
          }, { status: 502 })
        }
      } catch (e) {
        // ignore JSON parse errors
      }

      // return the provider body to client for easier debugging
      return NextResponse.json({ reply: 'Groq API error', status: res.status, body: txt, model: GROQ_MODEL, apiKeyPresent: !!apiKey }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? 'No response'

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('Chat error:', err.message)
    return NextResponse.json(
      { reply: 'Error: ' + err.message },
      { status: 500 }
    )
  }
}