"use client"

import { useEffect, useState } from "react"
import ProductForm, { Product, categories } from "../../../components/ProductForm"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { credentials: 'same-origin' })
      const data = await res.json()
      setProducts(data.data || [])
    } catch (err) {
      console.error('fetch products error', err)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        fetchProducts()
      } else {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Xóa thất bại')
      }
    } catch (err) {
      console.error('delete error', err)
      alert('Xóa thất bại')
    }
  }

  const startEdit = (prod: Product) => {
    setEditing(prod)
  }

  const onFormSuccess = () => {
    setEditing(null)
    fetchProducts()
  }

  return (
    <div style={{ padding: '0 20px' }}>
      <h1 style={{ color: '#2f6f3e', marginBottom: 30 }}>Quản trị - Quản lý sản phẩm</h1>
      <p style={{ marginBottom: 20 }}>
        <a href="/admin" style={{ color: '#2e7d32', textDecoration: 'underline' }}>
          ↪ Thêm sản phẩm mới
        </a>
      </p>

      {editing && (
        <div style={{ marginBottom: 40 }}>
          <h2>Chỉnh sửa sản phẩm</h2>
          <ProductForm
            initialProduct={editing}
            submitLabel="✓ Cập nhật sản phẩm"
            onSuccess={onFormSuccess}
          />
          <button
            style={{ marginTop: 12 }}
            onClick={() => setEditing(null)}
          >
            Hủy chỉnh sửa
          </button>
        </div>
      )}

      <h2>Danh sách sản phẩm</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Tên</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Danh mục</th>
            <th style={{ border: '1px solid #ccc', padding: 8 }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{p.id}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>{p.name}</td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>
                {categories.find((c) => c.id === p.category_id)?.name || p.category_id}
              </td>
              <td style={{ border: '1px solid #ccc', padding: 8 }}>
                <button onClick={() => startEdit(p)} style={{ marginRight: 8 }}>
                  Sửa
                </button>
                <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
