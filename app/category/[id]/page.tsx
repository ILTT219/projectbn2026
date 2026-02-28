"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

const categoryData: Record<number, { name: string; intro: string; info: string }> = {
  1: {
    name: "Lương thực",
    intro: "Lương thực chất lượng cao từ các nông trại OCOP Bắc Ninh. Sản phẩm tươi ngon, dinh dưỡng, được sản xuất bằng phương pháp truyền thống.",
    info: "Lương thực là nền tảng của dinh dưỡng hàng ngày. OCOP Bắc Ninh cung cấp các sản phẩm lương thực được chọn lọc kỹ lưỡng, đảm bảo chất lượng cao nhất. Mỗi sản phẩm đều qua kiểm định chặt chẽ theo tiêu chuẩn quốc tế.",
  },
  2: {
    name: "Thực phẩm",
    intro: "Các loại thực phẩm chế biến đặc sắc từ OCOP Bắc Ninh. Đảm bảo vệ sinh, an toàn và giàu dinh dưỡng.",
    info: "Thực phẩm chế biến là sự kết hợp của truyền thống và hiện đại. OCOP Bắc Ninh tự hào mang đến các sản phẩm chế biến từ nguyên liệu tự nhiên, không chứa hóa chất độc hại, giàu giá trị dinh dưỡng.",
  },
  3: {
    name: "Dược liệu",
    intro: "Dược liệu thiên nhiên tươi tắn, được chọn lọc kỹ lưỡng. Sử dụng trong y học cổ truyền và chế biến các sản phẩm sức khỏe.",
    info: "Dược liệu là kho tàng sức khỏe mà tự nhiên ban tặng. OCOP Bắc Ninh cam kết cung cấp dược liệu nguyên chất, được chứng thực tên tuổi, giúp bảo vệ sức khỏe gia đình bạn.",
  },
  4: {
    name: "Thủ công mỹ nghệ",
    intro: "Các sản phẩm thủ công tinh xảo từ các nghệ nhân OCOP. Mỗi sản phẩm đều mang dấu ấn văn hóa địa phương.",
    info: "Thủ công mỹ nghệ là tinh hoa của tay maestro. OCOP Bắc Ninh bảo tồn và phát triển các sản phẩm thủ công truyền thống, mỗi sản phẩm là một tác phẩm nghệ thuật có giá trị cao.",
  },
  5: {
    name: "Hàng tiêu dùng",
    intro: "Hàng tiêu dùng hàng ngày nhưng chất lượng OCOP. Từ đồ dùng gia đình đến các sản phẩm tiện lợi.",
    info: "Hàng tiêu dùng hàng ngày không nhất thiết phải bỏ qua chất lượng. OCOP Bắc Ninh cung cấp các sản phẩm tiêu dùng với tiêu chuẩn cao, giúp nâng cao chất lượng cuộc sống.",
  },
  6: {
    name: "Đồ uống",
    intro: "Các loại đồ uống tuyệt vời từ OCOP Bắc Ninh. Từ trà, các loại nước ép tự nhiên.",
    info: "Đồ uống không chỉ là mục đích thỏa khát mà còn là trải nghiệm hương vị. OCOP Bắc Ninh mang đến các loại đồ uống tự nhiên, thơm ngon, tốt cho sức khỏe.",
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

interface Product {
  id: number
  name: string
  img: string
  view_count: number
  images: Array<{ image_url: string }>
}

export default function CategoryPage() {
  const params = useParams()
  const categoryId = parseInt(params.id as string, 10)
  const [featured, setFeatured] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const cat = categoryData[categoryId] || { name: "Danh mục", intro: "", info: "" }
  const image = categoryImages[categoryId] || ""

  useEffect(() => {
    async function load() {
      try {
        // fetch featured (top viewed) products
        const res = await fetch(`/api/products/featured?category_id=${categoryId}&limit=6`)
        const data = await res.json()
        setFeatured(data.data || [])

        // also fetch all products for reference
        const allRes = await fetch(`/api/products?category=${categoryId}`)
        const allData = await allRes.json()
        setAllProducts(allData.data || [])
      } catch (err) {
        console.error('load category error', err)
      } finally {
        setLoading(false)
      }
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
          height: "400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px 40px",
          color: "white",
          textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
        }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 16, fontWeight: "bold" }}>{cat.name}</h1>
        <p style={{ fontSize: 18, maxWidth: 700, lineHeight: "1.6" }}>{cat.intro}</p>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 20px" }}>
        {/* Featured Products Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: 32,
              marginBottom: 30,
              color: "#1b5e20",
              borderBottom: "3px solid #2e7d32",
              paddingBottom: 12,
            }}
          >
            🌟 Sản phẩm nổi bật
          </h2>

          {loading && <div style={{ color: "#666", fontSize: 16 }}>Đang tải...</div>}
          {!loading && featured.length === 0 && (
            <div style={{ color: "#666", fontSize: 16 }}>Chưa có sản phẩm nổi bật.</div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {featured.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(47, 111, 62, 0.2)"
                  e.currentTarget.style.transform = "translateY(-8px)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
                  e.currentTarget.style.transform = "translateY(0)"
                }}
              >
                {/* Product Image */}
                {p.img && (
                  <div style={{ width: "100%", height: 240, overflow: "hidden", background: "#f5f5f5" }}>
                    <img
                      src={p.img}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)"
                      }}
                    />
                  </div>
                )}

                {/* Product Info */}
                <div style={{ padding: 16 }}>
                  <h3 style={{ marginBottom: 8, color: "#2f6f3e", fontSize: 18 }}>{p.name}</h3>
                  <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>
                    👁️ {p.view_count || 0} lượt xem
                  </div>
                  <Link href={`/products/${p.id}`}>
                    <button
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        background: "linear-gradient(90deg, #1b5e20, #2e7d32)",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(90deg, #0d3818, #1b5e20)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(90deg, #1b5e20, #2e7d32)"
                      }}
                    >
                      Xem chi tiết →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* General Info Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontSize: 32,
              marginBottom: 20,
              color: "#1b5e20",
              borderBottom: "3px solid #2e7d32",
              paddingBottom: 12,
            }}
          >
            ℹ️ Thông tin chung
          </h2>
          <div
            style={{
              background: "#f9fff8",
              padding: 24,
              borderRadius: 12,
              borderLeft: "4px solid #2e7d32",
              lineHeight: "1.8",
              fontSize: 15,
              color: "#333",
            }}
          >
            {cat.info}
          </div>
        </section>

        {/* Product Gallery */}
        {featured.length > 0 && (
          <section style={{ marginBottom: 80 }}>
            <h2
              style={{
                fontSize: 32,
                marginBottom: 30,
                color: "#1b5e20",
                borderBottom: "3px solid #2e7d32",
                paddingBottom: 12,
              }}
            >
              📸 Hình ảnh thật của sản phẩm
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {featured
                .filter((p) => p.images && p.images.length > 0)
                .flatMap((p) =>
                  p.images.slice(0, 3).map((img, idx) => (
                    <div
                      key={`${p.id}-${idx}`}
                      style={{
                        borderRadius: 8,
                        overflow: "hidden",
                        aspectRatio: "1",
                        cursor: "pointer",
                        transition: "transform 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.08)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)"
                      }}
                    >
                      <img
                        src={img.image_url}
                        alt={`${p.name} - ảnh ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))
                )}
            </div>
          </section>
        )}

        {/* All Products Section */}
        <section>
          <h2
            style={{
              fontSize: 32,
              marginBottom: 30,
              color: "#1b5e20",
              borderBottom: "3px solid #2e7d32",
              paddingBottom: 12,
            }}
          >
            📦 Tất cả sản phẩm
          </h2>

          {allProducts.length === 0 && (
            <div style={{ color: "#666", fontSize: 16 }}>Chưa có sản phẩm trong danh mục này.</div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {allProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <div
                  style={{
                    padding: 12,
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textDecoration: "none",
                    color: "inherit",
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
                  <h3 style={{ marginBottom: 6, color: "#2f6f3e", fontSize: 14 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: "#999" }}>👁️ {p.view_count || 0} lượt xem</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
