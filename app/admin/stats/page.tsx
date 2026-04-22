"use client"

import { useEffect, useState } from "react"
import { categories } from "../../../components/admin/ProductForm"
import Link from "next/link"

interface StatRow {
  id: number
  name: string
  category_id: number
  view_count: number
  avgRating: number
  reviewCount: number
}

/**
 * Component AdminStatsPage
 */
export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatRow[]>([])
  const [loading, setLoading] = useState(true)
  
  // Lọc và Sắp xếp
  const [minRating, setMinRating] = useState<number>(0)
  const [sortField, setSortField] = useState<'view_count' | 'avgRating' | 'reviewCount'>('view_count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'same-origin' })
      const data = await res.json()
      setStats(data.data || [])
    } catch (err) {
      console.error('fetch stats error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload: any) => {
        setStats((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.new.id)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], ...payload.new }
            return updated.sort((a, b) => b.view_count - a.view_count)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl md:text-3xl font-bold text-slate-900 mb-2">
          Thống kê truy cập 🏆
        </h1>
        <p className="text-slate-500 font-sans text-sm">Xem và theo dõi bảng xếp hạng sản phẩm OCOP được quan tâm nhiều nhất</p>
      </header>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/admin" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>↩</span> Quay lại Tổng quan
        </Link>
        <Link href="/admin/products" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>📦</span> Hệ sinh thái Sản Phẩm
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10 font-heading text-2xl animate-pulse text-brand-green">
          Đang tải dữ liệu...
        </div>
      )}
      
      {!loading && stats.length === 0 && (
         <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 text-lg">
           Chưa có dữ liệu thống kê lượt xem.
         </div>
      )}

      {!loading && stats.length > 0 && (
        <>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Lọc sao:</span>
            <select 
              value={minRating} 
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
            >
              <option value={0}>Tất cả mức sao</option>
              <option value={3}>Từ 3 sao trở lên</option>
              <option value={4}>Từ 4 sao trở lên</option>
              <option value={4.5}>Từ 4.5 sao trở lên</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600">Sắp xếp theo:</span>
            <select 
              value={sortField} 
              onChange={(e) => setSortField(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-green/30 outline-none"
            >
              <option value="view_count">Lượt truy cập</option>
              <option value="avgRating">Đánh giá sao</option>
              <option value="reviewCount">Lượt đánh giá</option>
            </select>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
             <button 
               onClick={() => setSortOrder('asc')} 
               className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'asc' ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               Tăng dần
             </button>
             <button 
               onClick={() => setSortOrder('desc')} 
               className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'desc' ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               Giảm dần
             </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-sm tracking-wider text-slate-500 uppercase">
                <th className="py-5 px-6 w-24 text-center font-bold">Hạng</th>
                <th className="py-5 px-6 font-bold">Tên Sản Phẩm</th>
                <th className="py-5 px-6 w-32 text-center font-bold">Đánh giá</th>
                <th className="py-5 px-6 w-48 text-center font-bold">Lượt Xem 👁</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-lg">
              {stats
                .filter((r) => r.avgRating >= minRating)
                .sort((a, b) => {
                  let diff = a[sortField] - b[sortField];
                  return sortOrder === 'asc' ? diff : -diff;
                })
                .map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                   <td className="py-6 px-6 text-center font-heading text-2xl font-bold text-slate-400 group-hover:text-brand-green transition-colors">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </td>
                  <td className="py-6 px-6">
                    <div className="font-bold text-slate-800 text-xl">{r.name}</div>
                    <div className="text-sm font-semibold text-brand-gold mt-1 bg-brand-gold-light/10 inline-block px-3 py-1 rounded-full">
                      {categories.find((c) => c.id === r.category_id)?.name}
                    </div>
                  </td>
                  <td className="py-6 px-6 text-center">
                    {r.reviewCount > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-amber-500 font-bold text-xl flex items-center gap-1">
                          {r.avgRating} <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </span>
                        <span className="text-xs text-slate-400">({r.reviewCount} đánh giá)</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">Chưa có</span>
                    )}
                  </td>
                  <td className="py-6 px-6 text-center">
                    <span className="font-bold text-2xl text-slate-700 bg-slate-100 px-4 py-2 rounded-xl group-hover:bg-brand-green group-hover:text-white transition-colors">
                      {r.view_count || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}