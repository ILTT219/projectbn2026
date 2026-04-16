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
  const [aiLoading, setAiLoading] = useState(false)

  // AI Image Form State
  const [showAiImageForm, setShowAiImageForm] = useState(false)
  const [aiImageRequirements, setAiImageRequirements] = useState("")
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
      const res = await fetch('/api/admin/generate-content', { // Admin and Seller both hit Admin generator due to no DB change needed for AI
        method: 'POST',
        body: JSON.stringify({
          productName: name,
          subject: aiSubject,
          location: origin || "Bắc Ninh",
          productGroup: selectedCategory,
          highlights: aiHighlights
        })
      })
      const data = await res.json()
      if (data.description) {
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
      const res = await fetch('/api/admin/generate-image', { // Likewise AI is perfectly fine sharing memory route
        method: 'POST',
        body: JSON.stringify({
          productName: name,
          location: origin || "Bắc Ninh",
          highlights: description || "",
          requirements: aiImageRequirements
        })
      })
      const data = await res.json()
      if (data.image) {
        setShowAiImageForm(false)
        const resObj = await fetch(data.image)
        const blob = await resObj.blob()
        const file = new File([blob], `ai-avatar-\${Date.now()}.png`, { type: blob.type })
        setRepresentativeFile(file)
      } else {
        alert("Có lỗi từ phòng tranh AI: " + (data.error || "Quên cấu hình Gemini API Key chăng?"))
      }
    } catch (e: any) {
      alert("Đứt nét vẽ: " + e.message)
    } finally {
      setAiImageLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full font-serif text-xl border-4 border-slate-900 border-dashed p-6 rounded-3xl bg-transparent">
      
      {/* Tên sản phẩm */}
      <div className="flex flex-col gap-2 relative">
        <label className="font-heading text-2xl text-slate-800 font-bold">* Gọi nó là gì?</label>
        <input
          type="text"
          placeholder="Nhập tên..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sketch-input"
          required
        />
        {/* Wavy underline doodle */}
        <svg className="absolute -bottom-4 right-0 w-24 h-4 text-slate-400 opacity-50" viewBox="0 0 100 20" preserveAspectRatio="none">
           <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Danh mục */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">* Trưng bày ở kệ nào?</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="sketch-input cursor-pointer"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Xuất xứ */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">Quê quán (Xuất xứ)</label>
        <input
          type="text"
          placeholder="Ví dụ: Làng gốm Phù Lãng..."
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="sketch-input"
        />
      </div>

      {/* Mô tả đặc điểm */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">Đôi dòng tâm sự (Mô tả)</label>
        
        <button
          type="button"
          onClick={() => setShowAiContentForm(!showAiContentForm)}
          className="font-heading text-xl text-brand-green border-2 border-brand-green px-4 py-1 self-start transform transition-transform hover:-translate-y-1 bg-green-50 shadow-[2px_2px_0px_#1E3A8A]"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        >
          ✨ Nhờ AI bịa... à nhầm, viết hộ
        </button>
        
        {showAiContentForm && (
          <div className="p-4 bg-brand-green/10 border-2 border-brand-green mt-2 mb-4 relative" style={{ borderRadius: '15px 255px 15px 225px / 255px 15px 225px 15px' }}>
            {/* Draw a pin */}
            <div className="absolute -top-3 left-10 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900 shadow-md"></div>
            
            <p className="mb-4 text-slate-700 italic border-b-2 border-slate-400 border-dashed pb-2">
              Chỉ điểm cho AI, để nó múa phím giùm nè!
            </p>
            <div className="flex flex-col gap-2 mb-3">
              <label className="font-bold text-slate-700">Cha đẻ (Tên HTX/DN)</label>
              <input type="text" className="sketch-input py-2 text-lg" value={aiSubject} onChange={e => setAiSubject(e.target.value)} placeholder="Ví dụ: HTX..." />
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-bold text-slate-700">* Khoe gì nhất?</label>
              <textarea className="sketch-input py-2 text-lg min-h-[80px]" value={aiHighlights} onChange={e => setAiHighlights(e.target.value)} placeholder="Ví dụ: Hữu cơ sạch 100%, thủ công mĩ nghệ..." />
            </div>
            <button 
              type="button" 
              onClick={handleGenerateAiContent}
              disabled={aiLoading}
              className="sketch-btn bg-brand-gold text-slate-900 border-slate-900 text-lg py-1 px-4"
            >
              {aiLoading ? 'Rọt rẹt rọt rẹt... Đang chém.' : 'Ra lệnh!'}
            </button>
          </div>
        )}

        <textarea
          placeholder="Cứ viết tràn ra cũng được..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="sketch-input min-h-[120px]"
        />
      </div>

      {/* Ảnh đại diện */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">Chân dung (Ảnh đại diện)</label>
        
        <button
          type="button"
          onClick={() => setShowAiImageForm(!showAiImageForm)}
          className="font-heading text-xl text-blue-800 border-2 border-blue-800 px-4 py-1 self-start transform transition-transform hover:-translate-y-1 bg-blue-50 shadow-[2px_2px_0px_#1E3A8A]"
          style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
        >
          🎨 Giao AI vẽ luôn chân dung
        </button>
        
        {showAiImageForm && (
          <div className="p-4 bg-blue-50 border-2 border-blue-800 mt-2 mb-4 relative" style={{ borderRadius: '15px 255px 15px 225px / 255px 15px 225px 15px' }}>
            {/* Draw a pin */}
            <div className="absolute -top-3 left-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-md"></div>
            
            <p className="mb-4 text-slate-700 italic border-b-2 border-slate-400 border-dashed pb-2">
              Gemini sẽ đóng vai hoạ sĩ vẽ tranh gốc OCOP.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <label className="font-bold text-slate-700">Yêu cầu đặc biệt (Thêm thắt)</label>
              <input type="text" className="sketch-input py-2 text-lg" value={aiImageRequirements} onChange={e => setAiImageRequirements(e.target.value)} placeholder="Tranh sơn dầu, hay phông nền lụa đỏ..." />
            </div>
            
            <button 
              type="button" 
              onClick={handleGenerateAiImage}
              disabled={aiImageLoading}
              className="sketch-btn bg-blue-600 text-white border-slate-900 text-lg py-1 px-4"
            >
              {aiImageLoading ? 'Họa sĩ đang múa bút...' : 'Vẽ đi bạn êi!'}
            </button>
          </div>
        )}

        <input
          ref={repFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setRepresentativeFile(e.target.files?.[0] || null)}
          className="sketch-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-slate-800 file:text-sm file:font-bold file:bg-amber-100 hover:file:bg-amber-200 file:cursor-pointer p-0 overflow-hidden bg-white"
        />
        {representativeFile && (
           <div className="mt-2 flex items-center gap-4 bg-slate-50 border-2 border-slate-800 p-2 w-max shadow-[3px_3px_0px_rgba(0,0,0,1)]" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            <img 
               src={URL.createObjectURL(representativeFile)} 
               alt="Preview" 
               className="w-16 h-16 object-cover border border-slate-300"
            />
            <div className="font-bold text-slate-700">
               📸 Đã dán ảnh: {representativeFile.name.substring(0,20)}...
            </div>
          </div>
        )}
      </div>

      {/* Hình ảnh sản phẩm */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">
          Rổ ảnh phụ (Giữ Ctrl/Cmd để gom nhiều tấm)
        </label>
        <input
          ref={prodFileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
          className="sketch-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-slate-800 file:text-sm file:font-bold file:bg-amber-100 hover:file:bg-amber-200 file:cursor-pointer p-0 overflow-hidden bg-white"
        />
        {productFiles.length > 0 && (
          <div className="mt-2 text-slate-600 bg-white border-2 border-slate-400 border-dashed p-3 rounded-lg">
            <div className="font-bold mb-2">✓ Túm được {productFiles.length} tấm:</div>
            <div className="flex gap-2 flex-wrap text-sm">
              {productFiles.map((file, idx) => (
                <span key={idx} className="bg-slate-100 px-2 py-1 border border-slate-300 shadow-sm transform -rotate-1">
                  {file.name.substring(0, 10)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Địa chỉ liên hệ */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-2xl text-slate-800 font-bold">Chỗ để tìm chủ xới</label>
        <textarea
          placeholder="Thả địa chỉ/số điện thoại zô đây..."
          value={contactAddress}
          onChange={(e) => setContactAddress(e.target.value)}
          className="sketch-input min-h-[80px]"
        />
      </div>

      {/* Nút submit */}
      <button type="submit" className="sketch-btn mt-4 self-center px-12" disabled={loading}>
        {loading ? 'Đợi xíu...' : submitLabel}
      </button>

      {message && (
        <div className={`mt-4 border-2 border-slate-800 p-4 font-bold ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'} text-center shadow-[4px_4px_0px_#1e1e1e]`} style={{ borderRadius: '15px 255px 15px 225px / 255px 15px 225px 15px' }}>
          {message}
        </div>
      )}
    </form>
  )
}
