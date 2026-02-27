"use client"

import { useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

const categories = [
  { id: 1, name: "Lương thực" },
  { id: 2, name: "Thực phẩm" },
  { id: 3, name: "Dược liệu" },
  { id: 4, name: "Thủ công mỹ nghệ" },
  { id: 5, name: "Hàng tiêu dùng" },
  { id: 6, name: "Đồ uống" },
]

export default function AdminPage() {
  // core form state (unchanged)
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("1")
  const [origin, setOrigin] = useState("")
  const [description, setDescription] = useState("")
  const [representativeFile, setRepresentativeFile] = useState<File | null>(null)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [contactAddress, setContactAddress] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const repFileInputRef = useRef<HTMLInputElement>(null)
  const prodFileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !categoryId) {
      setMessage("Vui lòng nhập tên sản phẩm và chọn danh mục")
      return
    }

    setLoading(true)

    try {
      // 1. Thêm sản phẩm vào database
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([
          {
            name: name.trim(),
            category_id: parseInt(categoryId),
            price: 1,
          },
        ])
        .select()

      if (productError) {
        setMessage("Lỗi khi thêm sản phẩm: " + productError.message)
        setLoading(false)
        return
      }

      const productId = productData?.[0]?.id
      console.log("Product created with ID:", productId)

      if (!productId) {
        setMessage("Lỗi: Không lấy được ID sản phẩm")
        setLoading(false)
        return
      }

      let representativeImageUrl = ""

      // 2. Upload ảnh đại diện (lưu vào cột img của products)
      if (representativeFile) {
        const fileName = `${productId}-representative-${Date.now()}-${representativeFile.name}`
        console.log("Uploading representative image:", fileName)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, representativeFile)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          setMessage("Lỗi upload ảnh đại diện: " + uploadError.message)
        } else {
          representativeImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
          console.log("Uploaded image URL:", representativeImageUrl)
          
          // Cập nhật cột img của sản phẩm
          const { error: updateError } = await supabase
            .from("products")
            .update({ img: representativeImageUrl })
            .eq("id", productId)

          if (updateError) {
            console.error("Update product error:", updateError)
            setMessage("Lỗi cập nhật ảnh vào products: " + updateError.message)
          } else {
            console.log("Product image updated successfully")
          }
        }
      }

      // 3. Upload các ảnh thực tế vào bảng images
      for (const file of productFiles) {
        const fileName = `${productId}-${Date.now()}-${file.name}`
        console.log("Uploading product image:", fileName)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(`products/${fileName}`, file)

        if (uploadError) {
          console.error("Upload error:", uploadError)
        } else {
          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${uploadData.path}`
          console.log("Inserting image to DB:", imageUrl)
          
          const { error: insertError } = await supabase.from("images").insert([
            {
              product_id: productId,
              image_url: imageUrl,
            },
          ])

          if (insertError) {
            console.error("Insert image error:", insertError)
          } else {
            console.log("Image inserted successfully")
          }
        }
      }

      setMessage("✓ Thêm sản phẩm thành công!")
      setName("")
      setCategoryId("1")
      setOrigin("")
      setDescription("")
      setRepresentativeFile(null)
      setProductFiles([])
      setContactAddress("")
      if (repFileInputRef.current) repFileInputRef.current.value = ""
      if (prodFileInputRef.current) prodFileInputRef.current.value = ""
    } catch (err: any) {
      console.error("Catch error:", err)
      setMessage("Lỗi: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    maxWidth: 600,
  }

  const fieldStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  }

  const labelStyle = {
    fontWeight: 600,
    color: "#2f6f3e",
    fontSize: 14,
  }

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    fontFamily: "inherit",
  }

  const textareaStyle = {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
    fontFamily: "inherit",
    minHeight: 100,
    resize: "vertical" as const,
  }

  const buttonStyle = {
    padding: "12px 20px",
    borderRadius: 6,
    border: "none",
    background: "linear-gradient(90deg, #1b5e20, #2e7d32)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: "#2f6f3e", marginBottom: 30 }}>Quản trị - Thêm sản phẩm</h1>

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
          <input
            ref={repFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setRepresentativeFile(e.target.files?.[0] || null)}
            style={inputStyle}
          />
          {representativeFile && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
              ✓ Chọn: {representativeFile.name}
            </div>
          )}
        </div>

        {/* Hình ảnh sản phẩm */}
        <div style={fieldStyle}>
          <label style={labelStyle}>HÌNH ẢNH THẬT CỦA SẢN PHẨM</label>
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
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                ✓ Chọn {productFiles.length} ảnh
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {productFiles.slice(0, 5).map((file, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: "#555" }}>
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
        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "✓ Thêm sản phẩm"}
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 6,
            background: message.includes("Lỗi") ? "#ffebee" : "#e8f5e9",
            color: message.includes("Lỗi") ? "#c62828" : "#2e7d32",
            border: `1px solid ${message.includes("Lỗi") ? "#ef5350" : "#66bb6a"}`,
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}