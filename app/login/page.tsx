"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        setError(data.error || 'Thông tin đăng nhập không chính xác')
      }
    } catch (err: any) {
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-50 min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center gap-2 font-sans text-sm font-medium text-slate-500 hover:text-brand-green transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại trang chủ
        </Link>
      </div>
      
      <div className="ocop-card w-full max-w-md p-8 md:p-10 border-t-4 border-t-brand-green">
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

            {error && (
              <div className="bg-red-50 text-brand-red text-sm font-medium p-3 rounded-lg border border-red-100 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
               type="submit"
               disabled={loading}
               className="ocop-btn w-full mt-2 py-3 text-base"
            >
               {loading ? 'Đang xử lý...' : 'Đăng nhập vào kênh'}
            </button>
         </form>
         
         <div className="mt-8 text-center text-sm text-slate-500 font-sans border-t border-slate-100 pt-6">
           Bạn muốn đăng ký trở thành nhà cung cấp OCOP?
           <br/>
           <Link href="/register" className="text-brand-green hover:text-brand-green-dark font-semibold transition-colors mt-1 inline-block">Đăng ký đối tác mới</Link>
         </div>
      </div>
    </div>
  )
}
