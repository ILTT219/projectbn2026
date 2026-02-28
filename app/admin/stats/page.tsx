"use client"

import { useEffect, useState } from "react"
import { categories } from "../../../components/ProductForm"

interface StatRow {
  id: number
  name: string
  category_id: number
  view_count: number
}

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

    // realtime subscribe for view_count updates
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'products',
      }, (payload: any) => {
        // update row in stats or insert
        setStats((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.new.id)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = { ...updated[idx], ...payload.new }
            // resort by view_count
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
    <div style={{ padding: '0 20px' }}>
      <h1 style={{ color: '#2f6f3e', marginBottom: 30 }}>Thống kê lượt truy cập</h1>
      <p style={{ marginBottom: 20 }}>
        <a href="/admin" style={{ color: '#2e7d32', textDecoration: 'underline' }}>
          ↪ Trang quản trị
        </a>
      </p>

      {loading && <div>Đang tải dữ liệu...</div>}
      {!loading && stats.length === 0 && <div>Chưa có sản phẩm nào.</div>}

      {!loading && stats.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Tên</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Danh mục</th>
              <th style={{ border: '1px solid #ccc', padding: 8 }}>Lượt xem</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((r) => (
              <tr key={r.id}>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.id}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.name}</td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>
                  {categories.find((c) => c.id === r.category_id)?.name || r.category_id}
                </td>
                <td style={{ border: '1px solid #ccc', padding: 8 }}>{r.view_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}