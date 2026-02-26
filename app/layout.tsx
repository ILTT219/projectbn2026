import Link from "next/link"
import "./globals.css"
import ChatBot from "@/components/ChatBot"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ChatBot/>
        <nav style={{ padding: 20, background: "linear-gradient(90deg, #1b5e20, #2e7d32)", display: "flex", gap: 30, alignItems: "center" }}>
          <Link href="/" style={{ color: "rgb(71, 255, 95)", fontWeight: 600, textDecoration: "none" }}>Trang chủ</Link>
          <Link href="/products" style={{ color: "rgb(71, 255, 95)", fontWeight: 600, textDecoration: "none" }}>Sản phẩm</Link>
          <Link href="/contact" style={{ color: "rgb(71, 255, 95)", fontWeight: 600, textDecoration: "none" }}>Liên hệ</Link>
          <Link href="/admin" style={{ color: "rgb(71, 255, 95)", fontWeight: 600, textDecoration: "none" }}>Admin</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}