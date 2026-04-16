"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

interface Product {
  id: number
  name: string
  category_id?: number
  description?: string
  img?: string
  origin?: string
  contact_address?: string
}

interface ProductImage {
  image_url: string
}

/**
 * ProductDetail Component (Hand-drawn / Scrapbook style)
 */
export default function ProductDetail() {
  const params = useParams()
  const idParam = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFn: typeof fetch = (input, init) => {
    const opts: RequestInit = { ...(init || {}), cache: 'no-store' }
    return fetch(input, opts)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: fetchFn } }
  )

  useEffect(() => {
    let productSub: any = null
    let imagesSub: any = null

    async function load() {
      try {
        const id = Number(idParam)
        if (Number.isNaN(id)) {
          setError("Số giấy không hợp lệ")
          setLoading(false)
          return
        }

        const { data: productData, error: prodErr } = await supabase
          .from("products")
          .select("id, name, description, img, origin, contact_address")
          .eq("id", id)
          .single()

        if (prodErr || !productData) {
          setError("Tờ nháp này không có thật")
          setLoading(false)
          return
        }

        setProduct(productData)

        const { data: imagesData } = await supabase
          .from("images")
          .select("image_url")
          .eq("product_id", id)

        setImages(imagesData || [])

        try {
          await fetch("/api/products/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: id }),
          })
        } catch (e) {}

        productSub = supabase
          .channel(`product-updates-${id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
            (payload) => { if (payload.new) setProduct((prev) => ({...prev, ...payload.new} as Product)) }
          )
          .subscribe()

        imagesSub = supabase
          .channel(`product-images-${id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'images', filter: `product_id=eq.${id}` },
            (payload) => { if (payload.new) setImages((prev) => [...prev, payload.new as ProductImage]) }
          )
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'images', filter: `product_id=eq.${id}` },
            (payload) => { if (payload.old) setImages((prev) => prev.filter((img) => img.image_url !== payload.old.image_url)) }
          )
          .subscribe()
      } finally {
        setLoading(false)
      }
    }
    load()

    return () => {
      if (productSub) supabase.removeChannel(productSub)
      if (imagesSub) supabase.removeChannel(imagesSub)
    }
  }, [idParam])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-heading text-3xl">
        Đang vẽ...
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-3xl font-heading text-slate-800 mb-6">{error || "Tờ giấy rỗng."}</div>
        <Link href="/products" className="sketch-btn">
          Lật sang trang khác
        </Link>
      </div>
    )
  }

  return (
    <div className="container-custom py-12 max-w-5xl">
       <div className="mb-8">
        <Link href={`/category/${product.category_id || 1}`} className="inline-flex items-center gap-2 font-heading text-2xl text-slate-600 hover:text-slate-900 group">
           <svg className="w-6 h-6 transform group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           gấp lại
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Lõi Ảnh Lớn */}
        <div className="lg:col-span-2">
           <div className="sketch-card bg-white p-3 rotate-1 transform mx-auto max-w-md">
             <div className="sketch-image-wrapper aspect-square border-4">
                {product.img ? (
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-2xl text-slate-400 bg-slate-100">
                    Chưa vẽ ảnh
                  </div>
                )}
             </div>
             <p className="font-heading text-center text-xl mt-3 opacity-70">
               {product.name} - Bản gốc
             </p>
           </div>
        </div>

        {/* Cuốn số tay cho Nội dung */}
        <div className="lg:col-span-3">
           <div className="sketch-card bg-yellow-50/90 min-h-full p-8 md:p-10 -rotate-1 relative" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #94a3b8 31px, #94a3b8 32px)' }}>
              
              {/* Lỗ đóng gáy xoắn sổ tay (Giả lập) */}
              <div className="absolute top-0 bottom-0 left-3 w-8 flex flex-col justify-around py-4 opacity-70">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-[#f6f4f0] border-2 border-slate-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"></div>
                ))}
              </div>

              <div className="pl-8">
                 <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-[1.1]">
                   {product.name}
                 </h1>
                 
                 <div className="space-y-4 font-serif text-2xl text-slate-800 mt-8">
                   {product.origin && (
                     <div className="flex flex-col">
                       <span className="font-heading text-lg text-slate-500 line-through decoration-slate-400">Từ xứ sở:</span>
                       <span className="font-bold -mt-2">{product.origin}</span>
                     </div>
                   )}
                   
                   {product.contact_address && (
                     <div className="flex flex-col">
                       <span className="font-heading text-lg text-slate-500 line-through decoration-slate-400">Bàn tay nhào nặn:</span>
                       <span className="font-bold leading-tight -mt-2">{product.contact_address}</span>
                     </div>
                   )}
                 </div>

                 <div className="mt-8 font-serif text-2xl text-slate-800 leading-[32px] text-justify">
                    {product.description ? (
                      <p className="whitespace-pre-wrap">{product.description}</p>
                    ) : (
                      <p className="italic text-slate-500">Chưa có dòng tâm sự nào được viết ra...</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

       {/* Ảnh đính kèm */}
       {images && images.length > 0 && (
         <div className="mt-20">
           <div className="flex items-center gap-4 mb-8 border-b-4 border-slate-800 border-dashed pb-2 w-max">
             <h3 className="font-heading text-4xl font-bold text-slate-900">Bản Vẽ Mô Phỏng Khác</h3>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {images.map((it: ProductImage, idx: number) => (
                <div key={idx} className={`sketch-card bg-white p-2 ${idx % 2 === 0 ? '-rotate-2' : 'rotate-3'} hover:rotate-0 transition-all`}>
                  <a href={it.image_url} target="_blank" rel="noreferrer" className="block sketch-image-wrapper aspect-square">
                    <img
                      src={it.image_url}
                      alt={`Ảnh đính kèm ${idx + 1}`}
                      className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-300"
                    />
                  </a>
                </div>
             ))}
           </div>
         </div>
       )}
    </div>
  )
}
