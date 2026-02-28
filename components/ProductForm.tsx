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
  onSuccess?: () => void
}

export default function ProductForm({
  initialProduct = null,
  submitLabel = "✓ Thêm sản phẩm",
  onSuccess,
}: ProductFormProps) {
  // form state
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

  const repFileInputRef = useRef<HTMLInputElement>(null)
  const prodFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name)
      setCategoryId(initialProduct.category_id.toString())
      setOrigin(initialProduct.origin || "")
      setDescription(initialProduct.description || "")
      setContactAddress(initialProduct.contact_address || "")
      // clear file inputs when switching to edit mode
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
      setMessage("Vui lòng nhập tên sản phẩm và chọn danh mục")
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
        ? `/api/admin/products/${initialProduct!.id}`
        : '/api/admin/products'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      console.log('product submit response', method, res.status, data)

      if (!res.ok) {
        setMessage(data.error || 'Lỗi khi lưu sản phẩm')
      } else {
        setMessage(isEditing ? '✓ Cập nhật sản phẩm thành công!' : '✓ Thêm sản phẩm thành công!')
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

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    maxWidth: 600,
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  }

  const labelStyle = {
    fontWeight: 600,
    color: '#2f6f3e',
    fontSize: 14,
  }

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    fontFamily: 'inherit',
  }

  const textareaStyle = {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    fontFamily: 'inherit',
    minHeight: 100,
    resize: 'vertical' as const,
  }

  const buttonStyle = {
    padding: '12px 20px',
    borderRadius: 6,
    border: 'none',
    background: 'linear-gradient(90deg, #1b5e20, #2e7d32)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {/* Tên sản phẩm */}
      <div style={fieldStyle}>
        <label style={labelStyle}>* TÊN SẢN PHẨM</label>
        <input
          type="text"
          placeholder="Nhập tên sản phẩm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          required
        />
      </div>

      {/* Danh mục */}
      <div style={fieldStyle}>
        <label style={labelStyle}>* DANH MỤC</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={inputStyle}
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
      <div style={fieldStyle}>
        <label style={labelStyle}>XUẤT XỨ</label>
        <input
          type="text"
          placeholder="Ví dụ: Bắc Ninh, Việt Nam"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Mô tả đặc điểm */}
      <div style={fieldStyle}>
        <label style={labelStyle}>MÔ TẢ VỀ ĐẶC ĐIỂM SẢN PHẨM</label>
        <Link
          href="https://ai.studio/apps/b359236e-1a52-4bff-b51f-5dad3e8ab2f0"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginBottom: 24, display: 'inline-block', color: '#2e7d32' }}
        >
          Tạo mô tả đặc điểm bằng AI
        </Link>
        <textarea
          placeholder="Mô tả chi tiết về đặc điểm, tính chất, lợi ích của sản phẩm..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={textareaStyle}
        />
      </div>

      {/* Ảnh đại diện */}
      <div style={fieldStyle}>
        <label style={labelStyle}>ẢNH ĐẠI DIỆN</label>
        <Link
          href="https://ai.studio/apps/80592c7c-676c-4ea4-9785-d2a6a2fd55b0"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginBottom: 24, display: 'inline-block', color: '#2e7d32' }}
        >
          Tạo ảnh đại diện bằng AI
        </Link>
        <input
          ref={repFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setRepresentativeFile(e.target.files?.[0] || null)}
          style={inputStyle}
        />
        {representativeFile && (
          <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
            ✓ Chọn: {representativeFile.name}
          </div>
        )}
      </div>

      {/* Hình ảnh sản phẩm */}
      <div style={fieldStyle}>
        <label style={labelStyle}>
          HÌNH ẢNH THẬT CỦA SẢN PHẨM (giữ Ctrl/Shift hoặc Command để chọn nhiều ảnh)
        </label>
        <input
          ref={prodFileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setProductFiles(Array.from(e.target.files || []))}
          style={inputStyle}
        />
        {productFiles.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              ✓ Chọn {productFiles.length} ảnh
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {productFiles.map((file, idx) => (
                <div key={idx} style={{ fontSize: 12, color: '#555' }}>
                  {file.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Địa chỉ liên hệ */}
      <div style={fieldStyle}>
        <label style={labelStyle}>ĐỊA CHỈ LIÊN HỆ</label>
        <textarea
          placeholder="Địa chỉ liên hệ của nhà sản xuất/bán hàng"
          value={contactAddress}
          onChange={(e) => setContactAddress(e.target.value)}
          style={{ ...textareaStyle, minHeight: 70 }}
        />
      </div>

      {/* Nút submit */}
      <button type="submit" style={buttonStyle} disabled={loading}>
        {loading ? 'Đang xử lý...' : submitLabel}
      </button>

      {message && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 6,
            background: message.includes('Lỗi') ? '#ffebee' : '#e8f5e9',
            color: message.includes('Lỗi') ? '#c62828' : '#2e7d32',
            border: `1px solid ${
              message.includes('Lỗi') ? '#ef5350' : '#66bb6a'
            }`,
          }}
        >
          {message}
        </div>
      )}
    </form>
  )
}
