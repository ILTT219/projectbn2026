// Test toàn bộ chức năng bảo mật: Login, 2FA, IP Blocking
const BASE = 'http://localhost:3000'
let adminCookie = ''

async function api(method, path, body, useCookie = false) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  if (useCookie && adminCookie) opts.headers['Cookie'] = adminCookie

  const res = await fetch(`${BASE}${path}`, opts)
  
  // Capture cookie from login
  const setCookie = res.headers.get('set-cookie')
  if (setCookie && setCookie.includes('admin_token')) {
    adminCookie = setCookie.split(';')[0]
  }

  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function log(label, result) {
  const icon = result.status >= 200 && result.status < 300 ? '✅' : result.status === 401 ? '⚠️' : result.status === 403 ? '🚫' : '❌'
  console.log(`\n${icon} ${label}`)
  console.log(`   Status: ${result.status}`)
  console.log(`   Response:`, JSON.stringify(result.data, null, 2).split('\n').map((l,i) => i===0 ? l : '   ' + l).join('\n'))
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('🔐 TEST TOÀN BỘ HỆ THỐNG BẢO MẬT')
  console.log('═══════════════════════════════════════════')

  // ==========================================
  console.log('\n\n📌 PHẦN 1: ĐĂNG NHẬP CƠ BẢN')
  console.log('─────────────────────────────')

  // Test 1: Login thành công
  let r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login admin thành công', r)

  // Test 2: Login sai password
  r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'wrong' })
  log('Login sai mật khẩu', r)

  // Test 3: Login user không tồn tại
  r = await api('POST', '/api/auth/login', { email: 'fake@fake.com', password: '123' })
  log('Login user không tồn tại', r)

  // ==========================================
  console.log('\n\n📌 PHẦN 2: BẬT 2FA')
  console.log('─────────────────────────────')

  // Test 4: Kiểm tra thông tin user hiện tại
  r = await api('GET', '/api/auth/me', null, true)
  log('Thông tin user hiện tại', r)

  // Test 5: Bật 2FA với số điện thoại
  r = await api('POST', '/api/auth/2fa/setup', { phone: '0912345678', enabled: true }, true)
  log('Bật 2FA + số điện thoại', r)

  // Test 6: Kiểm tra 2FA đã bật
  r = await api('GET', '/api/auth/me', null, true)
  log('Kiểm tra 2FA đã bật', r)

  // ==========================================
  console.log('\n\n📌 PHẦN 3: ĐĂNG NHẬP VỚI 2FA')
  console.log('─────────────────────────────')

  // Test 7: Login lại → phải yêu cầu 2FA
  r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login khi 2FA bật → yêu cầu OTP', r)
  
  const userId = r.data.user_id
  const demoOtp = r.data.demo_otp
  console.log(`   📱 User ID: ${userId}`)
  console.log(`   🔢 Demo OTP: ${demoOtp}`)
  console.log(`   📞 Masked Phone: ${r.data.masked_phone}`)

  // Test 8: Nhập OTP sai
  r = await api('POST', '/api/auth/2fa/verify', { user_id: userId, otp_code: '000000' })
  log('Xác minh OTP SAI', r)

  // Test 9: Nhập OTP đúng
  r = await api('POST', '/api/auth/2fa/verify', { user_id: userId, otp_code: demoOtp })
  log('Xác minh OTP ĐÚNG', r)

  // Test 10: Gửi lại OTP
  r = await api('POST', '/api/auth/2fa/send-otp', { user_id: userId })
  log('Gửi lại mã OTP', r)

  // ==========================================
  console.log('\n\n📌 PHẦN 4: TẮT 2FA')
  console.log('─────────────────────────────')

  // Test 11: Tắt 2FA  
  r = await api('POST', '/api/auth/2fa/setup', { phone: '0912345678', enabled: false }, true)
  log('Tắt 2FA', r)

  // Test 12: Login lại → không yêu cầu 2FA nữa
  r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login sau khi tắt 2FA → đăng nhập thẳng', r)

  // ==========================================
  console.log('\n\n📌 PHẦN 5: KIỂM TRA IP')
  console.log('─────────────────────────────')

  // Test 13: IP check
  r = await api('GET', '/api/auth/security/ip-check')
  log('Kiểm tra IP hiện tại', r)

  // ==========================================
  console.log('\n\n📌 PHẦN 6: ADMIN SECURITY DASHBOARD')
  console.log('─────────────────────────────')

  // Test 14: Admin xem dashboard bảo mật
  r = await api('GET', '/api/admin/security', null, true)
  log('Admin Security Dashboard', r)
  if (r.data.suspicious_ips) {
    console.log(`   📊 IP khả nghi: ${r.data.suspicious_ips.length}`)
    console.log(`   🚫 IP bị chặn: ${r.data.blocked_ips?.length || 0}`)
    console.log(`   📈 Tổng lượt đăng nhập 48h: ${r.data.total_attempts_48h}`)
  }

  // Test 15: Admin block IP thủ công
  r = await api('POST', '/api/admin/security', {
    action: 'block',
    ip_address: '192.168.1.100',
    reason: 'Test chặn IP thủ công',
    duration_hours: 1,
    is_permanent: false,
  }, true)
  log('Admin chặn IP 192.168.1.100', r)

  // Test 16: Admin unblock IP
  r = await api('POST', '/api/admin/security', {
    action: 'unblock',
    ip_address: '192.168.1.100',
  }, true)
  log('Admin gỡ chặn IP 192.168.1.100', r)

  // ==========================================
  console.log('\n\n═══════════════════════════════════════════')
  console.log('🏁 TEST HOÀN TẤT - TẤT CẢ CHỨC NĂNG')
  console.log('═══════════════════════════════════════════\n')
}

main().catch(err => console.error('Fatal:', err))
