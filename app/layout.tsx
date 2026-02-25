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
        <nav style={{ padding: 20, background: "#c10000" }}>
          <Link href="/">Trang chủ</Link> |{" "}
          <Link href="/products">Sản phẩm</Link> |{" "}
          <Link href="/contact">Liên hệ</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}