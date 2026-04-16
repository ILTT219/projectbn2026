"use client"

import ProductForm from "../../components/admin/ProductForm"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="container-custom py-12 max-w-3xl">
      <h1 className="font-heading text-5xl font-bold text-slate-800 mb-8 border-b-4 border-slate-800 border-dashed pb-4 inline-block">Bàn Làm Việc - Thêm đồ mới</h1>
      <div className="mb-8 flex gap-6 text-xl font-heading bg-amber-50 sketch-card p-4 mx-2">
        <Link href="/admin/products" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>↪</span> Lật lại danh sách
        </Link>
        <Link href="/admin/stats" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>📊</span> Nhìn lén lượt truy cập
        </Link>
      </div>
      
      <div className="sketch-card bg-white p-8">
        <ProductForm />
      </div>
    </div>
  )
}
