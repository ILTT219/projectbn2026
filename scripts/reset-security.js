// Gỡ block IP trực tiếp qua Supabase
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://kbbdbolhazdkmylyogol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYmRib2xoYXpka215bHlvZ29sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk2MDcwMywiZXhwIjoyMDg3NTM2NzAzfQ.19lngJZx6RJPbcEYCqPwjljkPHRv1fg6uEOQwVKaRMY'
)

async function main() {
  // Xóa tất cả IP bị block
  const { data, error } = await supabase.from('blocked_ips').delete().neq('id', 0)
  console.log('Xóa blocked_ips:', error ? error.message : 'OK')

  // Xóa login attempts cũ để test sạch
  const { error: e2 } = await supabase.from('login_attempts').delete().neq('id', 0)
  console.log('Xóa login_attempts:', e2 ? e2.message : 'OK')

  // Xóa OTP cũ
  const { error: e3 } = await supabase.from('otp_codes').delete().neq('id', 0)
  console.log('Xóa otp_codes:', e3 ? e3.message : 'OK')

  // Reset 2FA cho admin user
  const { error: e4 } = await supabase.from('users').update({ two_factor_enabled: false, phone: null }).eq('email', 't219t3@gmail.com')
  console.log('Reset 2FA admin:', e4 ? e4.message : 'OK')

  console.log('\n✅ Database đã được reset sạch!')
}

main()
