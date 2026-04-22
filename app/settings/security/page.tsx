"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SecuritySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // OTP verification for enabling 2FA
  const [showVerify, setShowVerify] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [demoOtp, setDemoOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Login history
  const [loginHistory, setLoginHistory] = useState<any[]>([])

  useEffect(() => {
    fetchUserInfo()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user || data)
      setPhone(data.user?.phone || data.phone || '')
      setTwoFactorEnabled(data.user?.two_factor_enabled || data.two_factor_enabled || false)
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Handle enable/disable 2FA
  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      // Bật 2FA - validate phone first
      if (!phone) {
        setMessage({ type: 'error', text: 'Vui lòng nhập số điện thoại trước khi bật 2FA' })
        return
      }
      const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)([0-9]{8})$/
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setMessage({ type: 'error', text: 'Số điện thoại không hợp lệ (VN)' })
        return
      }

      // Save phone first, then send OTP for verification
      setSaving(true)
      try {
        const setupRes = await fetch('/api/auth/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, enabled: true }),
          credentials: 'include',
        })

        if (!setupRes.ok) {
          const err = await setupRes.json()
          setMessage({ type: 'error', text: err.error || 'Lỗi cài đặt 2FA' })
          return
        }

        // Send OTP to verify phone
        const otpRes = await fetch('/api/auth/2fa/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user?.id || user?.user_id }),
        })
        const otpData = await otpRes.json()

        if (otpRes.ok) {
          setShowVerify(true)
          setDemoOtp(otpData.demo_otp || '')
          setCountdown(60)
          setOtpValues(['', '', '', '', '', ''])
          setTimeout(() => otpRefs.current[0]?.focus(), 100)
          setTwoFactorEnabled(true)
          setMessage({ type: 'success', text: 'Đã bật 2FA! Xác minh số điện thoại để hoàn tất.' })
        }
      } catch {
        setMessage({ type: 'error', text: 'Lỗi kết nối' })
      } finally {
        setSaving(false)
      }
    } else {
      // Tắt 2FA
      setSaving(true)
      try {
        const res = await fetch('/api/auth/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone || null, enabled: false }),
          credentials: 'include',
        })
        const data = await res.json()
        if (res.ok) {
          setTwoFactorEnabled(false)
          setShowVerify(false)
          setMessage({ type: 'success', text: 'Đã tắt xác minh 2 bước' })
        } else {
          setMessage({ type: 'error', text: data.error })
        }
      } catch {
        setMessage({ type: 'error', text: 'Lỗi kết nối' })
      } finally {
        setSaving(false)
      }
    }
  }

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.replace(/\D/g, '').split('').slice(0, 6)
      const newValues = [...otpValues]
      chars.forEach((char, i) => {
        if (index + i < 6) newValues[index + i] = char
      })
      setOtpValues(newValues)
      const nextIndex = Math.min(index + chars.length, 5)
      otpRefs.current[nextIndex]?.focus()
      return
    }
    if (!/^\d*$/.test(value)) return
    const newValues = [...otpValues]
    newValues[index] = value
    setOtpValues(newValues)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyPhone = async () => {
    const code = otpValues.join('')
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đủ 6 số' })
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || user?.user_id, otp_code: code }),
        credentials: 'include',
      })
      if (res.ok) {
        setShowVerify(false)
        setMessage({ type: 'success', text: 'Xác minh số điện thoại thành công! 2FA đã được kích hoạt.' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Mã không đúng' })
        setOtpValues(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    try {
      const res = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id || user?.user_id }),
      })
      const data = await res.json()
      if (res.ok) {
        setCountdown(60)
        setDemoOtp(data.demo_otp || '')
        setOtpValues(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi gửi lại mã' })
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-slate-500">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 font-sans text-sm font-medium text-slate-500 hover:text-brand-green transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-slate-900 flex items-center gap-3">
            <span className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-2xl">🔒</span>
            Cài đặt Bảo mật
          </h1>
          <p className="text-sm text-slate-500 font-sans mt-2">Quản lý xác minh 2 bước và bảo mật tài khoản</p>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* 2FA Section */}
        <div className="ocop-card p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-green/20 to-brand-green/5 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900">Xác minh 2 bước (2FA)</h2>
                <p className="text-sm text-slate-500 mt-1">Bảo vệ tài khoản bằng mã OTP gửi qua SMS mỗi khi đăng nhập</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {twoFactorEnabled ? 'Đang bật' : 'Đang tắt'}
            </div>
          </div>

          {/* Phone number input */}
          <div className="flex flex-col gap-1.5 mb-5">
            <label className="font-heading text-sm font-semibold text-slate-700">Số điện thoại nhận mã OTP</label>
            <div className="flex gap-3">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3">
                <span className="text-sm text-slate-600 font-mono">🇻🇳 +84</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="ocop-input flex-1"
                disabled={twoFactorEnabled && !showVerify}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Hỗ trợ số điện thoại Việt Nam (Viettel, Mobifone, Vinaphone...)</p>
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleToggle2FA}
            disabled={saving}
            className={`w-full py-3 rounded-xl text-sm font-heading font-semibold transition-all flex items-center justify-center gap-2 ${
              twoFactorEnabled
                ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100'
                : 'bg-brand-green text-white hover:bg-brand-green-dark shadow-sm'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang xử lý...
              </>
            ) : twoFactorEnabled ? (
              <>🔓 Tắt xác minh 2 bước</>
            ) : (
              <>🔐 Bật xác minh 2 bước</>
            )}
          </button>

          {/* OTP Verification for enabling */}
          {showVerify && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-heading text-base font-bold text-slate-900 mb-2 text-center">
                Xác minh số điện thoại
              </h3>
              <p className="text-sm text-slate-500 text-center mb-4">
                Nhập mã 6 số để xác nhận số điện thoại của bạn
              </p>

              {/* Demo OTP */}
              {demoOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-amber-600 font-medium mb-1">🔧 Demo - Mã OTP:</p>
                  <p className="font-heading text-2xl font-bold text-amber-800 tracking-[0.4em]">{demoOtp}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-2.5 mb-4">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 text-center text-xl font-heading font-bold border-2 border-slate-200 rounded-xl
                      focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:outline-none
                      transition-all duration-200 bg-white shadow-sm hover:border-slate-300"
                    style={{ caretColor: 'transparent' }}
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyPhone}
                disabled={verifying || otpValues.join('').length !== 6}
                className="ocop-btn w-full py-3 disabled:opacity-50"
              >
                {verifying ? 'Đang xác minh...' : 'Xác minh'}
              </button>

              <div className="text-center mt-3">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-400">Gửi lại sau <span className="font-semibold text-brand-green">{countdown}s</span></p>
                ) : (
                  <button onClick={handleResendOtp} className="text-sm text-brand-green hover:text-brand-green-dark font-semibold">
                    Gửi lại mã
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="ocop-card p-6 md:p-8">
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            💡 Mẹo bảo mật
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-blue-50/50 rounded-xl p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 text-sm">🔐</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Sử dụng mật khẩu mạnh</p>
                <p className="text-xs text-slate-500 mt-0.5">Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-green-50/50 rounded-xl p-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 text-sm">📱</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Bật xác minh 2 bước</p>
                <p className="text-xs text-slate-500 mt-0.5">Thêm lớp bảo vệ bằng mã OTP qua SMS</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-amber-50/50 rounded-xl p-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 text-sm">🔒</div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Đăng xuất khi rời máy</p>
                <p className="text-xs text-slate-500 mt-0.5">Luôn đăng xuất khi sử dụng máy công cộng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
