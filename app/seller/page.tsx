"use client"

import Link from "next/link"
import ProductForm from "../../components/admin/ProductForm"

export default function SellerDashboard() {
  return (
    <div className="container-custom py-12 max-w-3xl">
      <h1 className="font-heading text-5xl font-bold text-slate-800 mb-8 border-b-4 border-slate-800 border-dashed pb-4 inline-block">Sổ Tay Cơ Sở Sản Xuất</h1>

      <div className="flex gap-6 mb-12 text-xl font-heading bg-amber-50 sketch-card p-4 mx-2">
        <Link href="/seller/products" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>📦</span> Xem kho hàng của tôi
        </Link>
      </div>

      <div className="sketch-card bg-white p-8 relative -rotate-1">
        <div className="absolute top-0 right-4 transform -translate-y-1/2">
           <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-slate-800 shadow-[2px_2px_0px_#000]"></div>
        </div>
        <h2 className="font-heading text-4xl font-bold text-slate-800 mb-6">Thêm mặt hàng mới</h2>
        <ProductForm apiPrefix="/api/seller" />
      </div>
    </div>
  )
}
