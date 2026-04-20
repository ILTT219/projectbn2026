"use client"

import { useEffect, useState } from "react"
import { categories } from "../../../components/admin/ProductForm"
import Link from "next/link"
import NotificationBell from "../../../components/layout/NotificationBell"

interface StatRow {
  id: number
  name: string
  category_id: number
  view_count: number
  status?: string
  img?: string
}

interface Summary {
  totalViews: number
  totalProducts: number
  approvedProducts: number
}

export default function SellerStatsPage() {
  const [stats, setStats] = useState<StatRow[]>([])
  const [summary, setSummary] = useState<Summary>({ totalViews: 0, totalProducts: 0, approvedProducts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/seller/stats', { credentials: 'same-origin' })
        const data = await res.json()
        setStats(data.data || [])
        if (data.summary) setSummary(data.summary)
      } catch (err) {
        console.error('fetch stats error', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Báo cáo lượt truy cập</h1>
          <p className="text-slate-500 font-sans text-sm">Thống kê chi tiết về hiệu suất sản phẩm của bạn</p>
        </div>
        <NotificationBell />
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/seller" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>↩</span> Quay lại Dashboard
        </Link>
        <Link href="/seller/products" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>📦</span> Kho hàng
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng lượt xem</p>
              <p className="text-2xl font-bold text-slate-800">{summary.totalViews.toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-brand-green rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-slate-800">{summary.totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đã duyệt</p>
              <p className="text-2xl font-bold text-slate-800">{summary.approvedProducts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking Table */}
      {loading ? (
        <div className="text-center py-10 text-brand-green animate-pulse font-heading text-lg">Đang tải dữ liệu...</div>
      ) : stats.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 text-lg">
          Chưa có dữ liệu thống kê. Hãy niêm yết sản phẩm đầu tiên!
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs tracking-wider text-slate-500 uppercase">
                <th className="py-4 px-5 w-16 text-center">Hạng</th>
                <th className="py-4 px-5">Sản phẩm</th>
                <th className="py-4 px-5">Danh mục</th>
                <th className="py-4 px-5 text-center">Trạng thái</th>
                <th className="py-4 px-5 text-center">Lượt xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {stats.map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-5 text-center font-heading text-lg font-bold text-slate-400 group-hover:text-brand-green transition-colors">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {r.img && (
                        <img src={r.img} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                      {categories.find((c) => c.id === r.category_id)?.name || 'Khác'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {r.status === 'approved' ? (
                      <span className="bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full text-xs">Đang hiển thị</span>
                    ) : r.status === 'rejected' ? (
                      <span className="bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full text-xs">Bị từ chối</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-1 rounded-full text-xs">Chờ duyệt</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <span className="font-bold text-lg text-slate-700 bg-slate-100 px-3 py-1 rounded-xl group-hover:bg-brand-green group-hover:text-white transition-colors">
                      {r.view_count || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
