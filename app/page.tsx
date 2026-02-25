export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🌾 Nông Sản Sạch Việt Nam</h1>
      <p>
        Chúng tôi cung cấp nông sản sạch, hữu cơ, đảm bảo chất lượng
        từ nông trại đến bàn ăn.
      </p>

      <section style={{ marginTop: 30 }}>
        <h2>Sản phẩm nổi bật</h2>
        <ul>
          <li>Gạo ST25</li>
          <li>Rau hữu cơ Đà Lạt</li>
          <li>Thanh long Bình Thuận</li>
          <li>Xoài cát Hòa Lộc</li>
        </ul>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Cam kết của chúng tôi</h2>
        <ul>
          <li>Không thuốc trừ sâu độc hại</li>
          <li>Quy trình kiểm định rõ ràng</li>
          <li>Giao hàng toàn quốc</li>
        </ul>
      </section>
    </main>
  )
}