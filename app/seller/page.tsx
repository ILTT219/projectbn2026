"use client"

import Link from "next/link"
import ProductForm from "../../components/admin/ProductForm"
import NotificationBell from "../../components/layout/NotificationBell"

export default function SellerDashboard() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom max-w-4xl">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Bảng điều khiển Nhà cung cấp</h1>
            <p className="text-slate-500 font-sans text-sm">Quản lý kho hàng và hồ sơ chuẩn OCOP của bạn</p>
          </div>
          <NotificationBell />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/seller/products" className="bg-white p-6 rounded-2xl border border-brand-green/20 shadow-sm hover:shadow-brand-green/10 hover:border-brand-green transition-all group flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-brand-green rounded-xl flex flex-col items-center justify-center shrink-0 group-hover:bg-brand-green group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-800 text-lg group-hover:text-brand-green transition-colors">Kho hàng của tôi</h3>
              <p className="font-sans text-sm text-slate-500 mt-1">Danh sách sản phẩm đang niêm yết</p>
            </div>
          </Link>

          <Link href="/seller/stats" className="bg-white p-6 rounded-2xl border border-amber-200/40 shadow-sm hover:shadow-amber-100/30 hover:border-amber-400 transition-all group flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-800 text-lg group-hover:text-amber-600 transition-colors">Báo cáo lượt xem</h3>
              <p className="font-sans text-sm text-slate-500 mt-1">Thống kê truy cập sản phẩm</p>
            </div>
          </Link>
        </div>

        <div className="mb-4 mt-8 flex items-center gap-3">
           <div className="bg-brand-green text-white p-2.5 rounded-xl shadow-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
           </div>
           <div>
             <h2 className="font-heading text-xl font-bold text-slate-800">Niêm yết sản phẩm mới</h2>
             <p className="text-sm text-slate-500">Khai báo thông tin chi tiết cho sản phẩm OCOP</p>
           </div>
        </div>
        
        <ProductForm apiPrefix="/api/seller" />
      </div>
    </div>
  )
}
