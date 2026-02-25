export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#1e293b",
          color: "white",
          padding: 20,
        }}
      >
        <h2>Admin</h2>
        <ul style={{ marginTop: 20 }}>
          <li>Dashboard</li>
          <li>Sản phẩm</li>
        </ul>
      </aside>

      <main style={{ flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  )
}