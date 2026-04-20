"use client"

import { useEffect, useState } from "react"
import ProductForm, { Product, categories } from "../../../components/admin/ProductForm"
import NotificationBell from "../../../components/layout/NotificationBell"
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
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl md:text-3xl font-bold text-slate-900 mb-2">Kho hàng của tôi</h1>
          <p className="text-slate-500 font-sans text-sm">Quản lý và cập nhật các sản phẩm đang niêm yết</p>
        </div>
        <NotificationBell />
      </header>
      
      <div className="flex mb-8">
        <Link href="/seller" className="bg-brand-green text-white hover:bg-brand-green-dark font-semibold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2">
          <span>+</span> Nhập sản phẩm mới
        </Link>
      </div>

      {editing && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-12 relative max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <span>✏️</span> Đang sửa: <span className="text-brand-green">{editing.name}</span>
          </h2>
          <ProductForm
            apiPrefix="/api/seller"
            initialProduct={editing}
            submitLabel="Lưu Thông Tin"
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
              <tr className="border-b border-slate-200 text-sm tracking-wider text-slate-500 uppercase bg-slate-50 rounded-lg">
                <th className="py-4 px-4 text-center rounded-l-lg">Mã</th>
                <th className="py-4 px-4">Tên</th>
                <th className="py-4 px-4">Nhóm Sản Phẩm</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-4 text-right rounded-r-lg">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-base">
              {products.map((p) => {
                let statusBadge = null;
                if (p.status === 'approved') {
                  statusBadge = <span className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full text-xs">Đã hiển thị</span>;
                } else if (p.status === 'rejected') {
                  statusBadge = <span className="bg-red-100 text-red-700 font-semibold px-3 py-1 rounded-full text-xs">Bị từ chối</span>;
                } else {
                  statusBadge = <span className="bg-yellow-100 text-yellow-700 font-semibold px-3 py-1 rounded-full text-xs">Đang chờ duyệt</span>;
                }

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 text-center text-slate-500 font-bold">{p.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{p.name}</div>
                      {p.status === 'rejected' && p.rejection_reason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 max-w-sm">
                          <strong>Lý do từ chối:</strong> {p.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {categories.find((c) => c.id === p.category_id)?.name || p.category_id}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {statusBadge}
                    </td>
                    <td className="py-4 px-4 text-right space-x-4">
                      <button 
                        onClick={() => startEdit(p)} 
                        className="text-brand-green hover:text-brand-green-dark transition-colors font-medium cursor-pointer relative z-10"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors font-medium cursor-pointer relative z-10"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                )
              })}
              
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-xl font-medium">
                    Bạn chưa có sản phẩm nào trong kho.
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
