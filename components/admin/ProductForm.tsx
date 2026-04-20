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

  // AI Modals State
  const [showContentModal, setShowContentModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  // AI Inputs
  const [aiHighlights, setAiHighlights] = useState("")
  const [aiRequirements, setAiRequirements] = useState("")
  const [generatedImgBase64, setGeneratedImgBase64] = useState("")

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

  const generateContent = async () => {
    if (!name || !origin) {
      alert("Vui lòng điền Tên sản phẩm và Khu vực/Xuất xứ trước khi tạo mô tả bằng AI.")
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch(`${apiPrefix}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          subject: contactAddress,
          location: origin,
          productGroup: categories.find((c) => c.id.toString() === categoryId)?.name || 'Khác',
          highlights: aiHighlights
        })
      })
      const data = await res.json()
      if (data.description) {
        setDescription(data.description)
        setShowContentModal(false)
      } else {
        alert(data.error || "Tạo nội dung lỗi.")
      }
    } catch (err) {
      alert("Lỗi khi gọi hệ thống AI.")
    } finally {
      setAiGenerating(false)
    }
  }

  const generateImage = async () => {
    if (!name) {
      alert("Vui lòng điền Tên sản phẩm để tạo ảnh mô phỏng.")
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch(`${apiPrefix}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          highlights: name,
          requirements: aiRequirements,
          location: origin
        })
      })
      const data = await res.json()
      if (data.image) {
        setGeneratedImgBase64(data.image)
        try {
          const resObj = await fetch(data.image)
          const blob = await resObj.blob()
          const file = new File([blob], `ai-avatar-${Date.now()}.png`, { type: 'image/png' })
          setRepresentativeFile(file)
        } catch (e) {
             console.error("Failed to parse base64 to file", e)
        }
        setShowImageModal(false)
      } else {
        alert(data.error || "Tạo ảnh lỗi.")
      }
    } catch (err) {
      alert("Lỗi khi gọi hệ thống AI Image.")
    } finally {
      setAiGenerating(false)
    }
  }

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

      {/* The AI Studio section is removed completely and merged into modals */}

      {/* ========== MÔ TẢ SẢN PHẨM ========== */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end mb-1">
          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Mô tả chi tiết sản phẩm</label>
            <p className="text-xs text-slate-400 mt-1">Dán nội dung hoặc dùng AI tạo nháp.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowContentModal(true)}
            className="bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white font-semibold py-1.5 px-3 rounded-lg transition-colors text-xs flex items-center gap-1 border border-brand-green/20"
          >
            ✨ Tạo bằng AI
          </button>
        </div>
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
        <div className="flex justify-between items-end mb-1">
          <div>
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Hình ảnh đại diện</label>
            <p className="text-xs text-slate-400 mt-1">Tải lên file hoặc tạo bằng AI.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white font-semibold py-1.5 px-3 rounded-lg transition-colors text-xs flex items-center gap-1 border border-brand-green/20"
          >
            ✨ Tạo ảnh bằng AI
          </button>
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

      {/* ========== AI CONTENT MODAL ========== */}
      {showContentModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-brand-green/5 p-6 border-b border-brand-green/10 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800 text-xl flex items-center gap-2">
                <span>🪄</span> Trợ Lý AI: Tạo Mô Tả Sản Phẩm
              </h3>
              <button type="button" onClick={() => setShowContentModal(false)} className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl border border-amber-200/50">
                AI sẽ tự động đọc <strong>Tên sản phẩm</strong>, <strong>Nguồn gốc</strong>, và <strong>Danh mục</strong> bạn đã nhập để soạn thảo nội dung OCOP.
              </div>
              
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Điểm nổi bật (Gợi ý thêm cho AI)</label>
                <input 
                   type="text" 
                   placeholder="VD: Làm thủ công, vị ngọt thanh, 100% tự nhiên..."
                   value={aiHighlights}
                   onChange={e => setAiHighlights(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800"
                />
              </div>

              <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={generateContent} 
                  disabled={aiGenerating}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {aiGenerating ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang soạn...</>
                  ) : 'Bắt đầu soạn thảo'}
                </button>
                <a 
                  href="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Mở Google AI Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== AI IMAGE MODAL ========== */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-brand-green/5 p-6 border-b border-brand-green/10 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800 text-xl flex items-center gap-2">
                <span>🎨</span> Trợ Lý AI: Tạo Ảnh Đại Diện
              </h3>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-red-500 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="bg-amber-50 text-amber-800 text-sm p-4 rounded-xl border border-amber-200/50">
                AI sẽ vẽ một hình ảnh giả lập chuyên nghiệp dựa trên <strong>Tên sản phẩm</strong>.
              </div>
              
              <div>
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 block">Phong cách muốn tạo (Chất liệu, màu sắc...)</label>
                <input 
                   type="text" 
                   placeholder="VD: Chụp studio, phông nền trắng, cao cấp..."
                   value={aiRequirements}
                   onChange={e => setAiRequirements(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800"
                />
              </div>

              <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={generateImage} 
                  disabled={aiGenerating}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {aiGenerating ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang vẽ ảnh...</>
                  ) : 'Bắt đầu vẽ ảnh'}
                </button>
                <a 
                  href="https://aistudio.google.com/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0?showPreview=true&showAssistant=true" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Mở Google AI Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

