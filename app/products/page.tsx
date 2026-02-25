import Link from "next/link"

const products = [
  { id: 1, name: "Gạo ST25", description: "Gạo thơm cao cấp" },
  { id: 2, name: "Rau hữu cơ", description: "Rau sạch Đà Lạt" },
  { id: 3, name: "Thanh long", description: "Thanh long Bình Thuận" },
]

export default function ProductsPage() {
  return (
    <div className="container">
      <h1>Danh sách sản phẩm</h1>

      <div className="grid">
        {products.map((product) => (
          <div key={product.id} className="card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>

            <Link href={`/products/${product.id}`}>
              Xem chi tiết →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}