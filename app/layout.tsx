import { Metadata } from "next"
import "./globals.css"
import ChatBot from "@/components/ui/ChatBot"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "OCOP Bắc Ninh",
  description: "Cổng thông tin xúc tiến thương mại sản phẩm OCOP Bắc Ninh",
  icons: {
    icon: "https://raw.githubusercontent.com/ILTT219/Image-storage/c674f7253196749a55fbdd18d6b540a4cdc5e1f2/12.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen">
        <ChatBot/>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}