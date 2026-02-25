import Link from "next/link"
const category = [
  { id: 1, name: "Nông sản"},
  { id: 2, name: "Thảo dược"},
  { id: 3, name: "Lưu niệm"},
  { id: 4, name: "Đồ uống"}, 
  { id: 5, name: "May mặc"},
  { id: 6, name: "Dịch vụ"},
]
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🌾 OCOP Bắc Ninh</h1>
      <p>
        Chúng tôi quảng bá sản phẩm OCOP Bắc Ninh.
      </p>

      <div className="container">
      <h1>Danh sách sản phẩm</h1>

      <div className="grid">
        {category.map((product) => (
          <div key={product.id} className="card">
            <h3>{product.name}</h3>

            <Link href={`/category/${product.id}`}>
              {product.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
    </main>
  )
}