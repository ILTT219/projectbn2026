"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface User {
  id: number
  email: string
  role: string
  is_approved: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/all', { credentials: 'same-origin' })
      const data = await res.json()
      setUsers(data.data || [])
    } catch (err) {
      console.error('fetch users error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (user: User) => {
    if (!confirm(`⚠️ Bạn có chắc chắn muốn XOÁ VĨNH VIỄN tài khoản "${user.email}"?\n\nHành động này sẽ xoá toàn bộ dữ liệu liên quan (sản phẩm, đánh giá, hình ảnh...) và KHÔNG THỂ HOÀN TÁC.`)) return

    setDeletingId(user.id)
    try {
      const res = await fetch('/api/admin/users/all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
        credentials: 'same-origin',
      })
      const result = await res.json()
      if (res.ok) {
        fetchUsers()
      } else {
        alert(result.error || 'Xoá tài khoản thất bại')
      }
    } catch (err) {
      alert('Lỗi kết nối')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleLabel = (role: string) => {
    switch (role) {
      case 'seller': return 'Người bán'
      case 'user': return 'Người dùng'
      case 'buyer': return 'Người mua'
      default: return role
    }
  }

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'seller': return 'bg-blue-100 text-blue-700'
      case 'user': return 'bg-slate-100 text-slate-600'
      case 'buyer': return 'bg-purple-100 text-purple-700'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl md:text-3xl font-bold text-slate-900 mb-2">
          Quản lý Tài khoản
        </h1>
        <p className="text-slate-500 font-sans text-sm">Xem, tìm kiếm và quản lý tất cả tài khoản người dùng trong hệ thống</p>
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/admin" className="bg-white border text-sm border-slate-200 text-slate-600 hover:text-brand-green hover:border-brand-green/30 font-semibold transition-all flex items-center gap-2 py-2.5 px-5 rounded-xl shadow-sm">
          <span>↩</span> Quay lại Tổng quan
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-slate-800 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'seller', 'user', 'buyer'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterRole === role
                  ? 'bg-brand-green text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'Tất cả' : roleLabel(role)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{users.length}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Tổng tài khoản</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'seller').length}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Người bán</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_approved).length}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Đã duyệt</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{users.filter(u => !u.is_approved).length}</div>
          <div className="text-xs text-slate-500 font-semibold mt-1">Chờ duyệt</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 md:p-6 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <svg className="w-8 h-8 animate-spin text-brand-green mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải danh sách...
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-sm tracking-wider text-slate-500 uppercase rounded-lg">
                  <th className="py-4 px-4 text-center rounded-l-lg">ID</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Vai trò</th>
                  <th className="py-4 px-4 text-center">Trạng thái</th>
                  <th className="py-4 px-4">Ngày tạo</th>
                  <th className="py-4 px-4 text-right rounded-r-lg">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-base">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 text-center text-slate-500 font-bold">{u.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{u.email}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${roleBadgeClass(u.role)}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {u.is_approved ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Đã duyệt</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">Chờ duyệt</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {new Date(u.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id}
                        className="text-red-500 hover:text-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === u.id ? 'Đang xoá...' : '🗑️ Xoá'}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xl font-medium">
                      {search || filterRole !== 'all' ? 'Không tìm thấy tài khoản phù hợp.' : 'Chưa có tài khoản nào trong hệ thống.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
