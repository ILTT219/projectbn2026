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
        // Tuỳ vào bộ đồng phục (role), ta đẩy người dùng vào đúng cổng
        if (data.role === 'admin') {
          window.location.href = '/admin'
        } else if (data.role === 'seller') {
          window.location.href = '/seller'
        } else {
          window.location.href = '/'
        }
      } else {
        setError(data.error || 'Chià khoá gãy rồi òi')
      }
    } catch (err: any) {
      setError('Lỗi đường rò...')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-24 min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm mb-4">
        <Link href="/" className="inline-flex items-center gap-2 font-heading text-xl text-slate-500 hover:text-slate-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Chạy ra ngoài
        </Link>
      </div>
      <div className="sketch-card bg-amber-50/90 w-full max-w-sm p-8 md:p-10 transform rotate-1 shadow-[8px_8px_0px_#1e1e1e]" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #cbd5e1 31px, #cbd5e1 32px)', paddingTop: '45px' }}>
         <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 transform scale-150">
            📌
         </div>
         <h1 className="font-heading text-5xl font-bold text-brand-green text-center mb-8 bg-white/70 py-1 border-2 border-slate-900 border-dashed" style={{ borderRadius: '15px 255px 15px 225px / 255px 15px 225px 15px' }}>
            Ổ Khoá
         </h1>
         <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-serif text-xl">
            <div className="flex flex-col gap-2">
               <label className="font-heading text-2xl font-bold text-slate-900">Danh tính (Email)</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="sketch-input py-2 text-xl"
                 placeholder="Bút danh..."
               />
            </div>

            <div className="flex flex-col gap-2">
               <label className="font-heading text-2xl font-bold text-slate-900">Mật thư (Mật khẩu)</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 className="sketch-input py-2 text-xl"
                 placeholder="Che dòng mực..."
               />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 font-bold p-3 border-2 border-red-500 text-center transform -rotate-2" style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
                {error}
              </div>
            )}

            <button
               type="submit"
               disabled={loading}
               className="sketch-btn w-full mt-4 py-3 bg-brand-green text-white text-2xl"
            >
               {loading ? 'Đang tra chìa...' : '🗝 Tra Chìa & Vào'}
            </button>
         </form>
         
         <div className="mt-6 text-center text-slate-500 text-lg font-serif italic border-t-2 border-slate-300 border-dashed pt-4">
           Nhập đúng mã thẻ để hệ thống chỉ đường cho bạn vào đúng phòng Lãnh đạo hoặc Người bán nha!
           <br/><br/>
           Chưa có thẻ? <Link href="/register" className="text-brand-green hover:text-green-800 font-bold underline decoration-wavy">Khắc thẻ mới ngay luôn</Link>
         </div>
      </div>
    </div>
  )
}
