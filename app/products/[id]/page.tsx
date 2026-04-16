"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

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

export default function ProductDetail() {
  const params = useParams()
  const idParam = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let productSub: any = null
    let imagesSub: any = null

    async function load() {
      try {
        const id = Number(idParam)
        if (Number.isNaN(id)) {
          setError("Sản phẩm không hợp lệ")
          setLoading(false)
          return
        }

        const { data: productData, error: prodErr } = await supabase
          .from("products")
          .select("id, name, description, img, origin, contact_address")
          .eq("id", id)
          .single()

        if (prodErr || !productData) {
          setError("Không tìm thấy sản phẩm này trong hệ thống")
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
      <div className="min-h-[50vh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
           <svg className="w-8 h-8 text-brand-green animate-spin" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <span className="text-slate-500 font-medium">Đang tải thông tin...</span>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container-custom py-20 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-red-50 text-brand-red rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div className="text-2xl font-heading font-medium text-slate-800 mb-6">{error || "Sản phẩm không khả dụng"}</div>
        <Link href="/products" className="ocop-btn inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen pt-8 pb-16">
      <div className="container-custom max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-8 flex text-sm text-slate-500 font-medium">
          <Link href="/" className="hover:text-brand-green transition-colors">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href={`/category/${product.category_id || 1}`} className="hover:text-brand-green transition-colors">Danh mục</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 p-6 lg:p-10">
             
             {/* Left Gallery */}
             <div className="flex flex-col gap-4">
                <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden relative">
                   {product.img ? (
                     <img src={product.img} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-400">
                       <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                     </div>
                   )}
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-brand-green tracking-wide shadow-sm uppercase border border-brand-green/20">
                     Sản phẩm OCOP
                   </div>
                </div>
                
                {images && images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((it, idx) => (
                      <a key={idx} href={it.image_url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg border border-slate-200 overflow-hidden block hover:border-brand-green transition-colors">
                        <img src={it.image_url} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
             </div>

             {/* Right Content */}
             <div className="flex flex-col py-6 lg:py-0">
                <div className="mb-4">
                   <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 leading-snug mb-2">
                     {product.name}
                   </h1>
                   <div className="flex items-center gap-4 text-sm mt-3">
                      <span className="flex items-center gap-1.5 text-brand-gold-dark font-medium px-2.5 py-1 bg-brand-gold-light/20 rounded-md">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        Phân hạng đạt chuẩn
                      </span>
                      <span className="text-slate-500 font-medium">Lượt quan tâm cao</span>
                   </div>
                </div>

                <hr className="border-slate-100 my-6" />

                <div className="space-y-4 font-sans mb-8 flex-1">
                   {product.origin && (
                     <div className="flex items-start gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                         <span className="text-xl">📍</span>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-500">Xuất xứ sản phẩm</p>
                         <p className="text-base text-slate-900 font-medium">{product.origin}</p>
                       </div>
                     </div>
                   )}
                   
                   {product.contact_address && (
                     <div className="flex items-start gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                         <span className="text-xl">🏢</span>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-500">Chủ thể / Hợp tác xã</p>
                         <p className="text-base text-slate-900 font-medium">{product.contact_address}</p>
                       </div>
                     </div>
                   )}
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                   <h3 className="font-heading font-semibold text-slate-900 mb-3 flex items-center gap-2">
                     <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     Thông tin mô tả
                   </h3>
                   {product.description ? (
                     <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                       {product.description}
                     </p>
                   ) : (
                     <p className="text-slate-400 text-sm italic">Sản phẩm này hiện đang cập nhật thêm thông tin miêu tả chi tiết.</p>
                   )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="ocop-btn flex-1 py-3.5 text-base shadow-lg shadow-brand-green/20">
                    Liên hệ đặt hàng
                  </button>
                  <button className="ocop-btn-alt py-3.5 px-6 font-medium">
                    Lưu danh sách
                  </button>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
