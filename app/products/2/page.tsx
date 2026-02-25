const products = [
  {
    id: 1,
    name: "Gạo ST25",
    description: "Gạo thơm cao cấp",
    detail:
      "Gạo ST25 đạt giải gạo ngon nhất thế giới. Hạt dài, cơm mềm, thơm tự nhiên.",
  },
  {
    id: 2,
    name: "Rau hữu cơ",
    description: "Rau sạch Đà Lạt",
    detail:
      "Rau trồng theo tiêu chuẩn hữu cơ, không thuốc bảo vệ thực vật.",
  },
  {
    id: 3,
    name: "Thanh long",
    description: "Thanh long Bình Thuận",
    detail:
      "Thanh long ruột đỏ, vị ngọt tự nhiên, đạt tiêu chuẩn xuất khẩu.",
  },
]

export default function ProductDetail({
  params,
}: {
  params: { id: string }
}) {
  const product = products.find(
    (p) => p.id === Number(params.id)
  )

  if (!product) {
    return <div className="container">Không tìm thấy sản phẩm</div>
  }

  return (
    <div className="container">
      <div className="detail">
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        <h3 className="section-title">Thông tin chi tiết</h3>
        <p>{product.detail}</p>
      </div>
    </div>
  )
}