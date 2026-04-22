// Test 2FA sau khi gỡ block IP
const BASE = 'http://localhost:3000'
let adminCookie = ''

async function api(method, path, body, useCookie = false) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  if (useCookie && adminCookie) opts.headers['Cookie'] = adminCookie
  const res = await fetch(`${BASE}${path}`, opts)
  const setCookie = res.headers.get('set-cookie')
  if (setCookie && setCookie.includes('admin_token')) adminCookie = setCookie.split(';')[0]
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function log(label, r) {
  const icon = r.status >= 200 && r.status < 300 ? '✅' : r.status === 401 ? '⚠️' : '❌'
  console.log(`\n${icon} ${label} [${r.status}]`)
  console.log('  ', JSON.stringify(r.data))
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('🔐 TEST 2FA HOÀN CHỈNH')
  console.log('═══════════════════════════════════════')

  // Bước 0: Login admin để lấy cookie
  let r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login lấy cookie', r)

  // Bước 0.5: Gỡ block IP localhost
  r = await api('POST', '/api/admin/security', { action: 'unblock', ip_address: '::1' }, true)
  log('Gỡ block IP ::1', r)
  r = await api('POST', '/api/admin/security', { action: 'unblock', ip_address: '127.0.0.1' }, true)
  log('Gỡ block IP 127.0.0.1', r)

  // Bước 1: Bật 2FA
  console.log('\n\n📱 BƯỚC 1: BẬT 2FA')
  console.log('─────────────────')
  r = await api('POST', '/api/auth/2fa/setup', { phone: '0912345678', enabled: true }, true)
  log('Bật 2FA', r)

  // Bước 2: Login lại → phải yêu cầu OTP
  console.log('\n\n🔑 BƯỚC 2: LOGIN VỚI 2FA')
  console.log('─────────────────')
  r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login → yêu cầu 2FA', r)
  
  if (r.data.requires_2fa) {
    console.log('  ✅ HỆ THỐNG YÊU CẦU 2FA!')
    console.log(`  📱 User ID: ${r.data.user_id}`)
    console.log(`  🔢 Demo OTP: ${r.data.demo_otp}`)
    console.log(`  📞 Phone: ${r.data.masked_phone}`)

    const userId = r.data.user_id
    const correctOtp = r.data.demo_otp

    // Bước 3: Nhập OTP sai
    console.log('\n\n❌ BƯỚC 3: NHẬP OTP SAI')
    console.log('─────────────────')
    r = await api('POST', '/api/auth/2fa/verify', { user_id: userId, otp_code: '000000' })
    log('OTP sai "000000"', r)

    // Bước 4: Nhập OTP đúng
    console.log('\n\n✅ BƯỚC 4: NHẬP OTP ĐÚNG')
    console.log('─────────────────')
    r = await api('POST', '/api/auth/2fa/verify', { user_id: userId, otp_code: correctOtp })
    log('OTP đúng → Login thành công', r)

    if (r.data.success) {
      console.log(`  🎉 ĐĂNG NHẬP 2FA THÀNH CÔNG! Role: ${r.data.role}`)
    }

    // Bước 5: Gửi lại OTP mới
    console.log('\n\n📤 BƯỚC 5: GỬI LẠI MÃ OTP')
    console.log('─────────────────')
    r = await api('POST', '/api/auth/2fa/send-otp', { user_id: userId })
    log('Gửi lại OTP', r)
    if (r.data.demo_otp) {
      console.log(`  🔢 OTP mới: ${r.data.demo_otp}`)
      
      // Verify OTP mới
      r = await api('POST', '/api/auth/2fa/verify', { user_id: userId, otp_code: r.data.demo_otp })
      log('Verify OTP mới', r)
    }
  } else {
    console.log('  ❌ Không yêu cầu 2FA! Có thể IP bị block hoặc 2FA chưa bật')
  }

  // Bước 6: Tắt 2FA
  console.log('\n\n🔓 BƯỚC 6: TẮT 2FA')
  console.log('─────────────────')
  r = await api('POST', '/api/auth/2fa/setup', { phone: '0912345678', enabled: false }, true)
  log('Tắt 2FA', r)

  // Bước 7: Login không cần OTP nữa
  r = await api('POST', '/api/auth/login', { email: 't219t3@gmail.com', password: 'gtCo0408t' })
  log('Login sau tắt 2FA → thẳng vào', r)
  if (r.data.success && !r.data.requires_2fa) {
    console.log('  ✅ LOGIN THẲNG KHÔNG CẦN OTP!')
  }

  // Bước 8: Xem dashboard
  console.log('\n\n📊 BƯỚC 7: ADMIN DASHBOARD')
  console.log('─────────────────')
  r = await api('GET', '/api/admin/security', null, true)
  log('Dashboard', r)
  console.log(`  📊 IP khả nghi: ${r.data.suspicious_ips?.length || 0}`)
  console.log(`  🚫 IP bị chặn: ${r.data.blocked_ips?.length || 0}`)
  console.log(`  📈 Lượt đăng nhập 48h: ${r.data.total_attempts_48h || 0}`)

  console.log('\n\n═══════════════════════════════════════')
  console.log('🏁 TEST 2FA HOÀN TẤT')
  console.log('═══════════════════════════════════════\n')
}

main().catch(err => console.error('Fatal:', err))
