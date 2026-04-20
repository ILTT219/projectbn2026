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
 * Component ProductForm
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
  const [representativeFile, setRepresentativeFile] = useState<File | null>(null)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [contactAddress, setContactAddress] = useState(
    initialProduct?.contact_address || ""
  )
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // AI Content Generation states
  const [showContentAI, setShowContentAI] = useState(false)
  const [contentPrompt, setContentPrompt] = useState("")
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState("")

  // AI Image Generation states
  const [showImageAI, setShowImageAI] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  // Fallback links toggle
  const [showFallbackLinks, setShowFallbackLinks] = useState(false)

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
      setGeneratedImage(null)
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
        setMessage(data.error || 'Lỗi khi lưu')
      } else {
        setMessage(isEditing ? '✓ Đã sửa thành công!' : '✓ Đã thêm thành công!')
        if (!isEditing) {
          setName('')
          setCategoryId('1')
          setOrigin('')
          setDescription('')
          setRepresentativeFile(null)
          setProductFiles([])
          setContactAddress('')
          setGeneratedImage(null)
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

  // AI Content Generation
  const handleGenerateContent = async () => {
    if (!name.trim()) {
      setContentError("Vui lòng nhập tên sản phẩm trước")
      return
    }
    setContentLoading(true)
    setContentError("")
    try {
      const catName = categories.find(c => c.id.toString() === categoryId)?.name || ""
      const res = await fetch(`${apiPrefix}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          subject: contactAddress || "Chủ thể OCOP Bắc Ninh",
          location: origin || "Bắc Ninh",
          productGroup: catName,
          highlights: contentPrompt || "Sản phẩm chất lượng cao, đạt chuẩn OCOP",
          certification: "OCOP 3-5 sao",
          localStory: contentPrompt || ""
        })
      })
      const data = await res.json()
      if (data.error) {
        setContentError(data.error)
      } else if (data.description) {
        setDescription(data.description)
        setShowContentAI(false)
        setContentPrompt("")
      } else {
        setContentError("Không nhận được nội dung từ AI")
      }
    } catch (err: any) {
      setContentError(err.message || "Lỗi kết nối")
    } finally {
      setContentLoading(false)
    }
  }

  // AI Image Generation
  const handleGenerateImage = async () => {
    if (!name.trim()) {
      setImageError("Vui lòng nhập tên sản phẩm trước")
      return
    }
    setImageLoading(true)
    setImageError("")
    setGeneratedImage(null)
    try {
      const res = await fetch(`${apiPrefix}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          location: origin || "Bắc Ninh",
          highlights: description || "Sản phẩm OCOP chất lượng cao",
          requirements: imagePrompt || "Professional, minimalist, bright colors"
        })
      })
      const data = await res.json()
      if (data.error) {
        setImageError(data.error)
      } else if (data.image) {
        setGeneratedImage(data.image)
      } else {
        setImageError("Không nhận được hình ảnh từ AI")
      }
    } catch (err: any) {
      setImageError(err.message || "Lỗi kết nối")
    } finally {
      setImageLoading(false)
    }
  }

  // Convert generated image (URL or base64) to File and set as representative
  const useGeneratedImage = async () => {
    if (!generatedImage) return
    try {
      // Try direct fetch first (works for base64 data URIs and same-origin URLs)
      const res = await fetch(generatedImage)
      const blob = await res.blob()
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: blob.type || 'image/png' })
      setRepresentativeFile(file)
      setShowImageAI(false)
    } catch {
      // Fallback for CORS-restricted URLs: fetch through our own API proxy
      try {
        const proxyRes = await fetch(`/api/products/proxy-image?url=${encodeURIComponent(generatedImage)}`)
        const blob = await proxyRes.blob()
        const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: blob.type || 'image/png' })
        setRepresentativeFile(file)
        setShowImageAI(false)
      } catch (err) {
        setImageError("Không thể tải ảnh. Hãy click phải ảnh > Lưu ảnh, rồi upload thủ công.")
      }
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

      {/* ========== MÔ TẢ SẢN PHẨM + AI CONTENT ========== */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Mô tả sản phẩm</label>
          <button
            type="button"
            onClick={() => setShowContentAI(!showContentAI)}
            className={`font-semibold text-sm flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
              showContentAI
                ? 'bg-brand-green text-white border-brand-green shadow-md'
                : 'text-brand-green hover:bg-brand-green/10 bg-slate-50 border-slate-200'
            }`}
          >
            ✨ Tạo nội dung bằng AI
          </button>
        </div>

        {/* AI Content Panel */}
        {showContentAI && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-5 mb-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h4 className="font-heading font-bold text-slate-800 text-sm">Trợ lý AI tạo mô tả sản phẩm</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              AI sẽ dựa vào tên sản phẩm, danh mục, xuất xứ để viết mô tả. Bạn có thể thêm gợi ý riêng bên dưới.
            </p>
            <textarea
              placeholder="Nhập gợi ý cho AI (VD: Sản phẩm làm thủ công 100%, không hóa chất, hương vị truyền thống 50 năm...)"
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800 min-h-[80px] resize-y text-sm mb-3"
            />
            {contentError && (
              <p className="text-xs text-red-500 mb-2 bg-red-50 px-3 py-2 rounded-lg">{contentError}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={contentLoading}
                className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {contentLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>✨ Tạo mô tả</>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowContentAI(false); setContentError("") }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
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

      {/* ========== ẢNH ĐẠI DIỆN + AI IMAGE ========== */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Hình ảnh đại diện</label>
          <button
            type="button"
            onClick={() => setShowImageAI(!showImageAI)}
            className={`font-semibold text-sm flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
              showImageAI
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'text-blue-600 hover:bg-blue-50 bg-slate-50 border-slate-200'
            }`}
          >
            🎨 Tạo ảnh bằng AI
          </button>
        </div>

        {/* AI Image Panel */}
        {showImageAI && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 mb-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎨</span>
              <h4 className="font-heading font-bold text-slate-800 text-sm">Trợ lý AI tạo hình ảnh sản phẩm</h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              AI sẽ tạo ảnh quảng bá chuyên nghiệp. Thêm yêu cầu riêng bên dưới để AI hiểu ý bạn hơn.
            </p>
            <textarea
              placeholder="Nhập yêu cầu cho ảnh (VD: Nền trắng tinh tế, có hoa sen trang trí, phong cách premium, ánh sáng studio...)"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-800 min-h-[80px] resize-y text-sm mb-3"
            />
            {imageError && (
              <p className="text-xs text-red-500 mb-2 bg-red-50 px-3 py-2 rounded-lg">{imageError}</p>
            )}

            {/* Generated Image Preview */}
            {generatedImage && (
              <div className="mb-4 bg-white rounded-xl border border-blue-200 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Ảnh AI đã tạo:</p>
                <div className="relative w-full max-w-[300px] aspect-square rounded-xl overflow-hidden border border-slate-200 mx-auto">
                  <img src={generatedImage} alt="AI Generated" className="w-full h-full object-cover" />
                </div>
                <div className="flex justify-center gap-3 mt-3">
                  <button
                    type="button"
                    onClick={useGeneratedImage}
                    className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm"
                  >
                    ✓ Dùng ảnh này
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={imageLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
                  >
                    🔄 Tạo lại
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={imageLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {imageLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo ảnh...
                  </>
                ) : (
                  <>🎨 Tạo ảnh</>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowImageAI(false); setImageError("") }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
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

      {/* Phương án dự phòng: Google AI Studio Links */}
      <div className="border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setShowFallbackLinks(!showFallbackLinks)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5"
        >
          <svg className={`w-3 h-3 transition-transform ${showFallbackLinks ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
          </svg>
          Phương án dự phòng (Google AI Studio)
        </button>
        {showFallbackLinks && (
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green font-semibold hover:bg-brand-green/10 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-xs flex items-center gap-2 no-underline"
            >
              ✨ Trợ lý Nội dung AI ↗
            </a>
            <a
              href="https://aistudio.google.com/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0?showPreview=true&showAssistant=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:bg-blue-50 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-xs flex items-center gap-2 no-underline"
            >
              🎨 Tạo Ảnh = AI ↗
            </a>
          </div>
        )}
      </div>

      <div className="mt-2">
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
