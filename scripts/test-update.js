import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main(){
  const { data, error } = await supabase.from('products').update({view_count: 999}).eq('id', 35)
  console.log('update result', { data, error })
}

main()
