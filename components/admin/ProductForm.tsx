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

  // AI Content Inputs
  const [aiHighlights, setAiHighlights] = useState("")
  const [aiLocalStory, setAiLocalStory] = useState("")
  const [aiCertification, setAiCertification] = useState("")
  const [generatedContent, setGeneratedContent] = useState("")

  // AI Image Inputs
  const [aiRequirements, setAiRequirements] = useState("")
  const [aiImageSize, setAiImageSize] = useState<"1:1" | "16:9">("1:1")
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

  const openContentModal = () => {
    setGeneratedContent("")
    setShowContentModal(true)
  }

  const openImageModal = () => {
    setGeneratedImgBase64("")
    setShowImageModal(true)
  }

  const applyGeneratedContent = () => {
    if (generatedContent) {
      setDescription(generatedContent)
      setShowContentModal(false)
    }
  }

  const applyGeneratedImage = () => {
    setShowImageModal(false)
  }

  const generateContent = async () => {
    if (!name) {
      alert("Vui lòng điền Tên sản phẩm trước khi tạo mô tả bằng AI.")
      return
    }
    setAiGenerating(true)
    setGeneratedContent("")
    try {
      const res = await fetch(`${apiPrefix}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          subject: contactAddress,
          location: origin,
          productGroup: categories.find((c) => c.id.toString() === categoryId)?.name || 'Khác',
          highlights: [aiHighlights, aiLocalStory, aiCertification ? `Chứng nhận: ${aiCertification}` : ''].filter(Boolean).join('. ')
        })
      })
      const data = await res.json()
      if (data.description) {
        setGeneratedContent(data.description)
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
    setGeneratedImgBase64("")
    try {
      const res = await fetch(`${apiPrefix}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          highlights: aiHighlights || name,
          requirements: aiRequirements,
          location: origin,
          aspectRatio: aiImageSize
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
            onClick={openContentModal}
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
            onClick={openImageModal}
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

      {/* ========== AI CONTENT MODAL (Two-Column) ========== */}
      {showContentModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowContentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-green/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-800 text-lg">Tạo nội dung mô tả</h3>
                  <p className="text-xs text-slate-500">Cung cấp thông tin để AI tạo nội dung chuẩn OCOP</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowContentModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">&times;</button>
            </div>

            {/* Body: Two Columns */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left: Form */}
              <div className="md:w-[52%] p-6 overflow-y-auto border-r border-slate-100 flex flex-col gap-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin sản phẩm</h4>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Tên sản phẩm</label>
                  <input type="text" placeholder="VD: Trà hoa vàng Quế Võ" value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Chủ thể OCOP</label>
                    <input type="text" placeholder="Tên HTX/Doanh nghiệp" value={contactAddress} onChange={e => setContactAddress(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Địa phương</label>
                    <input type="text" placeholder="Huyện/Thị xã/Thành phố" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Nhóm sản phẩm</label>
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm cursor-pointer">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Chứng nhận</label>
                    <select value={aiCertification} onChange={e => setAiCertification(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm cursor-pointer">
                      <option value="">Chọn hạng sao...</option>
                      <option value="3 sao">3 sao ⭐⭐⭐</option>
                      <option value="4 sao">4 sao ⭐⭐⭐⭐</option>
                      <option value="5 sao">5 sao ⭐⭐⭐⭐⭐</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Câu chuyện địa phương</label>
                  <textarea placeholder="VD: Sản phẩm gắn liền với truyền thuyết về trạng nguyên, hoặc lịch sử làng nghề 500 năm..." value={aiLocalStory} onChange={e => setAiLocalStory(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm min-h-[80px] resize-y" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Điểm nổi bật</label>
                  <textarea placeholder="VD: Quy trình canh tác hữu cơ, không chất bảo quản, hương vị đặc trưng của vùng đất Kinh Bắc..." value={aiHighlights} onChange={e => setAiHighlights(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm min-h-[80px] resize-y" />
                </div>

                <button
                  type="button"
                  onClick={generateContent}
                  disabled={aiGenerating}
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {aiGenerating ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang soạn thảo...</>
                  ) : (<><span>✨</span> Tạo nội dung ngay<span className="ml-1">›</span></>)}
                </button>
              </div>

              {/* Right: Preview */}
              <div className="md:w-[48%] bg-slate-50 p-6 overflow-y-auto flex flex-col">
                {!generatedContent && !aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-200/60 rounded-2xl flex items-center justify-center mb-5">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h4 className="font-heading font-bold text-slate-500 text-lg mb-2">Chưa có nội dung được tạo</h4>
                    <p className="text-sm text-slate-400 max-w-xs">Điền thông tin bên trái và nhấn nút để bắt đầu hành trình quảng bá sản phẩm của bạn.</p>
                  </div>
                ) : aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <svg className="w-10 h-10 animate-spin text-brand-green mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h4 className="font-heading font-bold text-slate-600 text-lg">AI đang soạn thảo...</h4>
                    <p className="text-sm text-slate-400 mt-1">Quá trình này có thể mất 10-30 giây</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green">Nội dung đã tạo</h4>
                      <span className="text-xs text-slate-400">{generatedContent.length} ký tự</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto max-h-[50vh]">
                      {generatedContent}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button type="button" onClick={applyGeneratedContent} className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 rounded-xl transition-all text-sm">✓ Áp dụng nội dung này</button>
                      <button type="button" onClick={generateContent} disabled={aiGenerating} className="bg-white border border-slate-200 hover:border-brand-green text-slate-600 hover:text-brand-green font-semibold py-2.5 px-4 rounded-xl transition-all text-sm">↻ Tạo lại</button>
                    </div>
                    <a href="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true" target="_blank" rel="noopener noreferrer" className="text-center text-xs text-slate-400 hover:text-brand-green mt-3 transition-colors">Hoặc mở Google AI Studio ↗</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== AI IMAGE MODAL (Two-Column) ========== */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowImageModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-green/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-800 text-lg">Kiến tạo hình ảnh thương hiệu OCOP</h3>
                  <p className="text-xs text-slate-500">Nhập thông tin sản phẩm để AI tạo thiết kế chuyên nghiệp</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowImageModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">&times;</button>
            </div>

            {/* Body: Two Columns */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left: Form */}
              <div className="md:w-[52%] p-6 overflow-y-auto border-r border-slate-100 flex flex-col gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Tên sản phẩm</label>
                  <input type="text" placeholder="VD: Trà sen Tây Hồ" value={name} onChange={e => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Xuất xứ</label>
                  <input type="text" placeholder="VD: Tây Hồ, Hà Nội" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Đặc điểm nổi bật</label>
                  <textarea placeholder="VD: Hương thơm thanh khiết, vị ngọt hậu, đóng gói thủ công..." value={aiHighlights} onChange={e => setAiHighlights(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm min-h-[70px] resize-y" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Kích thước ảnh</label>
                  <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    <button type="button" onClick={() => setAiImageSize('1:1')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${aiImageSize === '1:1' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                      Hình vuông (1:1)
                    </button>
                    <button type="button" onClick={() => setAiImageSize('16:9')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${aiImageSize === '16:9' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                      Nằm ngang (16:9)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex items-center gap-1"><span className="text-brand-green">✦</span> Yêu cầu hình ảnh</label>
                  <textarea placeholder="VD: Phong cách tối giản, nền gỗ, ánh sáng ấm áp..." value={aiRequirements} onChange={e => setAiRequirements(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm min-h-[60px] resize-y" />
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <div className="font-bold text-emerald-700 mb-1">💡 Mẹo thiết kế</div>
                    <p className="text-emerald-600">Hãy mô tả chi tiết về bao bì và bối cảnh để AI hiểu rõ hơn về phong cách bạn muốn.</p>
                  </div>
                  <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="font-bold text-blue-700 mb-1">📐 Định dạng</div>
                    <p className="text-blue-600">Hình ảnh được tạo với tỉ lệ {aiImageSize}, độ phân giải cao, phù hợp cho Facebook và Instagram.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateImage}
                  disabled={aiGenerating}
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {aiGenerating ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tạo thiết kế...</>
                  ) : (<><span>🎨</span> Bắt đầu sáng tạo<span className="ml-1">›</span></>)}
                </button>
              </div>

              {/* Right: Preview */}
              <div className="md:w-[48%] bg-slate-50 p-6 overflow-y-auto flex flex-col">
                {!generatedImgBase64 && !aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-200/60 rounded-2xl flex items-center justify-center mb-5">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 className="font-heading font-bold text-slate-500 text-lg mb-2">Chưa có thiết kế</h4>
                    <p className="text-sm text-slate-400 max-w-xs">Điền thông tin bên trái và nhấn nút &ldquo;Bắt đầu sáng tạo&rdquo; để xem kết quả.</p>
                  </div>
                ) : aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <svg className="w-10 h-10 animate-spin text-brand-green mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h4 className="font-heading font-bold text-slate-600 text-lg">AI đang vẽ thiết kế...</h4>
                    <p className="text-sm text-slate-400 mt-1">Quá trình này có thể mất 15-45 giây</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-green">Thiết kế đã tạo</h4>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex-1 flex items-center justify-center">
                      <img src={generatedImgBase64} alt="AI Generated" className="max-w-full max-h-[50vh] rounded-lg shadow-sm object-contain" />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button type="button" onClick={applyGeneratedImage} className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 rounded-xl transition-all text-sm">✓ Sử dụng ảnh này</button>
                      <button type="button" onClick={generateImage} disabled={aiGenerating} className="bg-white border border-slate-200 hover:border-brand-green text-slate-600 hover:text-brand-green font-semibold py-2.5 px-4 rounded-xl transition-all text-sm">↻ Tạo lại</button>
                    </div>
                    <a href="https://aistudio.google.com/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0?showPreview=true&showAssistant=true" target="_blank" rel="noopener noreferrer" className="text-center text-xs text-slate-400 hover:text-brand-green mt-3 transition-colors">Hoặc mở Google AI Studio ↗</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

