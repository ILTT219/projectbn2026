import Link from "next/link"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <nav style={{ padding: 20, background: "#f4f4f4" }}>
          <Link href="/">Trang chủ</Link> |{" "}
          <Link href="/products">Sản phẩm</Link> |{" "}
          <Link href="/contact">Liên hệ</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}