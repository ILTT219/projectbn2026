"use client"

import { useEffect, useState } from "react"
import ProductForm, { Product, categories } from "../../../components/admin/ProductForm"
import Link from "next/link"

/**
 * Component AdminProductsPage
 * Hiển thị và quản lý danh sách sản phẩm. Cho phép sửa, xoá sản phẩm trực tiếp.
 */
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

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const channel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
        } else if (payload.eventType === 'INSERT' && payload.new) {
          setProducts(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDelete = async (id?: number) => {
    if (!id) return
    if (!confirm('Chắc chắn muốn xóa mảnh nháp này? Ảnh đính kèm cũng sẽ bị xé bỏ vĩnh viễn.')) return
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        fetchProducts()
      } else {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Xoá sản phẩm thất bại')
      }
    } catch (err) {
      console.error('delete error', err)
      alert('Xoá sản phẩm thất bại')
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
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl md:text-3xl font-bold text-slate-900 mb-2">
          Hệ sinh thái Sản phẩm
        </h1>
        <p className="text-slate-500 font-sans text-sm">Quản lý kho tàng sản phẩm OCOP toàn hệ thống</p>
      </header>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/admin" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
           <span>↩</span> Quay lại Tổng quan
        </Link>
        <Link href="/admin/stats" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>📊</span> Bảng Thống Kê
        </Link>
      </div>

      {editing && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-12 relative max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <span>✏️</span> Đang sửa: <span className="text-brand-green">{editing.name}</span>
          </h2>
          <ProductForm
            apiPrefix="/api/admin"
            initialProduct={editing}
            submitLabel="Lưu Cập Nhật"
            onSuccess={onFormSuccess}
          />
          <button
            className="absolute top-4 right-6 text-slate-400 hover:text-red-500 font-heading text-xl transition-colors"
            onClick={() => setEditing(null)}
          >
            ✕ Đóng
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 md:p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-sm tracking-wider text-slate-500 uppercase rounded-lg">
                <th className="py-4 px-4 text-center rounded-l-lg">Mã</th>
                <th className="py-4 px-4">Tên Sản Phẩm</th>
                <th className="py-4 px-4">Danh Mục</th>
                <th className="py-4 px-4 text-center">Lượt Xem</th>
                <th className="py-4 px-4 text-right rounded-r-lg">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-center text-slate-500 font-bold">{p.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800">{p.name}</td>
                  <td className="py-4 px-4 text-slate-700">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold">
                      {categories.find((c) => c.id === p.category_id)?.name || p.category_id}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-slate-700 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {p.view_count || 0}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right space-x-4">
                    <button 
                      onClick={() => startEdit(p)} 
                      className="text-brand-green hover:text-brand-green-dark transition-colors font-medium"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="text-red-500 hover:text-red-700 transition-colors font-medium"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xl font-medium">
                    Không có sản phẩm nào trong hệ thống.
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
