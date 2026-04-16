"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

/**
 * Static category data mimicking a database table.
 */
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
    info: "Thủ công mỹ nghệ là tinh hoa của tay bạt. OCOP Bắc Ninh bảo tồn và phát triển các sản phẩm thủ công truyền thống, mỗi sản phẩm là một tác phẩm nghệ thuật có giá trị cao.",
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

import { supabase } from "@/lib/supabase"

export default function CategoryPage() {
  const params = useParams()
  const categoryId = parseInt(params.id as string, 10)
  const [featured, setFeatured] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const cat = categoryData[categoryId] || { name: "Danh mục", intro: "", info: "" }
  const image = categoryImages[categoryId] || ""

  useEffect(() => {
    let productsSub: any = null
    let allProductsSub: any = null

    async function load() {
      try {
        const res = await fetch(`/api/products/featured?category_id=${categoryId}&limit=3`)
        const data = await res.json()
        setFeatured(data.data || [])

        const allRes = await fetch(`/api/products?category=${categoryId}&include_images=true`)
        const allData = await allRes.json()
        setAllProducts(allData.data || [])
      } catch (err) {
        console.error('load category error', err)
      } finally {
        setLoading(false)
      }
    }
    
    load()

    productsSub = supabase
      .channel(`category-products-featured-${categoryId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `category_id=eq.${categoryId}` },
        async () => {
          try {
            const res = await fetch(`/api/products/featured?category_id=${categoryId}&limit=3`)
            const data = await res.json()
            setFeatured(data.data || [])
          } catch (err) {}
        }
      )
      .subscribe()

    allProductsSub = supabase
      .channel(`category-all-products-${categoryId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `category_id=eq.${categoryId}` },
        async (payload: any) => {
          setAllProducts((prev) => prev.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p))
        }
      )
      .subscribe()

    return () => {
      if (productsSub) supabase.removeChannel(productsSub)
      if (allProductsSub) supabase.removeChannel(allProductsSub)
    }
  }, [categoryId])

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Category Hero Block */}
      <section className="relative h-[300px] md:h-[400px] bg-slate-900 border-b border-brand-green border-opacity-30">
        <div className="absolute inset-0 opacity-40">
          <img src={image} className="w-full h-full object-cover" alt={cat.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        <div className="relative container-custom h-full flex flex-col justify-end pb-12 z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-gold-light hover:text-white transition-colors text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kênh Trang chủ
          </Link>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tight mb-4">
            {cat.name}
          </h1>
          <p className="max-w-2xl font-sans text-lg text-slate-200 leading-relaxed">
            {cat.intro}
          </p>
        </div>
      </section>

      <div className="container-custom py-16 space-y-20">
        
        {/* Featured Products */}
        <section>
          <div className="flex flex-col mb-8 border-b border-slate-200 pb-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Sản Phẩm Đinh Tiêu Biểu</h2>
            <p className="text-slate-500 text-sm mt-1">Những mặt hàng đạt phản hồi tốt nhất từ khách hàng</p>
          </div>

          {loading ? (
            <div className="flex gap-2 justify-center p-12 text-slate-500 text-sm">
              <span className="animate-pulse">Đang tải danh mục...</span>
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-slate-100">
              Chưa có sản phẩm nào thuộc gian hàng này.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <div key={p.id} className="ocop-card group flex flex-col cursor-pointer">
                  {p.img && (
                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 border-b border-slate-100">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-brand-green px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        {p.view_count || 0}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-lg text-slate-900 mb-4 line-clamp-2">{p.name}</h3>
                    <div className="mt-auto pt-4">
                      <Link href={`/products/${p.id}`} className="block w-full">
                        <button className="w-full ocop-btn">
                          Xem chi tiết
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info Block */}
        <section className="max-w-5xl">
          <div className="bg-brand-green text-white p-8 md:p-12 rounded-3xl shadow-lg relative overflow-hidden">
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
             <div className="relative z-10">
              <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="text-brand-gold-light">★</span> Ý nghĩa ngành hàng
              </h2>
              <div className="text-slate-100/90 leading-relaxed text-base">
                {cat.info}
              </div>
            </div>
          </div>
        </section>

        {/* All Products List Section */}
        <section>
          <div className="flex flex-col mb-8 border-b border-slate-200 pb-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Danh Mục Toàn Phần</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allProducts.map((p) => (
               <Link key={p.id} href={`/products/${p.id}`} className="group block outline-none">
                 <div className="ocop-card p-5 transition-all hover:border-brand-green/30 hover:shadow-brand-green/5">
                   <h3 className="font-heading text-base font-bold text-slate-800 group-hover:text-brand-green mb-2 line-clamp-1">{p.name}</h3>
                   <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                     <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                     {p.view_count || 0} lượt tiếp cận
                   </div>
                 </div>
               </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
