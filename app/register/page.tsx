"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [taxId, setTaxId] = useState('')
  const [businessRegistration, setBusinessRegistration] = useState('')
  const [ocopCertificate, setOcopCertificate] = useState('')
  const [businessRegistrationFile, setBusinessRegistrationFile] = useState<File | null>(null)
  const [ocopCertificateFile, setOcopCertificateFile] = useState<File | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('role', role)

      if (role === 'seller') {
         formData.append('tax_id', taxId)
         if (businessRegistrationFile) {
            formData.append('business_registration_file', businessRegistrationFile)
         } else {
            formData.append('business_registration', businessRegistration)
         }

         if (ocopCertificateFile) {
            formData.append('ocop_certificate_file', ocopCertificateFile)
         } else {
            formData.append('ocop_certificate', ocopCertificate)
         }
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        if (data.role === 'seller') {
          window.location.href = '/seller'
        } else {
          window.location.href = '/'
        }
      } else {
        setError(data.error || 'Qúa trình đăng ký thất bại')
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
      
      <div className="ocop-card w-full max-w-md p-8 md:p-10 border-t-4 border-t-brand-gold-dark">
         <div className="text-center mb-8">
           <div className="w-12 h-12 bg-brand-gold-light/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold-dark text-2xl">
             📝
           </div>
           <h1 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">
             Đăng ký đối tác
           </h1>
           <p className="mt-2 text-sm text-slate-500 font-sans">
             Ghi danh tham gia vào hệ sinh thái OCOP
           </p>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
               <label className="font-heading text-sm font-semibold text-slate-700">Email đăng ký</label>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 className="ocop-input"
                 placeholder="lienhe@doanhnghiep.vn..."
               />
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="font-heading text-sm font-semibold text-slate-700">Mật khẩu</label>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 minLength={6}
                 className="ocop-input"
                 placeholder="Tối thiểu 6 ký tự"
               />
            </div>

            <div className="flex flex-col gap-2 mt-2">
               <label className="font-heading text-sm font-semibold text-slate-700">Vai trò của bạn trong hệ thống</label>
               <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${role === 'user' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                     <input 
                        type="radio" 
                        name="role" 
                        value="user" 
                        checked={role === 'user'} 
                        onChange={(e) => setRole(e.target.value)}
                        className="accent-brand-green w-4 h-4" 
                     />
                     <span className="font-medium text-sm">Khách hàng</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${role === 'seller' ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                     <input 
                        type="radio" 
                        name="role" 
                        value="seller" 
                        checked={role === 'seller'} 
                        onChange={(e) => setRole(e.target.value)}
                        className="accent-brand-green w-4 h-4" 
                     />
                     <span className="font-medium text-sm">Nhà cung cấp</span>
                  </label>
               </div>
            </div>

            {role === 'seller' && (
              <>
                <div className="flex flex-col gap-1.5 mt-2">
                   <label className="font-heading text-sm font-semibold text-slate-700">Mã Số Thuế *</label>
                   <input
                     type="text"
                     value={taxId}
                     onChange={(e) => setTaxId(e.target.value)}
                     required={role === 'seller'}
                     className="ocop-input"
                     placeholder="Ví dụ: 0101234567"
                   />
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                   <label className="font-heading text-sm font-semibold text-slate-700">Giấy Đăng ký KH / HTX *</label>
                   <input
                     type="text"
                     value={businessRegistration}
                     onChange={(e) => setBusinessRegistration(e.target.value)}
                     disabled={!!businessRegistrationFile}
                     required={role === 'seller' && !businessRegistrationFile}
                     className="ocop-input mb-1"
                     placeholder="Đường dẫn minh chứng..."
                   />
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tải file lên:</span>
                     <input
                       type="file"
                       accept="image/*,.pdf"
                       onChange={(e) => setBusinessRegistrationFile(e.target.files?.[0] || null)}
                       className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer overflow-hidden w-full max-w-[200px]"
                     />
                   </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                   <label className="font-heading text-sm font-semibold text-slate-700">Giấy Chứng nhận OCOP *</label>
                   <input
                     type="text"
                     value={ocopCertificate}
                     onChange={(e) => setOcopCertificate(e.target.value)}
                     disabled={!!ocopCertificateFile}
                     required={role === 'seller' && !ocopCertificateFile}
                     className="ocop-input mb-1"
                     placeholder="Đường dẫn chứng nhận..."
                   />
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Tải file lên:</span>
                     <input
                       type="file"
                       accept="image/*,.pdf"
                       onChange={(e) => setOcopCertificateFile(e.target.files?.[0] || null)}
                       className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer overflow-hidden w-full max-w-[200px]"
                     />
                   </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-brand-red text-sm font-medium p-3 rounded-lg border border-red-100 flex items-start gap-2 mt-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span>{error}</span>
              </div>
            )}

            <button
               type="submit"
               disabled={loading}
               className="ocop-btn w-full mt-4 py-3 text-base !bg-brand-gold-dark hover:!bg-brand-gold text-white"
            >
               {loading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
            </button>
         </form>

         <div className="mt-8 text-center text-sm text-slate-500 font-sans border-t border-slate-100 pt-6">
           Bạn đã có tài khoản trên hệ thống?
           <br/>
           <Link href="/login" className="text-brand-gold-dark hover:text-brand-gold font-semibold transition-colors mt-1 inline-block">Đăng nhập tại đây</Link>
         </div>
      </div>
    </div>
  )
}
