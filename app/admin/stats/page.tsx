"use client"

import { useEffect, useState } from "react"
import { categories } from "../../../components/admin/ProductForm"
import Link from "next/link"

interface StatRow {
  id: number
  name: string
  category_id: number
  view_count: number
}

/**
 * Component AdminStatsPage (Hand-drawn)
 */
export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatRow[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="container-custom py-12 max-w-4xl">
      <h1 className="font-heading text-5xl font-bold text-slate-800 mb-8 border-b-4 border-slate-800 border-dashed pb-4 inline-block">Bảng Vàng Đám Đông 🏆</h1>
      
      <div className="flex gap-6 mb-12 text-xl font-heading bg-amber-50 sketch-card p-4 mx-2">
        <Link href="/admin" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>↪</span> Về Bàn Làm Việc
        </Link>
        <Link href="/admin/products" className="text-slate-800 hover:text-brand-green transition-transform hover:-translate-y-1 block">
          <span>📦</span> Xem toàn bộ Sổ tay
        </Link>
      </div>

      {loading && (
        <div className="text-center py-10 font-heading text-3xl animate-bounce">
          Đang tính nhẩm...
        </div>
      )}
      
      {!loading && stats.length === 0 && (
         <div className="sketch-card bg-slate-50 p-8 text-center text-slate-600">
           Chưa có ai thèm ngó ngàng.
         </div>
      )}

      {!loading && stats.length > 0 && (
        <div className="sketch-card bg-white p-4 overflow-hidden -rotate-1">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b-4 border-slate-800 font-heading text-2xl text-slate-900 uppercase">
                <th className="py-4 px-4 w-28 text-center border-r-2 border-slate-800 border-dashed">Hạng</th>
                <th className="py-4 px-4">Tên Kiệt Tác</th>
                <th className="py-4 px-4 w-40 text-center">Lượt Liếc 👁</th>
              </tr>
            </thead>
            <tbody className="text-2xl">
              {stats.map((r, index) => (
                <tr key={r.id} className="hover:bg-slate-100 transition-colors border-b-2 border-slate-300 border-dashed">
                   <td className="py-4 px-4 text-center border-r-2 border-slate-800 border-dashed font-heading text-3xl text-brand-red font-bold">
                    {index + 1}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800">
                    {r.name}
                    <div className="text-base font-serif text-slate-500 mt-1">*{categories.find((c) => c.id === r.category_id)?.name}*</div>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-900">
                    <span className="bg-yellow-200 border-2 border-slate-800 px-3 py-1 shadow-[2px_2px_0px_#333]" style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
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