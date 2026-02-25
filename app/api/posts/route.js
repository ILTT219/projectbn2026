import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')

  return Response.json({ data, error })
}

export async function POST(request) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('posts')
    .insert([
      { title: body.title }
    ])
    .select()

  return Response.json({ data, error })
}