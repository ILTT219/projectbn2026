"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
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
        } else {
          // Ngăn chặn User/Seller đăng nhập qua Cổng Admin
          await fetch('/api/auth/logout', { method: 'POST' }) // Xoá token lỡ set
          setError('Khu vực này chỉ dành riêng cho Quản trị viên cấp cao.')
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
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center gap-2 font-sans text-sm font-medium text-slate-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Quay lại trang chủ người dùng
        </Link>
      </div>
      
      <div className="bg-slate-800 w-full max-w-md p-8 md:p-10 rounded-2xl border-t-4 border-t-amber-500 shadow-2xl">
         <div className="text-center mb-8">
           <div className="w-16 h-16 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-500 text-3xl shadow-inner border border-amber-500/30">
             🛡️
           </div>
           <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
             Cổng Quản Trị Hệ Thống
           </h1>
           <p className="mt-2 text-sm text-slate-400 font-sans">
             Khu vực tuyệt mật, vượt quyền sẽ bị ghi log.
           </p>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
               <label className="font-heading text-sm font-medium text-slate-300">Tài khoản Nội bộ</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans text-sm"
                 placeholder="admin@ocop.vn..."
               />
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="font-heading text-sm font-medium text-slate-300">Khóa Truy Cập</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 className="bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-sans text-sm"
                 placeholder="••••••••••••"
               />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm font-medium p-3 rounded-lg border border-red-500/20 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
               type="submit"
               disabled={loading}
               className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 focus:ring-offset-slate-900 text-base"
            >
               {loading ? 'Đang xác thực...' : 'Thâm nhập'}
            </button>
         </form>
      </div>
    </div>
  )
}
