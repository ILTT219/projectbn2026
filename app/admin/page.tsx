"use client"

import ProductForm from "../../components/ProductForm"

export default function AdminPage() {
  return (
    <div style={{ padding: "40px 20px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ color: "#2f6f3e", marginBottom: 30 }}>Quản trị - Thêm sản phẩm</h1>
      <p style={{ marginBottom: 20 }}>
        <a href="/admin/products" style={{ color: '#2e7d32', textDecoration: 'underline', marginRight: 20 }}>
          ↪ Quay lại danh sách sản phẩm
        </a>
        <a href="/admin/stats" style={{ color: '#2e7d32', textDecoration: 'underline' }}>
          📊 Xem thống kê lượt truy cập
        </a>
      </p>
      <ProductForm />
    </div>
  )
}