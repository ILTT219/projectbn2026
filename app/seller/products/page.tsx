"use client"

import { useEffect, useState } from "react"
import ProductForm, { Product, categories } from "../../../components/admin/ProductForm"
import Link from "next/link"

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/seller/products', { credentials: 'same-origin' })
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
    if (!confirm('Chắc chắn muốn xóa mảnh nháp này? Ảnh đính kèm cũng sẽ bị xé bỏ vĩnh viễn.')) return
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        fetchProducts()
      } else {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Tẩy bị lỗi lầm =))')
      }
    } catch (err) {
      alert('Tẩy bị lỗi lầm =))')
    }
  }

  const startEdit = (prod: Product) => {
    setEditing(prod)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onFormSuccess = () => {
    setEditing(null)
    fetchProducts()
  }

  return (
    <div className="container-custom py-12">
      <h1 className="font-heading text-5xl font-bold text-slate-800 mb-8 border-b-4 border-slate-800 border-dashed pb-4 inline-block">Kho Hàng Của Xưởng</h1>
      
      <div className="flex gap-6 mb-8 text-xl font-heading bg-amber-50 sketch-card p-4 mx-2">
        <Link href="/seller" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>+</span> Về gian chính (Nhập thêm)
        </Link>
      </div>

      {editing && (
        <div className="sketch-card bg-brand-gold-light/20 p-8 mb-12 relative rotate-1 max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <span>✏️</span> Đang sửa: <span className="underline decoration-wavy">{editing.name}</span>
          </h2>
          <ProductForm
            apiPrefix="/api/seller"
            initialProduct={editing}
            submitLabel="✓ Lưu vết mực"
            onSuccess={onFormSuccess}
          />
          <button
            className="absolute top-4 right-6 text-slate-800 hover:text-red-600 font-heading text-2xl transition-transform hover:scale-125 hover:rotate-12"
            onClick={() => setEditing(null)}
          >
            ✕ Gấp lại
          </button>
        </div>
      )}

      <div className="sketch-card bg-white p-2 md:p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b-4 border-slate-800 text-xl font-heading text-slate-900 uppercase">
                <th className="py-4 px-4 text-center">Mã</th>
                <th className="py-4 px-4">Tên</th>
                <th className="py-4 px-4">Giỏ hàng</th>
                <th className="py-4 px-4 text-right">Làm gì?</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-300 divide-dashed text-xl">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-100 transition-colors">
                  <td className="py-4 px-4 text-center text-slate-500 font-bold font-serif">{p.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800">{p.name}</td>
                  <td className="py-4 px-4 text-slate-700">
                    <span className="border-2 border-slate-800 bg-slate-50 px-2 py-0.5" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                      {categories.find((c) => c.id === p.category_id)?.name || p.category_id}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-4 font-heading text-2xl">
                    <button 
                      onClick={() => startEdit(p)} 
                      className="text-brand-green hover:text-brand-green-dark hover:-translate-y-1 transform transition-all inline-block"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="text-red-600 hover:text-red-800 hover:-translate-y-1 transform transition-all inline-block"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 font-heading text-3xl">
                    Kho trống không, gió lùa lạnh ngắt...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
