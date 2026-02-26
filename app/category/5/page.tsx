"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const categoryData: Record<number, { name: string; description: string }> = {
  1: {
    name: "Lương thực",
    description: "Lương thực chất lượng cao từ các nông trại OCOP Bắc Ninh. Sản phẩm tươi ngon, dinh dưỡng, được sản xuất bằng phương pháp truyền thống.",
  },
  2: {
    name: "Thực phẩm",
    description: "Các loại thực phẩm chế biến đặc sắc từ OCOP Bắc Ninh. Đảm bảo vệ sinh, an toàn và giàu dinh dưỡng.",
  },
  3: {
    name: "Dược liệu",
    description: "Dược liệu thiên nhiên tươi tắn, được chọn lọc kỹ lưỡng. Sử dụng trong y học cổ truyền và chế biến các sản phẩm sức khỏe.",
  },
  4: {
    name: "Thủ công mỹ nghệ",
    description: "Các sản phẩm thủ công tinh xảo từ các nghệ nhân OCOP. Mỗi sản phẩm đều mang dấu ấn văn hóa địa phương.",
  },
  5: {
    name: "Hàng tiêu dùng",
    description: "Hàng tiêu dùng hàng ngày nhưng chất lượng OCOP. Từ đồ dùng gia đình đến các sản phẩm tiện lợi.",
  },
  6: {
    name: "Đồ uống",
    description: "Các loại đồ uống tuyệt vời từ OCOP Bắc Ninh. Từ trà, cà phê đến các loại nước ép tự nhiên.",
  },
}

const categoryImages: Record<number, string> = {
  1: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/2.jpg",
  2: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/3.jpg",
  3: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/4.jpg",
  4: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/5.jpg",
  5: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/6.jpg",
  6: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/7.jpg",
}

export default function CategoryPage({ params }: { params: { "0": string } }) {
  const categoryId = parseInt(params["0"], 10)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const cat = categoryData[categoryId] || { name: "Danh mục", description: "" }
  const image = categoryImages[categoryId] || ""

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category_id")
        .eq("category_id", categoryId)

      if (error) {
        console.error("supabase fetch error", error)
      } else if (data) {
        setProducts(data)
      }
      setLoading(false)
    }
    load()
  }, [categoryId])

  return (
    <main style={{ fontFamily: "sans-serif" }}>
      {/* Hero Section */}
      <section
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "350px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "40px",
          color: "white",
          textShadow: "2px 2px 4px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>{cat.name}</h1>
        <p style={{ fontSize: 16, maxWidth: 600 }}>{cat.description}</p>
      </section>

      {/* Products Section */}
      <div className="container" style={{ paddingTop: 40 }}>
        <h2 style={{ marginBottom: 24 }}>Sản phẩm trong danh mục</h2>

        {loading && <div>Đang tải...</div>}
        {!loading && products.length === 0 && <div>Chưa có sản phẩm trong danh mục này.</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <div
                style={{
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"
                  e.currentTarget.style.transform = "translateY(-4px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                <h3 style={{ marginBottom: 8, color: "#2f6f3e" }}>{p.name}</h3>
                <div style={{ fontSize: 13, color: "#666" }}>Xem chi tiết →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
