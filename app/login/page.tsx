"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 2FA States
  const [show2FA, setShow2FA] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [userId, setUserId] = useState<number | null>(null)
  const [maskedPhone, setMaskedPhone] = useState('')
  const [demoOtp, setDemoOtp] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<{ blocked: boolean; reason?: string; blocked_until?: string } | null>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setBlockedInfo(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))

      if (data.blocked) {
        setBlockedInfo({
          blocked: true,
          reason: data.error,
          blocked_until: data.blocked_until,
        })
        setError(data.error)
      } else if (res.ok) {
        if (data.requires_2fa) {
          // Chuyển sang bước 2FA
          setShow2FA(true)
          setUserId(data.user_id)
          setMaskedPhone(data.masked_phone)
          setDemoOtp(data.demo_otp || '')
          setCountdown(60)
          setOtpValues(['', '', '', '', '', ''])
          // Focus ô đầu tiên
          setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } else {
          if (data.role === 'admin') {
            window.location.href = '/admin'
          } else if (data.role === 'seller') {
            window.location.href = '/seller'
          } else {
            window.location.href = '/'
          }
        }
      } else {
        setError(data.error || 'Thông tin đăng nhập không chính xác')
      }
    } catch (err: any) {
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
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

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Submit OTP
  const handleVerifyOtp = async () => {
    const code = otpValues.join('')
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 số')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, otp_code: code }),
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        if (data.role === 'admin') {
          window.location.href = '/admin'
        } else if (data.role === 'seller') {
          window.location.href = '/seller'
        } else {
          window.location.href = '/'
        }
      } else {
        setError(data.error || 'Mã xác minh không đúng')
        setOtpValues(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setVerifying(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return

    try {
      const res = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setCountdown(60)
        setDemoOtp(data.demo_otp || '')
        setOtpValues(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        setError('')
      } else {
        setError(data.error || 'Không thể gửi lại mã')
      }
    } catch {
      setError('Lỗi kết nối')
    }
  }

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    const code = otpValues.join('')
    if (code.length === 6 && show2FA && !verifying) {
      handleVerifyOtp()
    }
  }, [otpValues])

  return (
    <div className="bg-slate-50 min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center gap-2 font-sans text-sm font-medium text-slate-500 hover:text-brand-green transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại trang chủ
        </Link>
      </div>
      
      {/* Blocked IP Warning */}
      {blockedInfo?.blocked && (
        <div className="w-full max-w-md mb-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="font-heading text-lg font-bold text-red-800 mb-1">Truy cập bị chặn</h3>
            <p className="text-sm text-red-600">{blockedInfo.reason}</p>
            {blockedInfo.blocked_until && blockedInfo.blocked_until !== 'Vĩnh viễn' && (
              <p className="text-xs text-red-500 mt-2">
                Hết hạn: {new Date(blockedInfo.blocked_until).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="ocop-card w-full max-w-md p-8 md:p-10 border-t-4 border-t-brand-green">
        {!show2FA ? (
          <>
            {/* === BƯỚC 1: ĐĂNG NHẬP === */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green text-2xl">
                🔐
              </div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">
                Đăng nhập hệ thống
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-sans">
                Dành cho Ban điều hành & Nhà cung cấp OCOP
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading text-sm font-semibold text-slate-700">Email đăng nhập</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="ocop-input"
                  placeholder="admin@ocop.vn..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-heading text-sm font-semibold text-slate-700">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="ocop-input"
                  placeholder="Nhập mật khẩu của bạn"
                />
              </div>

              {error && !blockedInfo?.blocked && (
                <div className="bg-red-50 text-brand-red text-sm font-medium p-3 rounded-lg border border-red-100 flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || blockedInfo?.blocked}
                className="ocop-btn w-full mt-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập vào kênh'}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm text-slate-500 font-sans border-t border-slate-100 pt-6">
              Bạn muốn đăng ký trở thành nhà cung cấp OCOP<Link href="/admin/login" className="text-slate-500 hover:text-brand-green">?</Link>
              <br/>
              <Link href="/register" className="text-brand-green hover:text-brand-green-dark font-semibold transition-colors mt-1 inline-block">Đăng ký đối tác mới</Link>
            </div>
          </>
        ) : (
          <>
            {/* === BƯỚC 2: XÁC MINH OTP === */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-green/20 to-brand-green/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Xác minh 2 bước
              </h2>
              <p className="mt-2 text-sm text-slate-500 font-sans">
                Nhập mã 6 số đã gửi đến <span className="font-semibold text-brand-green">{maskedPhone}</span>
              </p>
            </div>

            {/* Demo OTP display */}
            {demoOtp && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
                <p className="text-xs text-amber-600 font-medium mb-1">🔧 Chế độ Demo - Mã OTP:</p>
                <p className="font-heading text-2xl font-bold text-amber-800 tracking-[0.4em]">{demoOtp}</p>
              </div>
            )}

            {/* OTP Input - 6 ô riêng biệt */}
            <div className="flex justify-center gap-2.5 mb-6">
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
                    transition-all duration-200 bg-white shadow-sm
                    hover:border-slate-300"
                  style={{ caretColor: 'transparent' }}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-brand-red text-sm font-medium p-3 rounded-lg border border-red-100 flex items-start gap-2 mb-4">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={verifying || otpValues.join('').length !== 6}
              className="ocop-btn w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Đang xác minh...
                </span>
              ) : 'Xác minh'}
            </button>

            {/* Gửi lại mã */}
            <div className="text-center mt-4">
              {countdown > 0 ? (
                <p className="text-sm text-slate-400 font-sans">
                  Gửi lại mã sau <span className="font-semibold text-brand-green">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-sm text-brand-green hover:text-brand-green-dark font-semibold transition-colors font-sans"
                >
                  Gửi lại mã xác minh
                </button>
              )}
            </div>

            {/* Quay lại */}
            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShow2FA(false)
                  setError('')
                  setOtpValues(['', '', '', '', '', ''])
                  setDemoOtp('')
                }}
                className="text-sm text-slate-500 hover:text-slate-700 font-sans transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Quay lại đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
