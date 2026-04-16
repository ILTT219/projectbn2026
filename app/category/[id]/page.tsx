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

/**
 * CategoryPage Component (Hand-drawn theme)
 */
export default function CategoryPage() {
  const params = useParams()
  const categoryId = parseInt(params.id as string, 10)
  const [featured, setFeatured] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const cat = categoryData[categoryId] || { name: "Danh mục", intro: "", info: "" }
  const image = categoryImages[categoryId] || ""

  useEffect(() => {
    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
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
    <>
      {/* Hero Section (Polaroid Style) */}
      <section className="container-custom py-12">
        <div className="sketch-card bg-white p-4 pb-12 relative max-w-4xl mx-auto transform -rotate-1">
          {/* Tape */}
          <div className="absolute -top-3 right-10 w-20 h-6 bg-slate-300/60 rotate-6 border border-slate-400" style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}></div>
          
          <div className="sketch-image-wrapper h-[300px] md:h-[400px]">
            <img src={image} className="w-full h-full object-cover" alt={cat.name} />
          </div>
          
          <div className="absolute bottom-4 left-6 right-6 flex items-baseline gap-4">
             <h1 className="font-heading text-5xl md:text-6xl text-slate-900 font-bold underline decoration-brand-green">{cat.name}</h1>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-8 font-serif text-2xl text-slate-700 leading-relaxed text-center">
            {cat.intro}
        </div>
      </section>

      <div className="container-custom py-16 space-y-24">
        
        {/* Featured Products */}
        <section>
          <div className="flex flex-col items-center mb-12 relative">
            <h2 className="font-heading text-5xl font-bold text-slate-800 z-10">Sản Phẩm Đinh</h2>
            <svg className="absolute -bottom-2 w-64 h-4 text-brand-gold" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,10 Q25,0 50,15 T100,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>

          {loading ? (
            <div className="flex gap-2 justify-center p-12 text-2xl font-serif">
              Đang pha mực...
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center font-serif text-2xl text-slate-500 py-10 sketch-card mx-auto max-w-md">
              Chưa có tranh vẽ nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featured.map((p, i) => (
                <div key={p.id} className={`sketch-card flex flex-col bg-white p-3 group cursor-pointer ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0`}>
                  {p.img && (
                    <div className="sketch-image-wrapper aspect-square mb-4 relative">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 bg-yellow-200 text-slate-900 px-3 py-1 font-heading text-xl shadow-[2px_2px_0px_#333] border-2 border-slate-900 rotate-3">
                        👁 {p.view_count || 0}
                      </div>
                    </div>
                  )}

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-3xl text-slate-900 mb-4">{p.name}</h3>
                    <div className="mt-auto">
                      <Link href={`/products/${p.id}`} className="block w-full">
                        <button className="w-full sketch-btn text-2xl py-1">
                          Lật mở
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* General Info Scrapbook */}
        <section className="max-w-4xl mx-auto">
          <div className="sketch-card bg-brand-gold-light/20 p-8 md:p-12 transform rotate-1">
             <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl text-slate-800">📌</span>
              <h2 className="font-heading text-4xl font-bold text-brand-green">Chút tâm tình</h2>
            </div>
            <div className="font-serif text-2xl text-slate-800 leading-relaxed indent-8">
              {cat.info}
            </div>
          </div>
        </section>

        {/* Product Gallery Section */}
        {allProducts.length > 0 && (
          <section>
            <div className="flex flex-col items-center mb-12">
              <h2 className="font-heading text-5xl font-bold text-slate-800">Góc Ảnh</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {allProducts
                .filter((p) => p.images && p.images.length > 0)
                .flatMap((p) =>
                  p.images.slice(0, 3).map((img, idx) => (
                    <div
                      key={`${p.id}-${idx}`}
                      className={`sketch-card p-2 bg-white relative aspect-[3/4] group cursor-pointer ${idx % 3 === 0 ? '-rotate-3' : idx % 2 === 0 ? 'rotate-2' : 'rotate-1'}`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${p.name} - ảnh ${idx + 1}`}
                        className="w-full h-[85%] object-cover grayscale-[20%] sepia-[10%] group-hover:grayscale-0 transition-all duration-300"
                      />
                      <div className="h-[15%] flex items-center justify-center font-heading text-xl text-slate-600 truncate px-2">
                        {p.name.substring(0, 15)}...
                      </div>
                    </div>
                  ))
                )}
            </div>
          </section>
        )}

        {/* All Products List Section */}
        <section>
          <div className="flex items-center gap-4 mb-10 border-b-4 border-slate-800 border-dashed pb-2 w-max">
            <h2 className="font-heading text-4xl font-bold text-slate-800">Danh Mục Chi Tiết</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allProducts.map((p) => (
               <Link key={p.id} href={`/products/${p.id}`} className="group block outline-none">
                 <div className="sketch-card bg-orange-50/50 p-4 transition-all">
                   <h3 className="font-heading text-2xl font-bold text-slate-800 group-hover:text-brand-green mb-2">{p.name}</h3>
                   <div className="font-serif text-xl text-slate-600 flex items-center gap-2">
                     <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                     {p.view_count || 0} lượt ngắm
                   </div>
                 </div>
               </Link>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}
