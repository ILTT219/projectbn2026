"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const OWNER_EMAIL = 't219t3@gmail.com'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'admin' | 'manage_admins'>('users')
  const [isOwner, setIsOwner] = useState(false)
  
  // States cho Người chờ duyệt
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // States cho Sản phẩm chờ duyệt
  const [pendingProducts, setPendingProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)

  // States cho Tạo QTV
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [adminStatus, setAdminStatus] = useState({ loading: false, error: '', success: '' })

  // States cho Quản lý QTV (chỉ Owner)
  const [adminList, setAdminList] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  // Kiểm tra quyền Owner
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn && data.email === OWNER_EMAIL) {
          setIsOwner(true)
        }
      })
      .catch(() => {})
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users')
      const result = await res.json()
      if (res.ok) setPendingUsers(result.data || [])
    } finally { setLoadingUsers(false) }
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await fetch('/api/admin/products')
      const result = await res.json()
      if (res.ok) setPendingProducts(result.data || [])
    } finally { setLoadingProducts(false) }
  }

  const fetchAdmins = async () => {
    setLoadingAdmins(true)
    try {
      const res = await fetch('/api/admin/manage')
      const result = await res.json()
      if (res.ok) setAdminList(result.data || [])
    } finally { setLoadingAdmins(false) }
  }

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'products') fetchProducts()
    if (activeTab === 'manage_admins') fetchAdmins()
  }, [activeTab])

  const handleApproveUser = async (id: number) => {
    try {
       await fetch('/api/admin/users', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ targetUserId: id })
       })
       fetchUsers()
    } catch(e) {}
  }

  const handleRejectUser = async (id: number) => {
    if (!confirm("Chắc chắn xoá yêu cầu này?")) return;
    try {
       await fetch('/api/admin/users', {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ targetUserId: id })
       })
       fetchUsers()
    } catch(e) {}
  }

  const handleProductAction = async (id: number, action: 'approve' | 'reject', rejectionReason?: string) => {
    if (action === 'reject' && !rejectionReason && !confirm("Từ chối sẽ xoá sản phẩm này. Tiếp tục?")) return;
    try {
       await fetch('/api/admin/products', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ targetProductId: id, action, rejectionReason })
       })
       fetchProducts()
    } catch(e) {}
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminStatus({ loading: true, error: '', success: '' })
    try {
       const res = await fetch('/api/admin/register', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
       })
       const result = await res.json()
       if (res.ok) {
         setAdminStatus({ loading: false, error: '', success: 'Tạo thành công!' })
         setNewAdminEmail(''); setNewAdminPassword('');
       } else {
         setAdminStatus({ loading: false, error: result.error, success: '' })
       }
    } catch(e) {
       setAdminStatus({ loading: false, error: 'Lỗi mạng', success: '' })
    }
  }

  const handleRemoveAdmin = async (id: number, email: string) => {
    if (email === OWNER_EMAIL) return alert('Không thể xoá tài khoản Owner!')
    if (!confirm(`Bạn có chắc muốn xoá QTV ${email}?`)) return
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAdminId: id })
      })
      if (res.ok) fetchAdmins()
    } catch(e) {}
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl md:text-3xl font-bold text-slate-900 mb-2">
          Bảng điều khiển Quản trị
        </h1>
        <p className="text-slate-500 font-sans text-sm">Kiểm duyệt sản phẩm, người dùng và quản lý hệ thống</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
          <button 
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'users' ? 'bg-white text-brand-green shadow border border-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
             onClick={() => setActiveTab('users')}
          >
            Người dùng chờ duyệt ({pendingUsers.length})
          </button>
          <button 
             className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'products' ? 'bg-white text-brand-green shadow border border-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
             onClick={() => setActiveTab('products')}
          >
            Sản phẩm chờ duyệt ({pendingProducts.length})
          </button>

        {/* Chỉ Owner mới thấy các tab quản lý QTV */}
        {isOwner && (
          <>
            <button 
               className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'admin' ? 'bg-white text-brand-green shadow border border-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
               onClick={() => setActiveTab('admin')}
            >
              🔑 Tạo QTV Mới
            </button>
            <button 
               className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'manage_admins' ? 'bg-white text-brand-green shadow border border-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
               onClick={() => setActiveTab('manage_admins')}
            >
              👑 Quản lý QTV
            </button>
          </>
        )}
        </div>

        <div className="p-6 md:p-8 bg-slate-50 min-h-[500px]">
        {/* TAB USERS */}
        {activeTab === 'users' && (
           <div>
             {loadingUsers ? <p>Đang tải...</p> : pendingUsers.length === 0 ? <p className="text-slate-500">Tuyệt vời, không có ai đang chờ duyệt cả!</p> : (
               <div className="flex flex-col gap-4">
                 {pendingUsers.map(u => {
                   const profile = Array.isArray(u.seller_profiles) ? u.seller_profiles[0] : (u.seller_profiles || {});
                   return (
                   <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                     <div>
                       <p className="font-heading font-semibold text-slate-800">{u.email}</p>
                       <span className={`text-xs font-bold px-2 py-1 rounded mt-1 inline-block ${u.role === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                         Vai trò đề nghị: {u.role.toUpperCase()}
                       </span>
                       {u.role === 'seller' && (
                         <div className="mt-2 text-sm text-slate-600 space-y-1">
                           <p><strong>MST:</strong> {profile.tax_id || 'Chưa cập nhật'}</p>
                           <p><strong>ĐKKD:</strong> {profile.business_registration ? <a href={profile.business_registration} target="_blank" className="text-blue-600 underline">Xem giấy tờ</a> : 'Chưa có'}</p>
                           <p><strong>OCOP:</strong> {profile.ocop_certificate ? <a href={profile.ocop_certificate} target="_blank" className="text-blue-600 underline">Xem giấy tờ</a> : 'Chưa có'}</p>
                         </div>
                       )}
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => handleApproveUser(u.id)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors">Duyệt</button>
                       <button onClick={() => handleRejectUser(u.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors">Từ chối (Xoá)</button>
                     </div>
                   </div>
                 )})}
               </div>
             )}
           </div>
        )}

        {/* TAB PRODUCTS */}
        {activeTab === 'products' && (
           <div>
             {loadingProducts ? <p>Đang tải...</p> : pendingProducts.length === 0 ? <p className="text-slate-500">Gian hàng sạch sẽ, chưa có sản phẩm nào cần duyệt.</p> : (
               <div className="flex flex-col gap-4">
                 {pendingProducts.map(p => (
                   <div key={p.id} className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                     <div className="flex gap-4 p-4">
                       {p.img ? (
                         <img src={p.img} alt={p.name} className="w-24 h-24 object-cover rounded-lg border" />
                       ) : (
                         <div className="w-24 h-24 bg-slate-200 flex items-center justify-center rounded-lg text-sm text-slate-400">No Image</div>
                       )}
                       <div className="flex-1">
                         <div className="flex justify-between">
                           <h3 className="font-heading font-bold text-lg">{p.name}</h3>
                           <span className={`text-xs font-bold px-2 py-1 rounded h-fit ${p.status === 'pending_delete' ? 'bg-red-100 text-red-700' : p.status === 'pending_edit' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                             {p.status === 'pending_delete' ? '🗑️ Yêu cầu Xóa' : p.status === 'pending_edit' ? '✏️ Đã chỉnh sửa' : '🆕 Mới tạo đăng ký'}
                           </span>
                         </div>
                         <p className="text-sm text-slate-500 mt-1">Sở hữu bởi: <span className="font-semibold">{p.users?.email || 'N/A'}</span></p>
                         <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.description || 'Không có mô tả'}</p>
                       </div>
                       <div className="flex flex-col gap-2 justify-center pl-4 border-l border-slate-200">
                         <button onClick={() => setPreviewProduct(previewProduct?.id === p.id ? null : p)} className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded transition-colors whitespace-nowrap text-sm">
                           {previewProduct?.id === p.id ? '🔽 Đóng Preview' : '👁️ Xem trước'}
                         </button>
                         <button onClick={() => handleProductAction(p.id, 'approve')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors whitespace-nowrap text-sm">
                           {p.status === 'pending_delete' ? '✓ Đồng ý xoá' : '✓ Duyệt thay đổi'}
                         </button>
                         <button onClick={() => {
                           if (p.status === 'pending_delete') {
                             if (confirm("Từ chối xoá sẽ giữ lại sản phẩm. Tiếp tục?")) {
                               handleProductAction(p.id, 'reject')
                             }
                           } else {
                             const reason = prompt("Nhập lý do từ chối để chủ thể biết và chỉnh sửa:")
                             if (reason !== null) {
                               if (reason.trim() === '') {
                                 alert("Lý do từ chối không được để trống!")
                               } else {
                                 handleProductAction(p.id, 'reject', reason.trim())
                               }
                             }
                           }
                         }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors whitespace-nowrap text-sm">
                           {p.status === 'pending_delete' ? '✕ Giữ lại' : '✕ Từ chối'}
                         </button>
                       </div>
                     </div>

                     {/* Preview Panel */}
                     {previewProduct?.id === p.id && (
                       <div className="border-t border-slate-200 bg-white p-6 animate-in slide-in-from-top duration-200">
                         <h4 className="font-heading font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                           <span>🔍</span> Xem trước nội dung sản phẩm
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Image Preview */}
                           <div className="flex flex-col gap-3">
                             {p.img ? (
                               <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                 <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                               </div>
                             ) : (
                               <div className="aspect-video rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                 Chưa có hình ảnh đại diện
                               </div>
                             )}
                           </div>

                           {/* Info Cards */}
                           <div className="flex flex-col gap-3">
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tên sản phẩm</p>
                               <p className="text-slate-800 font-semibold">{p.name}</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                               <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Danh mục</p>
                               <p className="text-slate-800 font-semibold">
                                 {
                                   {1: 'Lương thực', 2: 'Thực phẩm', 3: 'Dược liệu', 4: 'Thủ công mỹ nghệ', 5: 'Hàng tiêu dùng', 6: 'Đồ uống'}[p.category_id as number] || `Danh mục ${p.category_id}`
                                 }
                               </p>
                             </div>
                             {p.origin && (
                               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                 <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">📍 Xuất xứ</p>
                                 <p className="text-slate-800 font-semibold">{p.origin}</p>
                               </div>
                             )}
                             {p.contact_address && (
                               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                 <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">🏢 Thông tin liên hệ</p>
                                 <p className="text-slate-800 font-semibold">{p.contact_address}</p>
                               </div>
                             )}
                           </div>
                         </div>

                         {/* Description */}
                         {p.description && (
                           <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                             <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">📝 Mô tả sản phẩm</p>
                             <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{p.description}</p>
                           </div>
                         )}

                         {/* Public Preview Link */}
                         {p.status !== 'pending_delete' && (
                           <div className="mt-4 flex">
                             <a
                               href={`/products/${p.id}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 transition-colors"
                             >
                               🔗 Xem trang chi tiết sản phẩm (tab mới) ↗
                             </a>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {/* TAB CREATE ADMIN — Chỉ Owner */}
        {activeTab === 'admin' && isOwner && (
           <div className="max-w-md">
             <div className="flex items-center gap-3 mb-6">
               <span className="text-3xl">👑</span>
               <div>
                 <h2 className="font-heading font-bold text-xl">Kết nạp Quản Trị Viên mới</h2>
                 <p className="text-sm text-slate-500">Chỉ Owner (t219t3) mới có quyền thực hiện</p>
               </div>
             </div>
             <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
               <div>
                 <label className="block text-sm font-semibold mb-1">Email</label>
                 <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required className="ocop-input w-full" />
               </div>
               <div>
                 <label className="block text-sm font-semibold mb-1">Mật khẩu khởi tạo</label>
                 <input type="text" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} required className="ocop-input w-full" />
               </div>
               
               {adminStatus.error && <p className="text-red-500 text-sm font-semibold">{adminStatus.error}</p>}
               {adminStatus.success && <p className="text-green-500 text-sm font-semibold">{adminStatus.success}</p>}

               <button type="submit" disabled={adminStatus.loading} className="ocop-btn py-3 mt-2 font-bold bg-amber-500 text-slate-900 border-amber-600">
                 {adminStatus.loading ? 'Đang tạo...' : 'Kết nạp QTV'}
               </button>
             </form>
           </div>
        )}

        {/* TAB MANAGE ADMINS — Chỉ Owner */}
        {activeTab === 'manage_admins' && isOwner && (
           <div>
             <div className="flex items-center gap-3 mb-6">
               <span className="text-3xl">👑</span>
               <div>
                 <h2 className="font-heading font-bold text-xl">Danh sách Quản Trị Viên</h2>
                 <p className="text-sm text-slate-500">Quản lý và giám sát tất cả QTV trong hệ thống</p>
               </div>
             </div>
             {loadingAdmins ? <p>Đang tải...</p> : adminList.length === 0 ? <p className="text-slate-500">Chưa có QTV nào.</p> : (
               <div className="flex flex-col gap-3">
                 {adminList.map(admin => (
                   <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${admin.email === OWNER_EMAIL ? 'bg-amber-500' : 'bg-slate-600'}`}>
                         {admin.email === OWNER_EMAIL ? '👑' : 'QTV'}
                       </div>
                       <div>
                         <p className="font-heading font-semibold text-slate-800">{admin.email}</p>
                         <span className={`text-xs font-bold px-2 py-1 rounded mt-1 inline-block ${admin.email === OWNER_EMAIL ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                           {admin.email === OWNER_EMAIL ? 'OWNER' : 'ADMIN'}
                         </span>
                       </div>
                     </div>
                     {admin.email !== OWNER_EMAIL && (
                       <button 
                         onClick={() => handleRemoveAdmin(admin.id, admin.email)} 
                         className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                       >
                         Xoá QTV
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}
        </div>
      </div>
    </div>
  )
}