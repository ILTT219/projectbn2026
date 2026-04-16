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

  // AI Content Form State
  const [showAiContentForm, setShowAiContentForm] = useState(false)
  const [aiSubject, setAiSubject] = useState("")
  const [aiHighlights, setAiHighlights] = useState("")
  const [aiCertification, setAiCertification] = useState("")
  const [aiLocalStory, setAiLocalStory] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  // AI Image Form State
  const [showAiImageForm, setShowAiImageForm] = useState(false)
  const [aiImageRequirements, setAiImageRequirements] = useState("")
  const [aiAspectRatio, setAiAspectRatio] = useState("1:1")
  const [aiImageLoading, setAiImageLoading] = useState(false)

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

  async function handleGenerateAiContent() {
    if (!name.trim() || !aiHighlights.trim()) {
      alert("Ê, phải điền 'Tên' với 'Điểm nổi bật' thì AI nó mới biết đường chém gió nha!")
      return
    }
    setAiLoading(true)
    try {
      const selectedCategory = categories.find(c => c.id.toString() === categoryId)?.name || ""
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          subject: aiSubject,
          location: origin || "Bắc Ninh",
          productGroup: selectedCategory,
          highlights: aiHighlights,
          certification: aiCertification,
          localStory: aiLocalStory
        })
      })
      const data = await res.json()
      if (data.description && data.seoContent) {
        setDescription(`${data.description}\n\n=========================\n\nGỢI Ý SEO:\n${data.seoContent}`)
        setShowAiContentForm(false)
      } else if (data.description) {
        setDescription(data.description)
        setShowAiContentForm(false)
      } else {
        alert("Bút AI bị tắc mực: " + (data.error || "Không rõ"))
      }
    } catch (e: any) {
      alert("Đứt nét vẽ: " + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleGenerateAiImage() {
    if (!name.trim()) {
      alert("Viết cái tên SP vô trước để AI nó còn biết vẽ cái gì nhen.")
      return
    }
    setAiImageLoading(true)
    try {
      const res = await fetch('/api/admin/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name,
          location: origin || "Bắc Ninh",
          requirements: aiImageRequirements,
          aspectRatio: aiAspectRatio
        })
      })
      const data = await res.json()
      if (data.image) {
        setShowAiImageForm(false)
        const resObj = await fetch(data.image)
        const blob = await resObj.blob()
        const file = new File([blob], `ai-poster-${Date.now()}.png`, { type: blob.type })
        setRepresentativeFile(file)
      } else {
        alert("Có lỗi từ phòng tranh AI: " + (data.error || "Không thể tạo ảnh"))
      }
    } catch (e: any) {
      alert("Đứt nét vẽ: " + e.message)
    } finally {
      setAiImageLoading(false)
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
            onClick={() => setShowAiContentForm(!showAiContentForm)}
            className="text-brand-green font-semibold hover:bg-brand-green/10 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-sm flex items-center gap-2"
          >
             ✨ Trợ lý Nội dung AI
          </button>
        </div>
        
        {showAiContentForm && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-4 space-y-5">
            <h4 className="text-slate-800 font-bold mb-2">Cung cấp thông tin để AI viết mô tả</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Chủ thể OCOP (Tên HTX/DN)</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" value={aiSubject} onChange={e => setAiSubject(e.target.value)} placeholder="Ví dụ: HTX Nông nghiệp sạch..." />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Chứng nhận OCOP</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none cursor-pointer" value={aiCertification} onChange={e => setAiCertification(e.target.value)}>
                  <option value="">Chưa rõ / Chưa có</option>
                  <option value="3 sao">OCOP 3 sao</option>
                  <option value="4 sao">OCOP 4 sao</option>
                  <option value="5 sao">OCOP 5 sao</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Giai thoại / Văn hóa địa phương</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none min-h-[60px] resize-y" value={aiLocalStory} onChange={e => setAiLocalStory(e.target.value)} placeholder="Gắn với truyền thuyết hoặc lịch sử địa phương..." />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">* Điểm nổi bật</label>
              <textarea className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none min-h-[80px] resize-y" value={aiHighlights} onChange={e => setAiHighlights(e.target.value)} placeholder="Quy trình, chất lượng, thành phần..." />
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                type="button" 
                onClick={handleGenerateAiContent}
                disabled={aiLoading}
                className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:bg-slate-300"
              >
                {aiLoading ? 'Đang phân tích...' : 'Bắt đầu tạo nội dung'}
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

      {/* Ảnh đại diện */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold uppercase tracking-wider text-slate-500 block">Hình ảnh đại diện</label>
          <button
            type="button"
            onClick={() => setShowAiImageForm(!showAiImageForm)}
            className="text-blue-600 font-semibold hover:bg-blue-50 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full transition-colors text-sm flex items-center gap-2"
          >
            🎨 Tạo Ảnh = AI
          </button>
        </div>
        
        {showAiImageForm && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-4 space-y-5">
            <h4 className="text-slate-800 font-bold mb-2">Thông số cho Poster Quảng Cáo</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Tỉ lệ ảnh</label>
                <div className="flex gap-4 p-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input type="radio" value="1:1" checked={aiAspectRatio === "1:1"} onChange={e => setAiAspectRatio(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" /> Vuông (1:1)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                    <input type="radio" value="16:9" checked={aiAspectRatio === "16:9"} onChange={e => setAiAspectRatio(e.target.value)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300" /> Ngang (16:9)
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Yêu cầu đặc biệt</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" value={aiImageRequirements} onChange={e => setAiImageRequirements(e.target.value)} placeholder="Phông nền gỗ truyền thống..." />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                type="button" 
                onClick={handleGenerateAiImage}
                disabled={aiImageLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:bg-slate-300"
              >
                {aiImageLoading ? 'Đang xử lý hình ảnh...' : 'Bắt đầu tạo thiết kế'}
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
