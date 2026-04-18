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
  img?: string
  view_count?: number
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
 * Component ProductForm (Hand-Drawn style)
 * Form quản lý thêm/sửa sản phẩm OCOP bao gồm tích hợp AI sinh nội dung và hình ảnh.
 */
export default function ProductForm({
  initialProduct = null,
  submitLabel = "✓ Vẩy Mực (Lưu)",
  apiPrefix = "/api/admin",
  onSuccess,
}: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name || "")
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id?.toString() || "1"
  )
  const [origin, setOrigin] = useState(initialProduct?.origin || "")
  const [description, setDescription] = useState(initialProduct?.description || "")
  const [representativeFile, setRepresentativeFile] = useState<File | null>(
    null
  )
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [contactAddress, setContactAddress] = useState(
    initialProduct?.contact_address || ""
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // AI Content & Image iframe toggles
  const [showAiContentIframe, setShowAiContentIframe] = useState(false)
  const [showAiImageIframe, setShowAiImageIframe] = useState(false)

  const repFileInputRef = useRef<HTMLInputElement>(null)
  const prodFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name)
      setCategoryId(initialProduct.category_id?.toString() || "1")
      setOrigin(initialProduct.origin || "")
      setDescription(initialProduct.description || "")
      setContactAddress(initialProduct.contact_address || "")
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
      setMessage("Quên điền tên hoặc danh mục rồi kìa bạn ơi!")
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
        setMessage(data.error || 'Lỗi mực khi lưu')
      } else {
        setMessage(isEditing ? '✓ Đã sửa nét thành công!' : '✓ Đã vẽ thêm thành công!')
        if (!isEditing) {
          setName('')
          setCategoryId('1')
          setOrigin('')
          setDescription('')
          setRepresentativeFile(null)
          setProductFiles([])
          setContactAddress('')
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Xuất xứ */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Khu vực / Xuất xứ</label>
          <input
            type="text"
            placeholder="Ví dụ: Phù Lãng, Quế Võ"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
          />
        </div>
        
        {/* Địa chỉ liên hệ */}
        <div>
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Thông tin liên hệ</label>
          <input
            type="text"
            placeholder="Địa chỉ, hotline..."
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800"
          />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Mô tả đặc điểm */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Mô tả sản phẩm</label>
          <button
            type="button"
            onClick={() => setShowAiContentIframe(!showAiContentIframe)}
            className="text-brand-green font-semibold hover:bg-brand-green/10 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-sm flex items-center gap-2"
          >
             ✨ Trợ lý Nội dung AI
          </button>
        </div>
        
        {showAiContentIframe && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span>✨</span> AI Studio — Tạo Nội Dung Sản Phẩm
              </div>
              <button
                type="button"
                onClick={() => setShowAiContentIframe(false)}
                className="text-white/80 hover:text-white text-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <iframe
              src="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true"
              className="w-full border-0"
              style={{ height: '600px' }}
              allow="clipboard-read; clipboard-write"
              title="AI Content Generator"
            />
          </div>
        )}

        <textarea
          placeholder="Mô tả chi tiết sản phẩm..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800 min-h-[160px] resize-y"
        />
      </div>

      <hr className="border-slate-100" />

      {/* Ảnh đại diện */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Hình ảnh đại diện</label>
          <button
            type="button"
            onClick={() => setShowAiImageIframe(!showAiImageIframe)}
            className="text-blue-600 font-semibold hover:bg-blue-50 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-sm flex items-center gap-2"
          >
            🎨 Tạo Ảnh = AI
          </button>
        </div>
        
        {showAiImageIframe && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span>🎨</span> AI Studio — Tạo Ảnh Sản Phẩm
              </div>
              <button
                type="button"
                onClick={() => setShowAiImageIframe(false)}
                className="text-white/80 hover:text-white text-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <iframe
              src="https://aistudio.google.com/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0?showPreview=true&showAssistant=true"
              className="w-full border-0"
              style={{ height: '600px' }}
              allow="clipboard-read; clipboard-write"
              title="AI Image Generator"
            />
          </div>
        )}

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
           <div className="mt-3 flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3 w-max">
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
          Hình ảnh phụ (Kéo thả bổ sung)
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

      <div className="mt-6">
        <button type="submit" className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-green/20 transition-all text-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Đang lưu trữ...' : submitLabel.replace('✓ Vẩy Mực (Lưu)', 'Lưu Thông Tin')}
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
