export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          background: '#1e293b',
          color: 'white',
          padding: 20,
        }}
      >
        <h2>Admin</h2>
        <ul style={{ marginTop: 20 }}>
          <li>
            <a href="/admin" style={{ color: 'white', textDecoration: 'none' }}>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/admin/products" style={{ color: 'white', textDecoration: 'none' }}>
              Sản phẩm
            </a>
          </li>
          <li>
            <a href="/admin/stats" style={{ color: 'white', textDecoration: 'none' }}>
              Thống kê truy cập
            </a>
          </li>
        </ul>
        <a
          href="/api/admin/logout"
          style={{
            display: 'inline-block',
            marginTop: 20,
            padding: '8px 12px',
            border: 'none',
            borderRadius: 4,
            background: '#e53935',
            color: 'white',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Đăng xuất
        </a>
      </aside>

      <main style={{ flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  )
}
