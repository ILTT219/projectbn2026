"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Alert {
  id: number
  review_id: number
  product_id: number
  alert_type: string
  severity: string
  message: string
  keywords_found: string | null
  suggested_response: string | null
  is_resolved: boolean
  created_at: string
  product_reviews?: {
    reviewer_name: string
    rating: number
    comment: string | null
    created_at: string
  }
  products?: {
    name: string
    img: string | null
  }
}

interface Stats {
  total: number
  unresolved: number
  critical: number
  warning: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return `${Math.floor(days / 30)} tháng trước`
}

export default function ReputationPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, unresolved: 0, critical: 0, warning: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical' | 'resolved'>('unresolved')
  const [resolving, setResolving] = useState<number | null>(null)
  const [needsMigration, setNeedsMigration] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchAlerts = async () => {
    setLoading(true)
    setNeedsMigration(false)
    setErrorMessage('')
    try {
      let params = ''
      if (filter === 'unresolved') params = '?resolved=false'
      else if (filter === 'critical') params = '?resolved=false&severity=critical'
      else if (filter === 'resolved') params = '?resolved=true'

      const res = await fetch(`/api/admin/alerts${params}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setAlerts(data.alerts || [])
        setStats(data.stats || { total: 0, unresolved: 0, critical: 0, warning: 0 })
      } else {
        if (data.needsMigration) {
          setNeedsMigration(true)
        }
        setErrorMessage(data.error || 'Lỗi tải dữ liệu')
      }
    } catch {
      setErrorMessage('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [filter])

  const resolveAlert = async (alertId: number) => {
    setResolving(alertId)
    try {
      const res = await fetch('/api/admin/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alert_id: alertId })
      })
      if (res.ok) fetchAlerts()
    } catch {} finally {
      setResolving(null)
    }
  }

  const severityConfig: Record<string, { icon: string; bg: string; border: string; text: string; label: string }> = {
    critical: { icon: '🔴', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', label: 'Khẩn cấp' },
    warning: { icon: '🟡', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', label: 'Cảnh báo' },
    info: { icon: '🟢', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', label: 'Thông tin' },
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              🛡️ Quản lý Uy tín Thương hiệu
            </h1>
            <p className="text-slate-500 text-sm">Giám sát tự động đánh giá khách hàng & cảnh báo sớm</p>
          </div>
          <Link href="/admin" className="ocop-btn-alt text-xs py-2 px-4">
            ← Quay lại Dashboard
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">📊</div>
            <div>
              <p className="font-heading font-bold text-2xl text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Tổng cảnh báo</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg">⚠️</div>
            <div>
              <p className="font-heading font-bold text-2xl text-amber-600">{stats.unresolved}</p>
              <p className="text-xs text-slate-500">Chưa xử lý</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🔴</div>
            <div>
              <p className="font-heading font-bold text-2xl text-red-600">{stats.critical}</p>
              <p className="text-xs text-slate-500">Khẩn cấp</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-lg">🟡</div>
            <div>
              <p className="font-heading font-bold text-2xl text-amber-600">{stats.warning}</p>
              <p className="text-xs text-slate-500">Cảnh báo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm w-fit">
        {([
          { key: 'unresolved' as const, label: 'Chưa xử lý', badge: stats.unresolved },
          { key: 'critical' as const, label: '🔴 Khẩn cấp', badge: stats.critical },
          { key: 'all' as const, label: 'Tất cả', badge: stats.total },
          { key: 'resolved' as const, label: '✅ Đã xử lý', badge: 0 },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              filter === tab.key
                ? 'bg-brand-green text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <svg className="w-8 h-8 animate-spin text-brand-green mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-slate-500">Đang tải dữ liệu...</p>
        </div>
      ) : needsMigration ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
          <h3 className="font-heading font-bold text-slate-800 text-xl mb-3">Chưa cấu hình Cơ sở dữ liệu</h3>
          <p className="text-slate-600 mb-6">{errorMessage}</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left inline-block max-w-full overflow-x-auto text-sm font-mono text-slate-700">
            <p className="mb-2 font-bold text-slate-500">Copy đoạn SQL sau và chạy trong Supabase SQL Editor:</p>
            <pre><code>{`-- 1. Thêm cột sentiment vào bảng product_reviews
ALTER TABLE "public"."product_reviews" 
  ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'pending';

-- 2. Bảng cảnh báo cho admin
CREATE TABLE IF NOT EXISTS "public"."admin_alerts" (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES "public"."product_reviews"(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES "public"."products"(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'negative_review',
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    message TEXT NOT NULL,
    keywords_found TEXT,
    suggested_response TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES "public"."users"(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Xem toàn bộ script trong file scripts/sentiment-migration.sql)`}</code></pre>
          </div>
          <div className="mt-6">
            <button onClick={fetchAlerts} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2.5 px-6 rounded-xl transition-all">
              Đã chạy Migration, Tải lại trang
            </button>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
          <p className="text-red-500 font-semibold">{errorMessage}</p>
          <button onClick={fetchAlerts} className="mt-4 text-sm text-brand-green font-semibold">Thử lại</button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
          <h3 className="font-heading font-bold text-slate-600 text-lg mb-2">Không có cảnh báo nào</h3>
          <p className="text-sm text-slate-400">Hệ thống đang hoạt động tốt, chưa phát hiện đánh giá tiêu cực.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.info
            const review = Array.isArray(alert.product_reviews) ? alert.product_reviews[0] : alert.product_reviews
            const product = Array.isArray(alert.products) ? alert.products[0] : alert.products

            return (
              <div key={alert.id} className={`rounded-2xl border shadow-sm overflow-hidden ${alert.is_resolved ? 'bg-slate-50 border-slate-200 opacity-70' : `bg-white ${config.border}`}`}>
                {/* Alert Header */}
                <div className={`px-6 py-3 ${config.bg} border-b ${config.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
                    <span className="text-xs text-slate-400">• {timeAgo(alert.created_at)}</span>
                  </div>
                  {!alert.is_resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolving === alert.id}
                      className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {resolving === alert.id ? 'Đang xử lý...' : '✓ Đã xử lý'}
                    </button>
                  )}
                  {alert.is_resolved && (
                    <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">✅ Đã giải quyết</span>
                  )}
                </div>

                <div className="p-6">
                  {/* Product & Review Info */}
                  <div className="flex gap-4 mb-4">
                    {product?.img ? (
                      <img src={product.img} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-2xl shrink-0">🌾</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-slate-900 text-base">
                        {product?.name || `Sản phẩm #${alert.product_id}`}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{alert.message}</p>
                      {alert.keywords_found && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {alert.keywords_found.split(', ').map((kw, i) => (
                            <span key={i} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  {review && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {(review.reviewer_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-slate-800">{review.reviewer_name}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                      )}
                    </div>
                  )}

                  {/* AI Suggested Response */}
                  {alert.suggested_response && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/60">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          🤖 Gợi ý phản hồi (AI)
                        </h4>
                        <button
                          onClick={() => { navigator.clipboard.writeText(alert.suggested_response || ''); }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <p className="text-sm text-emerald-800 leading-relaxed">{alert.suggested_response}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/products/${alert.product_id}`}
                      className="text-xs text-brand-green hover:text-brand-green-dark font-semibold flex items-center gap-1"
                    >
                      🔗 Xem sản phẩm ↗
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
