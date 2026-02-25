import Link from "next/link"

const products = [
  { id: 1, name: "Mỳ gạo chũ"},
  { id: 2, name: "Hoa sâm núi Dành"},
  { id: 3, name: "Gà đồi yên thế ủ muối"},
  { id: 4, name: "Vải thiều sấy khô"}, 
]

export default function ProductsPage() {
  return (
    <div className="container">
      <h1>Danh sách sản phẩm</h1>

      <div className="grid">
        {products.map((product) => (
          <div key={product.id} className="card">
            <h3>{product.name}</h3>

            <Link href={`/products/${product.id}`}>
              Xem chi tiết →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}