"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"

export interface Product {
  id?: number
  name: string
  category_id: number
  origin?: string
  description?: string
  contact_address?: string
  phone?: string
  img?: string
  view_count?: number
  status?: string
  rejection_reason?: string
}

export const categories = [
  { id: 1, name: "Lương thực" },
  { id: 2, name: "Thực phẩm" },
  { id: 3, name: "Dược liệu" },
  { id: 4, name: "Thủ công mỹ nghệ" },
  { id: 5, name: "Hàng tiêu dùng" },
  { id: 6, name: "Đồ uống" },
]

interface ProductFormProps {
  initialProduct?: Product | null
  submitLabel?: string
  apiPrefix?: string
  onSuccess?: () => void
}

/**
 * Component ProductForm
 * Form quản lý thêm/sửa sản phẩm OCOP bao gồm tích hợp AI sinh nội dung và hình ảnh.
 */
export default function ProductForm({
  initialProduct = null,
  submitLabel = "Lưu Thông Tin",
  apiPrefix = "/api/admin",
  onSuccess,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name || "")
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id?.toString() || "1"
  )
  const [origin, setOrigin] = useState(initialProduct?.origin || "")
  const [description, setDescription] = useState(initialProduct?.description || "")
  const [representativeFile, setRepresentativeFile] = useState<File | null>(null)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [contactAddress, setContactAddress] = useState(
    initialProduct?.contact_address || ""
  )
  const [phone, setPhone] = useState(initialProduct?.phone || "")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const repFileInputRef = useRef<HTMLInputElement>(null)
  const prodFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name)
      setCategoryId(initialProduct.category_id?.toString() || "1")
      setOrigin(initialProduct.origin || "")
      setDescription(initialProduct.description || "")
      setContactAddress(initialProduct.contact_address || "")
      setPhone(initialProduct.phone || "")
      if (repFileInputRef.current) repFileInputRef.current.value = ""
      if (prodFileInputRef.current) prodFileInputRef.current.value = ""
      setRepresentativeFile(null)
      setProductFiles([])
      setMessage("")
    }
  }, [initialProduct])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !categoryId) {
      setMessage("Vui lòng nhập tên và danh mục sản phẩm.")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('category_id', categoryId)
      formData.append('origin', origin)
      formData.append('description', description)
      formData.append('contact_address', contactAddress)
      formData.append('phone', phone)

      if (representativeFile) {
        formData.append('representative', representativeFile)
      }
      productFiles.forEach((file) => formData.append('images', file))

      const isEditing = !!initialProduct?.id
      const url = isEditing
        ? `${apiPrefix}/products/${initialProduct!.id}`
        : `${apiPrefix}/products`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMessage(data.error || 'Lỗi khi lưu')
      } else {
        setMessage(isEditing ? '✓ Đã cập nhật thành công!' : '✓ Đã lưu sản phẩm thành công!')
        if (!isEditing) {
          setName('')
          setCategoryId('1')
          setOrigin('')
          setDescription('')
          setRepresentativeFile(null)
          setProductFiles([])
          setContactAddress('')
          setPhone('')
          if (repFileInputRef.current) repFileInputRef.current.value = ''
          if (prodFileInputRef.current) prodFileInputRef.current.value = ''
        }
        onSuccess && onSuccess()
      }
    } catch (err: any) {
      console.error('Submit error', err)
      setMessage('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full p-6 md:p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tên sản phẩm */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">* Tên sản phẩm</label>
          <input
            type="text"
            placeholder="Ví dụ: Trà hoa vàng Quế Võ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
            required
          />
        </div>

        {/* Danh mục */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">* Danh mục</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800 cursor-pointer"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Xuất xứ */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Khu vực / Xuất xứ</label>
          <input
            type="text"
            placeholder="Ví dụ: Phù Lãng"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
          />
        </div>
        
        {/* Địa chỉ liên hệ */}
        <div className="md:col-span-1">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Cơ sở / Doanh nghiệp</label>
          <input
            type="text"
            placeholder="Tên cơ sở, công ty, HTX..."
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
          />
        </div>

        {/* Số điện thoại */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Số điện thoại</label>
          <input
            type="tel"
            placeholder="Hotline đặt hàng..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ========== TRỢ LÝ AI (FREE TIER) ========== */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-5 animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✨</span>
          <h4 className="font-heading font-bold text-slate-800 text-base">Trợ Lý AI OCOP (Free Tier)</h4>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Sử dụng các công cụ Google AI Studio miễn phí để tạo nội dung chuẩn SEO và hình ảnh avatar chuyên nghiệp.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>📝</span> Tạo nội dung Mô tả
          </a>
          <a
            href="https://aistudio.google.com/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0?showPreview=true&showAssistant=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border-2 border-blue-500 text-blue-700 hover:bg-blue-50 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>🎨</span> Tạo ảnh Avatar
          </a>
        </div>
      </div>

      {/* ========== MÔ TẢ SẢN PHẨM ========== */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Mô tả chi tiết sản phẩm</label>
        <p className="text-xs text-slate-400 mb-1">Dán nội dung bạn đã sao chép từ Trợ Lý AI vào đây.</p>
        <textarea
          placeholder="Dán nội dung mô tả sản phẩm..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800 min-h-[160px] resize-y"
        />
      </div>

      <hr className="border-slate-100" />

      {/* ========== ẢNH ĐẠI DIỆN ========== */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block mb-1">Hình ảnh đại diện</label>
          <p className="text-xs text-slate-400 mb-2">Tải lên file ảnh Avatar bạn đã tạo từ AI.</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 overflow-hidden text-slate-600">
          <input
            ref={repFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setRepresentativeFile(e.target.files?.[0] || null)}
            className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>
        
        {representativeFile && (
           <div className="mt-2 flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3 w-max">
            <img 
               src={URL.createObjectURL(representativeFile)} 
               alt="Preview" 
               className="w-16 h-16 object-cover rounded-lg shadow-sm border border-slate-100"
            />
            <div className="font-semibold text-sm text-slate-700">
               {representativeFile.name.substring(0,25)}{representativeFile.name.length > 25 ? '...' : ''}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">
          Hình ảnh phụ bổ sung (Kéo thả, không bắt buộc)
        </label>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 overflow-hidden text-slate-600">
          <input
            ref={prodFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
            className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
          />
        </div>
        
        {productFiles.length > 0 && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 block">Đã chọn {productFiles.length} hình ảnh:</div>
            <div className="flex gap-2 flex-wrap text-xs">
              {productFiles.map((file, idx) => (
                <span key={idx} className="bg-white px-3 py-1.5 border border-slate-200 rounded-full text-slate-600 shadow-sm">
                  {file.name.substring(0, 15)}{file.name.length > 15 ? '...' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-slate-100">
        <button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-green/20 transition-all text-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Đang lưu trữ...' : submitLabel.replace('✓ Vẩy Mực (Lưu)', 'Lưu Thông Tin').replace('✓ Lưu vết mực', 'Cập Nhật')}
        </button>
      </div>

      {message && (
        <div className={`mt-2 p-4 rounded-xl font-medium text-center text-sm border ${message.includes('Lỗi') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
          {message}
        </div>
      )}
    </form>
  )
}

