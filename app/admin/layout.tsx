export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <img src="https://raw.githubusercontent.com/ILTT219/Image-storage/c674f7253196749a55fbdd18d6b540a4cdc5e1f2/12.png" alt="OCOP Logo" className="w-8 h-8 object-cover rounded mr-3 shadow-md bg-white p-0.5" />
          <h2 className="font-heading font-bold text-lg text-white tracking-wide">Quản trị OCOP</h2>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <a href="/admin" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            Khái quát (Dashboard)
          </a>
          <a href="/admin/products" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between">
            <span>📦 Sản phẩm</span>
          </a>
          <a href="/admin/users" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between">
            <span>👥 Tài khoản</span>
          </a>
          <a href="/admin/stats" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
            📊 Thống kê truy cập
          </a>
          <a href="/admin/ai-studio" className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-brand-gold/10 text-brand-gold hover:bg-brand-gold hover:text-white transition-colors flex items-center justify-between">
            <span>✨ AI Studio</span>
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <a
            href="/api/auth/logout"
            className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-800/50 hover:bg-brand-red/90 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            Đăng xuất
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm shrink-0">
          <h1 className="font-heading font-semibold text-slate-800">Hệ thống Điều hành Tổng</h1>
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
