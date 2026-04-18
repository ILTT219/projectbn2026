"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

const categories = [
  { id: 1, name: "Lương thực"},
  { id: 2, name: "Thực phẩm"},
  { id: 3, name: "Dược liệu"},
  { id: 4, name: "Thủ công mỹ nghệ"},
  { id: 5, name: "Hàng tiêu dùng"},
  { id: 6, name: "Đồ uống"},
]

const products: Array<{id:number;name:string;categoryId:number;img?: string; description?: string}> = []

export default function ProductsPage() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [productList, setProductList] = useState<typeof products>(products)
  // Quản lý bố cục: 'list' (Chi tiết), 'grid' (Chỉ hình), 'text' (Chỉ tên)
  const [layout, setLayout] = useState<'list' | 'grid' | 'text'>('list')

  useEffect(() => {
    async function load() {
      // Chỉ tải các sản phẩm đã duyệt
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category_id, img, description")
        .eq("status", "approved")
        .order("id", { ascending: false })
      
      if (!error && data) {
        setProductList(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            categoryId: r.category_id,
            img: r.img || undefined,
            description: r.description || "Một sản phẩm đặc sản OCOP chất lượng cao.",
          }))
        )
      }
    }
    load()

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) {
        setQuery(searchParam);
      }
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    
    // Nếu không có từ khóa, chỉ lọc theo danh mục
    if (!q) {
      return productList.filter((p) => {
        if (activeCategory && p.categoryId !== activeCategory) return false
        return true
      })
    }

    // Hàm tiện ích: Loại bỏ dấu tiếng Việt để tìm kiếm tương đối chuẩn hơn
    const removeAccents = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    };

    const qNormalized = removeAccents(q)
    const searchTerms = qNormalized.split(/\s+/)

    const scoredProducts = productList.map(p => {
      // Bỏ qua nếu khác danh mục đang được chọn
      if (activeCategory && p.categoryId !== activeCategory) {
        return { product: p, score: 0 }
      }

      const nameOriginal = p.name.toLowerCase()
      const nameNormalized = removeAccents(nameOriginal)
      let score = 0

      // ƯU TIÊN 1: Khớp chính xác hoàn toàn có dấu
      if (nameOriginal === q) {
         score = 100
      } 
      // ƯU TIÊN 2: Khớp chính xác khi đã bỏ dấu
      else if (nameNormalized === qNormalized) {
         score = 90
      }
      // ƯU TIÊN 3: Chữ bắt đầu bằng cụm từ tìm kiếm
      else if (nameNormalized.startsWith(qNormalized)) {
         score = 80
      }
      // ƯU TIÊN 4: Chứa cụm từ khóa y hệt (liền nhau)
      else if (nameNormalized.includes(qNormalized)) {
         score = 60
      } 
      // ƯU TIÊN 5: Tìm kiếm tương đối (các từ rời rạc)
      else {
         let matchCount = 0
         searchTerms.forEach(term => {
             if (term.length > 0 && nameNormalized.includes(term)) {
                 matchCount++
             }
         })
         
         // Có tất cả các từ (nhưng nằm rải rác)
         if (searchTerms.length > 0 && matchCount === searchTerms.length) {
            score = 40 
         } 
         // Chỉ khớp một vài từ (KẾT QUẢ TƯƠNG ĐỐI)
         else if (matchCount > 0) {
            score = matchCount * 10
         }
      }

      return { product: p, score }
    })

    // Lọc ra các sản phẩm có dính líu (score > 0) và sắp xếp điểm từ cao xuống thấp
    return scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)

  }, [query, activeCategory, productList])

  return (
    <div className="container-custom py-10 min-h-screen">
      {/* Tiêu đề và nút hiển thị */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-[50px] mt-[44px] w-full gap-[10px] md:gap-0">
         <div className="hidden md:block md:w-1/3"></div> {/* Cân bằng bên trái */}
         
         <h1 className="font-heading text-4xl font-extrabold text-slate-800 uppercase tracking-tight drop-shadow-sm md:w-1/3 text-center">
           Khám Phá Sản Phẩm
         </h1>
         
         <div className="flex justify-center md:justify-end md:w-1/3 w-full">
           {/* Button thay đổi bố cục */}
           <div className="flex gap-1.5 bg-white rounded-lg p-1.5 shadow-sm border border-slate-200">
             <button 
               onClick={() => setLayout('list')}
               className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${layout === 'list' ? 'bg-brand-green text-white shadow-md' : 'text-slate-600 hover:text-brand-green hover:bg-slate-50'}`}
             >
                Danh sách chi tiết
             </button>
             <button 
               onClick={() => setLayout('grid')}
               className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${layout === 'grid' ? 'bg-brand-green text-white shadow-md' : 'text-slate-600 hover:text-brand-green hover:bg-slate-50'}`}
             >
                Chỉ hình ảnh
             </button>
             <button 
               onClick={() => setLayout('text')}
               className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${layout === 'text' ? 'bg-brand-green text-white shadow-md' : 'text-slate-600 hover:text-brand-green hover:bg-slate-50'}`}
             >
                Chỉ tên 
             </button>
           </div>
         </div>
      </div>

      {/* Trình tìm kiếm & Lọc */}
      <div className="w-full flex justify-center mt-2">
        <div className="flex flex-col items-center justify-center gap-4 mb-12 bg-white px-8 py-6 md:py-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-4xl min-h-[210px]">
          <input
          aria-label="Tìm kiếm sản phẩm"
          placeholder="🔍 Nhập để tìm kiếm sản phẩm OCOP mà bạn quan tâm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-6 py-4 text-center text-lg rounded-xl border-2 border-slate-200 w-full focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/20 transition-all font-sans"
        />

        <div className="flex gap-3 flex-wrap justify-center items-center w-full">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === null ? "bg-brand-green text-white shadow-md shadow-brand-green/30 scale-105" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Tất cả danh mục
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeCategory === c.id ? "bg-brand-green text-white shadow-md shadow-brand-green/30 scale-105" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 && (
           <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 font-sans">
              Không tìm thấy sản phẩm nào khớp với tìm kiếm.
           </div>
        )}

        {/* LAYOUT 1: LIST / CHI TIẾT (1 hàng có 2 sản phẩm trên PC, 1 sản phẩm trên ĐT) */}
        {layout === 'list' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {filtered.map((p) => (
               <Link key={p.id} href={`/products/${p.id}`} className="block group">
                 <div className="flex bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all group-hover:border-brand-green">
                   <div className="w-2/5 aspect-square bg-slate-100 shrink-0 relative overflow-hidden">
                     {p.img ? (
                        <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                     )}
                   </div>
                   <div className="w-3/5 p-5 flex flex-col justify-center">
                     <span className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                       {categories.find(c => c.id === p.categoryId)?.name}
                     </span>
                     <h3 className="font-heading font-bold text-slate-800 text-xl mb-2 group-hover:text-brand-green transition-colors line-clamp-2">
                       {p.name}
                     </h3>
                     <p className="text-slate-500 font-sans text-sm line-clamp-3">
                       {p.description}
                     </p>
                   </div>
                 </div>
               </Link>
             ))}
           </div>
        )}

        {/* LAYOUT 2: GRID / CHỈ HÌNH (Hiển thị ảnh to) */}
        {layout === 'grid' && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {filtered.map((p) => (
               <Link key={p.id} href={`/products/${p.id}`} className="block group">
                 <div 
                    className="aspect-square bg-slate-100 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden relative border-2 border-transparent group-hover:border-brand-green"
                 >
                    {p.img ? (
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center font-bold text-slate-400">{p.name.substring(0,2)}</div>
                    )}
                 </div>
               </Link>
             ))}
           </div>
        )}

        {/* LAYOUT 3: TEXT / CHỈ TÊN */}
        {layout === 'text' && (
           <div className="flex flex-col gap-3">
             {filtered.map((p) => (
               <Link key={p.id} href={`/products/${p.id}`} className="block">
                 <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-100 hover:bg-emerald-50 hover:border-brand-green/30 transition-colors flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-slate-800 text-lg">
                      {p.name}
                    </h3>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {categories.find(c => c.id === p.categoryId)?.name}
                    </span>
                 </div>
               </Link>
             ))}
           </div>
        )}
      </div>
    </div>
  )
}