import Link from "next/link"

const category = [
  { id: 1, name: "Lương thực"},
  { id: 2, name: "Thực phẩm"},
  { id: 3, name: "Dược liệu"},
  { id: 4, name: "Thủ công mỹ nghệ"}, 
  { id: 5, name: "Hàng tiêu dùng"},
  { id: 6, name: "Đồ uống"},
]

const banner = "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/1.jpg"
  
const images: Record<number, string> = {
  1: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/2.jpg",
  2: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/3.jpg",
  3: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/4.jpg",
  4: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/5.jpg",
  5: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/6.jpg",
  6: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/7.jpg",
}

/**
 * HomePage Component
 * Landing page of the OCOP Bắc Ninh platform. Professional E-commerce Style.
 */
export default function Home() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Banner Area */}
      <section className="relative bg-white border-b border-slate-200">
        <div className="container-custom">
          <div className="flex flex-col items-center text-center py-12 lg:py-16 gap-10">
            {/* Featured Image */}
            <div className="w-full max-w-5xl relative">
              {/* Decor element */}
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-green/20 to-brand-gold/20 blur-2xl rounded-[3rem] opacity-60 z-0"></div>
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white z-10 w-full group mx-auto">
                <div className="absolute inset-0 z-10 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 pointer-events-none"></div>
                <img 
                  src={banner} 
                  alt="OCOP Bắc Ninh" 
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105 block"
                />
              </div>
            </div>

            {/* Actions Content */}
            <div className="flex flex-col items-center w-full max-w-3xl z-10">
              <div className="flex w-full justify-center gap-4 flex-col sm:flex-row items-center">
                <Link href="/products" className="ocop-btn text-base py-3.5 px-8 whitespace-nowrap shadow-md">
                   Khám Phá Ngay
                </Link>
                
                {/* Product Search Form */}
                <form action="/products" method="GET" className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    name="search" 
                    placeholder="Tìm kiếm nông sản, đặc sản OCOP..." 
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-full py-3.5 pl-6 pr-16 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
                    required
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-green text-white rounded-full flex items-center justify-center hover:bg-brand-green-dark transition-colors" aria-label="Tìm kiếm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="container-custom pt-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Danh Mục <span className="text-brand-green">Sản Phẩm</span>
            </h2>
            <p className="text-slate-600 font-sans">Mua sắm an tâm với các sản phẩm địa phương đã được đánh giá, xếp hạng tiêu chuẩn chất lượng cao.</p>
          </div>
          <Link href="/products" className="text-brand-green font-semibold hover:text-brand-green-dark transition-colors inline-flex items-center gap-1 group">
            Xem tất cả <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {category.map((product, index) => (
            <Link key={product.id} href={`/category/${product.id}`} className="block group">
              <div className="ocop-card h-full flex flex-col group-hover:-translate-y-1 transition-transform duration-300">
                <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
                  <div 
                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `url(${images[product.id]})`, 
                      backgroundSize: "cover", 
                      backgroundPosition: "center" 
                    }}
                  />
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                  
                  {/* Category Name inside Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-heading text-xl font-bold flex items-center justify-between">
                      {product.name}
                      <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all text-white bg-brand-green/80 rounded-full w-8 h-8 flex items-center justify-center text-sm backdrop-blur-sm">
                        →
                      </span>
                    </h3>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      
      {/* T rust Indicators */}
      <section className="container-custom pt-24 pb-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="px-4 py-4 md:py-0">
              <div className="w-14 h-14 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-green text-2xl">🌱</div>
              <h3 className="font-heading font-bold text-slate-800 text-lg mb-2">Đạt Chuẩn OCOP</h3>
              <p className="text-slate-500 text-sm">Hàng hóa được thẩm định 3-5 sao cấp Tỉnh và Quốc gia.</p>
            </div>
            <div className="px-4 py-4 md:py-0">
              <div className="w-14 h-14 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-gold text-2xl">🛡️</div>
              <h3 className="font-heading font-bold text-slate-800 text-lg mb-2">Đảm Bảo Nguồn Gốc</h3>
              <p className="text-slate-500 text-sm">Minh bạch thông tin nhà sản xuất, truy xuất nguồn gốc dễ dàng.</p>
            </div>
            <div className="px-4 py-4 md:py-0">
              <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl">⚡</div>
              <h3 className="font-heading font-bold text-slate-800 text-lg mb-2">Giao Dịch An Toàn</h3>
              <p className="text-slate-500 text-sm">Quy trình mua bán hiện đại, hỗ trợ tận tình từ Ban điều hành.</p>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  )
}