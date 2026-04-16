"use client"

import Link from "next/link"
import ProductForm from "../../components/admin/ProductForm"

export default function SellerDashboard() {
  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container-custom max-w-4xl">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Bảng điều khiển Nhà cung cấp</h1>
          <p className="text-slate-500 font-sans text-sm">Quản lý kho hàng và hồ sơ chuẩn OCOP của bạn</p>
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

          <div className="bg-gradient-to-br from-brand-gold-light/20 to-brand-gold/10 p-6 rounded-2xl border border-brand-gold-light/30 shadow-sm flex items-start gap-4 opacity-75 grayscale sepia-0 cursor-not-allowed">
            <div className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-700 text-lg">Báo cáo doanh số</h3>
              <p className="font-sans text-sm text-slate-500 mt-1">Tính năng đang cập nhật...</p>
            </div>
          </div>
        </div>

        <div className="ocop-card p-8 md:p-10 border-t-4 border-t-brand-green">
          <div className="flex items-center gap-3 mb-8">
             <div className="bg-brand-green/10 text-brand-green p-2 rounded-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
             </div>
             <h2 className="font-heading text-xl font-bold text-slate-800">Niêm yết sản phẩm mới</h2>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
             <ProductForm apiPrefix="/api/seller" />
          </div>
        </div>
      </div>
    </div>
  )
}
