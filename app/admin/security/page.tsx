"use client"

import { useState, useEffect } from 'react'

interface BlockedIP {
  id: number
  ip_address: string
  reason: string
  blocked_at: string
  blocked_until: string | null
  is_permanent: boolean
}

interface SuspiciousIP {
  ip_address: string
  total_attempts: number
  failed_attempts: number
  success_attempts: number
  unique_emails: string[]
  email_count: number
  last_attempt: string
  is_suspicious: boolean
}

export default function AdminSecurityPage() {
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([])
  const [suspiciousIps, setSuspiciousIps] = useState<SuspiciousIP[]>([])
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'suspicious' | 'blocked'>('suspicious')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Manual block form
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockIp, setBlockIp] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockDuration, setBlockDuration] = useState('24')
  const [blockPermanent, setBlockPermanent] = useState(false)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/security', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setBlockedIps(data.blocked_ips || [])
        setSuspiciousIps(data.suspicious_ips || [])
        setTotalAttempts(data.total_attempts_48h || 0)
      }
    } catch (err) {
      console.error('Error fetching security data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleBlock = async (ip: string, reason?: string) => {
    setActionLoading(ip)
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block',
          ip_address: ip,
          reason: reason || 'Chặn thủ công bởi admin',
          duration_hours: 24,
          is_permanent: false,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        fetchData()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblock = async (ip: string) => {
    setActionLoading(ip)
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock', ip_address: ip }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        fetchData()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading('manual')
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block',
          ip_address: blockIp,
          reason: blockReason || 'Chặn thủ công bởi admin',
          duration_hours: parseInt(blockDuration),
          is_permanent: blockPermanent,
        }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setShowBlockForm(false)
        setBlockIp('')
        setBlockReason('')
        fetchData()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setActionLoading(null)
    }
  }

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-slate-500 font-sans">Đang tải dữ liệu bảo mật...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🛡️</span>
            Trung tâm Bảo mật
          </h1>
          <p className="text-sm text-slate-500 font-sans mt-1">Giám sát và quản lý an ninh hệ thống</p>
        </div>
        <button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="ocop-btn gap-2 text-sm !bg-red-600 hover:!bg-red-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          Chặn IP thủ công
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-xl border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ocop-card p-5 border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-500 font-sans uppercase tracking-wider mb-1">Lượt đăng nhập (48h)</p>
          <p className="font-heading text-3xl font-bold text-slate-900">{totalAttempts}</p>
        </div>
        <div className="ocop-card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-500 font-sans uppercase tracking-wider mb-1">IP Khả nghi</p>
          <p className="font-heading text-3xl font-bold text-amber-600">{suspiciousIps.length}</p>
        </div>
        <div className="ocop-card p-5 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-500 font-sans uppercase tracking-wider mb-1">IP Bị chặn</p>
          <p className="font-heading text-3xl font-bold text-red-600">{blockedIps.length}</p>
        </div>
      </div>

      {/* Manual Block Form */}
      {showBlockForm && (
        <div className="ocop-card p-6 border-2 border-red-100">
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            🚫 Chặn IP thủ công
          </h3>
          <form onSubmit={handleManualBlock} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 font-heading">Địa chỉ IP *</label>
              <input
                type="text"
                value={blockIp}
                onChange={(e) => setBlockIp(e.target.value)}
                required
                placeholder="192.168.1.1"
                className="ocop-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 font-heading">Lý do</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Hành vi đáng ngờ..."
                className="ocop-input"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 font-heading">Thời hạn (giờ)</label>
              <input
                type="number"
                value={blockDuration}
                onChange={(e) => setBlockDuration(e.target.value)}
                disabled={blockPermanent}
                min="1"
                className="ocop-input disabled:opacity-50"
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockPermanent}
                  onChange={(e) => setBlockPermanent(e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm font-medium text-red-700">Chặn vĩnh viễn</span>
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowBlockForm(false)} className="ocop-btn-alt">Hủy</button>
              <button type="submit" disabled={actionLoading === 'manual'} className="ocop-btn !bg-red-600 hover:!bg-red-700">
                {actionLoading === 'manual' ? 'Đang xử lý...' : 'Chặn IP'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('suspicious')}
          className={`flex-1 py-2.5 px-4 text-sm font-heading font-semibold rounded-lg transition-all ${
            activeTab === 'suspicious' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚠️ IP Khả nghi ({suspiciousIps.length})
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex-1 py-2.5 px-4 text-sm font-heading font-semibold rounded-lg transition-all ${
            activeTab === 'blocked' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          🚫 IP Bị chặn ({blockedIps.length})
        </button>
      </div>

      {/* Suspicious IPs Table */}
      {activeTab === 'suspicious' && (
        <div className="ocop-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Tổng</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Thất bại</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Tài khoản</th>
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Email thử</th>
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Lần cuối</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {suspiciousIps.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">Không có IP khả nghi 🎉</td></tr>
                ) : (
                  suspiciousIps.map((ip) => (
                    <tr key={ip.ip_address} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <code className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">{ip.ip_address}</code>
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-semibold text-slate-700">{ip.total_attempts}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          ip.failed_attempts >= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ip.failed_attempts}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          ip.email_count >= 10 ? 'bg-red-100 text-red-700' : ip.email_count >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ip.email_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={ip.unique_emails.join(', ')}>
                        {ip.unique_emails.slice(0, 3).join(', ')}
                        {ip.unique_emails.length > 3 && <span className="text-slate-400"> +{ip.unique_emails.length - 3}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(ip.last_attempt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleBlock(ip.ip_address, `Nghi ngờ: ${ip.failed_attempts} fails, ${ip.email_count} emails`)}
                          disabled={actionLoading === ip.ip_address}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === ip.ip_address ? '...' : 'Chặn'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blocked IPs Table */}
      {activeTab === 'blocked' && (
        <div className="ocop-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Lý do</th>
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Thời điểm</th>
                  <th className="text-left py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Hết hạn</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Loại</th>
                  <th className="text-center py-3 px-4 text-xs font-heading font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {blockedIps.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm text-slate-400">Chưa có IP nào bị chặn</td></tr>
                ) : (
                  blockedIps.map((ip) => (
                    <tr key={ip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <code className="text-sm font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded">{ip.ip_address}</code>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 max-w-[300px]">
                        <p className="truncate" title={ip.reason}>{ip.reason}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {new Date(ip.blocked_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {ip.is_permanent ? '—' : (ip.blocked_until ? new Date(ip.blocked_until).toLocaleString('vi-VN') : '—')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          ip.is_permanent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ip.is_permanent ? 'Vĩnh viễn' : 'Tạm thời'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleUnblock(ip.ip_address)}
                          disabled={actionLoading === ip.ip_address}
                          className="text-xs font-semibold text-brand-green hover:text-brand-green-dark bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === ip.ip_address ? '...' : 'Gỡ chặn'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security Rules Info */}
      <div className="ocop-card p-6">
        <h3 className="font-heading text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          📋 Quy tắc tự động
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 bg-amber-50/50 rounded-xl p-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 text-sm">⚡</div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Chống Brute Force</p>
              <p className="text-xs text-slate-500 mt-0.5">≥5 lần thất bại / 15 phút → Block 30 phút</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-red-50/50 rounded-xl p-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0 text-sm">🤖</div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Chống Credential Stuffing</p>
              <p className="text-xs text-slate-500 mt-0.5">≥10 tài khoản / 30 giây → Block vĩnh viễn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
