"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import LiveSearch from "@/components/search/LiveSearch"

const category = [
  { id: 1, name: "Lương thực" },
  { id: 2, name: "Thực phẩm" },
  { id: 3, name: "Dược liệu" },
  { id: 4, name: "Thủ công mỹ nghệ" },
  { id: 5, name: "Hàng tiêu dùng" },
  { id: 6, name: "Đồ uống" },
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
  const [topProducts, setTopProducts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/products/top?limit=6')
      .then(r => r.json())
      .then(d => setTopProducts(d.products || []))
      .catch(() => {})
  }, [])

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
            <div className="flex flex-col items-center w-full max-w-3xl z-10 pb-6 md:pb-12">
              <div className="flex w-full justify-center gap-4 flex-col sm:flex-row items-center">
                <Link href="/products" className="ocop-btn text-base py-3.5 px-8 whitespace-nowrap shadow-md">
                  Khám Phá Ngay
                </Link>

                {/* Product Search Form */}
                <LiveSearch />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container-custom pt-24">
        <div className="flex flex-col md:flex-row justify-between items-end my-[10px] gap-4 px-[10px]">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Danh Mục <span className="text-brand-green">Sản Phẩm</span>
            </h2>
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

      {/* Top Products Section */}
      {topProducts.length > 0 && (
        <section className="container-custom pt-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 px-[10px]">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                ⭐ Sản phẩm <span className="text-brand-green">được yêu thích</span>
              </h2>
              <p className="text-slate-500 text-sm">Những sản phẩm được người dùng đánh giá cao nhất</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topProducts.map((p: any, i: number) => (
              <Link key={p.id} href={`/products/${p.id}`} className="block group">
                <div className="ocop-card h-full flex flex-col group-hover:-translate-y-1 transition-transform duration-300 overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {p.img ? (
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">🌾</div>
                    )}
                    {i < 3 && (
                      <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                        i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                      }`}>
                        #{i + 1}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-slate-900 text-base mb-2 line-clamp-2 group-hover:text-brand-green transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-4 h-4 ${s <= Math.round(p.avg_rating) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{p.avg_rating}</span>
                      <span className="text-xs text-slate-400">({p.review_count} đánh giá)</span>
                    </div>
                    {p.origin && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">📍 {p.origin}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust Indicators */}
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
              <h3 className="font-heading font-bold text-slate-800 text-lg mb-2">Hỗ trợ tận tình</h3>
              <p className="text-slate-500 text-sm">Giúp bạn tìm hiểu sản phẩm OCOP Bắc Ninh một cách nhanh chóng.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
