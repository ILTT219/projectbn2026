"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"

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
  const [existingImages, setExistingImages] = useState<{ id?: number, image_url: string }[]>([])
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
  const [aiReferenceFiles, setAiReferenceFiles] = useState<File[]>([])
  const aiRefInputRef = useRef<HTMLInputElement>(null)
  const [aiHistory, setAiHistory] = useState<string[]>([])
  const [aiHistoryIdx, setAiHistoryIdx] = useState(-1)
  const [imageWarning, setImageWarning] = useState("")
  const [aiRefWarning, setAiRefWarning] = useState("")
  const [aiRefValidating, setAiRefValidating] = useState(false)

  // Kiểm tra chất lượng ảnh tư liệu: kích thước, độ phân giải, độ mờ
  const validateAndAddRefImages = async (files: File[]) => {
    setAiRefWarning("")
    setAiRefValidating(true)
    const validFiles: File[] = []

    for (const file of files) {
      // 1. Kiểm tra kích thước file (< 50KB → quá nhỏ/mờ)
      if (file.size < 50000) {
        setAiRefWarning(`❌ Ảnh "${file.name}" quá nhỏ (${(file.size/1024).toFixed(0)}KB). Cần ảnh rõ nét ≥ 50KB.`)
        setAiRefValidating(false)
        return
      }

      // 2. Kiểm tra độ phân giải (< 300x300 → quá mờ)
      try {
        const valid = await new Promise<boolean>((resolve) => {
          const img = new Image()
          img.onload = () => {
            if (img.width < 300 || img.height < 300) {
              setAiRefWarning(`❌ Ảnh "${file.name}" quá nhỏ (${img.width}x${img.height}px). Cần ảnh ≥ 300x300px.`)
              resolve(false)
              return
            }

            // 3. Kiểm tra độ mờ bằng Laplacian variance (canvas)
            try {
              const canvas = document.createElement('canvas')
              const size = 200 // resize nhỏ để tính nhanh
              canvas.width = size
              canvas.height = size
              const ctx = canvas.getContext('2d')!
              ctx.drawImage(img, 0, 0, size, size)
              const imageData = ctx.getImageData(0, 0, size, size)
              const data = imageData.data

              // Chuyển sang grayscale và tính Laplacian variance
              const gray: number[] = []
              for (let i = 0; i < data.length; i += 4) {
                gray.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2])
              }

              let laplacianSum = 0
              let count = 0
              for (let y = 1; y < size - 1; y++) {
                for (let x = 1; x < size - 1; x++) {
                  const idx = y * size + x
                  const lap = gray[idx-size] + gray[idx+size] + gray[idx-1] + gray[idx+1] - 4 * gray[idx]
                  laplacianSum += lap * lap
                  count++
                }
              }
              const variance = laplacianSum / count

              // Ngưỡng: < 50 → quá mờ
              if (variance < 50) {
                setAiRefWarning(`❌ Ảnh "${file.name}" bị mờ. Vui lòng chọn ảnh rõ nét hơn.`)
                resolve(false)
                return
              }
            } catch { /* canvas error — skip blur check */ }

            resolve(true)
          }
          img.onerror = () => {
            setAiRefWarning(`❌ Không thể đọc file "${file.name}". Vui lòng chọn ảnh khác.`)
            resolve(false)
          }
          img.src = URL.createObjectURL(file)
        })
        if (valid) validFiles.push(file)
        else { setAiRefValidating(false); return }
      } catch {
        setAiRefWarning(`❌ Lỗi kiểm tra ảnh "${file.name}".`)
        setAiRefValidating(false)
        return
      }
    }

    setAiReferenceFiles(prev => [...prev, ...validFiles].slice(0, 2))
    setAiRefValidating(false)
  }

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

      if (initialProduct.id) {
        supabase
          .from('images')
          .select('id, image_url')
          .eq('product_id', initialProduct.id)
          .then(({ data }) => setExistingImages(data || []))
      }
    } else {
      setExistingImages([])
    }
  }, [initialProduct])

  const openContentModal = () => {
    setGeneratedContent("")
    setShowContentModal(true)
  }

  const openImageModal = () => {
    setGeneratedImgBase64("")
    setAiReferenceFiles([])
    setAiHistory([])
    setAiHistoryIdx(-1)
    if (aiRefInputRef.current) aiRefInputRef.current.value = ""
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
      let res: Response
      if (aiReferenceFiles.length > 0) {
        const formData = new FormData()
        formData.append('productName', name)
        formData.append('highlights', name)
        formData.append('requirements', aiRequirements)
        formData.append('location', origin)
        formData.append('aspectRatio', aiImageSize)
        formData.append('referenceImage1', aiReferenceFiles[0])
        if (aiReferenceFiles.length > 1) formData.append('referenceImage2', aiReferenceFiles[1])
        res = await fetch(`${apiPrefix}/generate-image`, { method: 'POST', body: formData })
      } else {
        res = await fetch(`${apiPrefix}/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: name, highlights: name, requirements: aiRequirements, location: origin, aspectRatio: aiImageSize })
        })
      }
      const data = await res.json()
      if (data.image) {
        setGeneratedImgBase64(data.image)
        setAiHistory(prev => { const next = [...prev, data.image]; setAiHistoryIdx(next.length - 1); return next; })
        try {
          const resObj = await fetch(data.image)
          const blob = await resObj.blob()
          const file = new File([blob], `ai-avatar-${Date.now()}.png`, { type: 'image/png' })
          setRepresentativeFile(file)
        } catch (e) { console.error("Failed to parse base64 to file", e) }
      } else {
        alert(data.error || "Tạo ảnh lỗi.")
      }
    } catch (err) {
      alert("Lỗi khi gọi hệ thống AI Image.")
    } finally {
      setAiGenerating(false)
    }
  }

  // Kiểm tra chất lượng ảnh (kích thước & có phải ảnh bao bì không)
  const validateProductImages = () => {
    setImageWarning("")
    const allFiles = [...(representativeFile ? [representativeFile] : []), ...productFiles]
    if (allFiles.length === 0) {
      setImageWarning("⚠️ Cần ít nhất 1 hình ảnh bao bì sản phẩm.")
      return false
    }
    for (const file of allFiles) {
      if (file.size < 10000) {
        setImageWarning(`⚠️ Ảnh "${file.name}" có kích thước quá nhỏ (${(file.size/1024).toFixed(0)}KB). Ảnh có thể bị mờ, vui lòng chọn ảnh rõ nét hơn.`)
        return false
      }
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !categoryId) {
      setMessage("Vui lòng nhập tên và danh mục sản phẩm.")
      return
    }

    if (!validateProductImages()) return

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

        {existingImages.length > 0 && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 block">Hình ảnh phụ hiện tại ({existingImages.length}):</div>
            <div className="flex gap-3 flex-wrap">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {productFiles.length > 0 && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 block">Đã chọn thêm {productFiles.length} hình ảnh mới:</div>
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

      {imageWarning && (
        <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-xl p-4 text-sm font-semibold flex items-start gap-2">
          <span className="text-lg leading-none">📸</span>
          <div>
            <div>{imageWarning}</div>
            <p className="text-xs font-normal text-amber-600 mt-1">Hình ảnh bao bì giúp khách hàng nhận diện sản phẩm tốt hơn. Ảnh rõ nét ≥ 100KB.</p>
          </div>
        </div>
      )}

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

                <div className="mt-2 flex flex-col gap-3">
                  <a 
                    href="https://aistudio.google.com/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0?showPreview=true&showAssistant=true" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full bg-[#f4f7fe] hover:bg-[#eaeffb] text-[#1a73e8] text-sm font-bold py-3 px-6 rounded-xl border border-[#d6e2fb] transition-all flex justify-center items-center gap-2 text-center"
                  >
                    AI hỗ trợ từ Google AI Studio ↗
                  </a>
                  <button
                    type="button"
                    onClick={generateContent}
                    disabled={aiGenerating}
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {aiGenerating ? (
                      <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang soạn thảo...</>
                    ) : (<><span>✨</span> Tạo nội dung ngay<span className="ml-1">›</span></>)}
                  </button>
                </div>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== AI IMAGE MODAL (Enhanced) ========== */}
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
                  <h3 className="font-heading font-bold text-slate-800 text-lg">Tạo ảnh sản phẩm bằng AI</h3>
                  <p className="text-xs text-slate-500">Sản phẩm: <span className="font-semibold text-slate-700">{name || 'Chưa có tên'}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setShowImageModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">&times;</button>
            </div>

            {/* Body: Two Columns */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left: Controls */}
              <div className="md:w-[48%] p-6 overflow-y-auto border-r border-slate-100 flex flex-col gap-4">
                {/* Yêu cầu */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">📝 Mô tả phong cách ảnh</label>
                  <textarea placeholder="VD: Nền gỗ, ánh sáng ấm, phong cách tối giản..." value={aiRequirements} onChange={e => setAiRequirements(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-slate-800 text-sm min-h-[70px] resize-y" />
                </div>

                {/* Kích thước */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">📐 Kích thước</label>
                  <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    <button type="button" onClick={() => setAiImageSize('1:1')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${aiImageSize === '1:1' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Vuông (1:1)</button>
                    <button type="button" onClick={() => setAiImageSize('16:9')} className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${aiImageSize === '16:9' ? 'bg-brand-green text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Ngang (16:9)</button>
                  </div>
                </div>

                {/* Ảnh tư liệu */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block flex justify-between">
                    <span>📷 Ảnh bao bì / tư liệu (tối đa 2)</span>
                    {aiReferenceFiles.length > 0 && <button type="button" onClick={() => { setAiReferenceFiles([]); setAiRefWarning(""); if(aiRefInputRef.current) aiRefInputRef.current.value=""; }} className="text-[10px] text-red-500 hover:underline">Xoá</button>}
                  </label>
                  <input type="file" accept="image/*" multiple ref={aiRefInputRef} onChange={e => { const f = Array.from(e.target.files||[]); if(f.length) validateAndAddRefImages(f); }} className="hidden" />
                  <button type="button" onClick={() => aiRefInputRef.current?.click()} disabled={aiRefValidating} className="w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-500 font-medium py-2.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {aiRefValidating ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang kiểm tra...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg> Tải ảnh lên...</>
                    )}
                  </button>
                  {aiRefWarning && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-700 font-medium flex items-start gap-1.5">
                      <span className="text-sm leading-none">⚠️</span>
                      <div>
                        <div>{aiRefWarning}</div>
                        <p className="text-[10px] text-amber-500 mt-0.5">Ảnh cần rõ nét, ≥300x300px, ≥50KB.</p>
                      </div>
                    </div>
                  )}
                  {aiReferenceFiles.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {aiReferenceFiles.map((file, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-300 bg-white">
                          <img src={URL.createObjectURL(file)} alt="Ref" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-[8px] text-white text-center py-0.5 font-bold">✓ OK</div>
                          <button type="button" onClick={() => setAiReferenceFiles(prev => prev.filter((_,i) => i!==idx))} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl text-[10px]">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">AI chỉ thay đổi nền & ánh sáng, giữ nguyên 100% sản phẩm gốc.</p>
                </div>

                {/* Nút tạo */}
                <button type="button" onClick={generateImage} disabled={aiGenerating || !name} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-green/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                  {aiGenerating ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang tạo...</>
                  ) : (<><span>✨</span> {aiHistory.length > 0 ? 'Tạo lại phiên bản mới' : 'Bắt đầu tạo ảnh'}</>)}
                </button>

                {/* Lịch sử & so sánh */}
                {aiHistory.length > 1 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="text-xs font-bold text-blue-700 mb-2">🔄 So sánh các phiên bản ({aiHistory.length} ảnh)</div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {aiHistory.map((img, idx) => (
                        <button key={idx} type="button" onClick={() => { setAiHistoryIdx(idx); setGeneratedImgBase64(img); }} className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${aiHistoryIdx === idx ? 'border-brand-green shadow-md scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
                          <img src={img} alt={`V${idx+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Preview */}
              <div className="md:w-[52%] bg-slate-50 p-6 overflow-y-auto flex flex-col">
                {!generatedImgBase64 && !aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-200/60 rounded-2xl flex items-center justify-center mb-5">
                      <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 className="font-heading font-bold text-slate-500 text-lg mb-2">Chưa có ảnh</h4>
                    <p className="text-sm text-slate-400 max-w-xs">Điền thông tin bên trái và nhấn &ldquo;Bắt đầu tạo ảnh&rdquo;.</p>
                  </div>
                ) : aiGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <svg className="w-10 h-10 animate-spin text-brand-green mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <h4 className="font-heading font-bold text-slate-600 text-lg">AI đang tạo ảnh...</h4>
                    <p className="text-sm text-slate-400 mt-1">Khoảng 15-45 giây</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 gap-4">
                    {/* Before / After */}
                    {aiReferenceFiles.length > 0 && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 text-center">Ảnh gốc</div>
                          <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center aspect-square">
                            <img src={URL.createObjectURL(aiReferenceFiles[0])} alt="Original" className="max-w-full max-h-full rounded-lg object-contain" />
                          </div>
                        </div>
                        <div className="flex items-center text-slate-300 text-2xl font-light pt-5">→</div>
                        <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-brand-green mb-1.5 text-center">AI đã tạo</div>
                          <div className="bg-white border border-brand-green/30 rounded-xl p-2 flex items-center justify-center aspect-square">
                            <img src={generatedImgBase64} alt="AI" className="max-w-full max-h-full rounded-lg object-contain" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full preview nếu không có ảnh gốc */}
                    {aiReferenceFiles.length === 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-brand-green mb-1.5">
                          Phiên bản {aiHistoryIdx + 1}{aiHistory.length > 1 ? ` / ${aiHistory.length}` : ''}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-center">
                          <img src={generatedImgBase64} alt="AI Generated" className="max-w-full max-h-[45vh] rounded-lg shadow-sm object-contain" />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-auto">
                      <button type="button" onClick={applyGeneratedImage} className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 rounded-xl transition-all text-sm">✓ Sử dụng ảnh này</button>
                      <button type="button" onClick={generateImage} disabled={aiGenerating} className="bg-white border border-slate-200 hover:border-brand-green text-slate-600 hover:text-brand-green font-semibold py-2.5 px-4 rounded-xl transition-all text-sm">↻ Tạo lại</button>
                    </div>
                    {aiHistory.length > 0 && <p className="text-[10px] text-slate-400 text-center">Không ưng? Nhấn &ldquo;Tạo lại&rdquo; hoặc chỉnh mô tả bên trái để thử phong cách khác.</p>}
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

