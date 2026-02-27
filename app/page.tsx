import Link from "next/link"
import Image from "next/image"

const category = [
  { id: 1, name: "Lương thực"},
  { id: 2, name: "Thực phẩm"},
  { id: 3, name: "Dược liệu"},
  { id: 4, name: "Thủ công mỹ nghệ"}, 
  { id: 5, name: "Hàng tiêu dùng"},
  { id: 6, name: "Đồ uống"},
]
const banner = "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/1.jpg"
  const bg = "https://raw.githubusercontent.com/ILTT219/Image-storage/44a05652648c45960fc4ee78cf2e2cb0030d7840/9.jpg"
const images: Record<number, string> = {
  1: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/2.jpg",
  2: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/3.jpg",
  3: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/4.jpg",
  4: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/5.jpg",
  5: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/6.jpg",
  6: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/7.jpg",
}
export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif" }}>
      <section style={{ backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat", height: "350px" }}>
        
      </section>
      
      <div className="container" >
        <h1>Danh mục sản phẩm</h1>
      <div className="grid">
        {category.map((product) => (
          <Link key={product.id} href={`/category/${product.id}`}>
            <div className="card" data-name={product.name} style={{ backgroundImage: `url(${images[product.id]})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </main>
  )
}