"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

interface Product {
  id: number
  name: string
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

  // create client with no-cache wrapper so browser won't reuse stale responses
  // the wrapper must match the Fetch API signature (input can be URL or RequestInfo)
  const fetchFn: typeof fetch = (input, init) => {
    const opts: RequestInit = { ...(init || {}), cache: 'no-store' }
    return fetch(input, opts)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // override global fetch to disable HTTP caching
      global: { fetch: fetchFn },
    }
  )

  useEffect(() => {
    let productSub: any = null
    let imagesSub: any = null

    async function load() {
      try {
        const id = Number(idParam)
        if (Number.isNaN(id)) {
          setError("ID không hợp lệ")
          setLoading(false)
          return
        }

        // fetch product
        const { data: productData, error: prodErr } = await supabase
          .from("products")
          .select("id, name, description, img, origin, contact_address")
          .eq("id", id)
          .single()

        if (prodErr || !productData) {
          setError("Không tìm thấy sản phẩm")
          setLoading(false)
          return
        }

        setProduct(productData)

        // fetch images
        const { data: imagesData } = await supabase
          .from("images")
          .select("image_url")
          .eq("product_id", id)

        setImages(imagesData || [])

        // track view
        try {
          await fetch("/api/products/track-view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: id }),
          })
        } catch (e) {
          // silently fail
        }

        // subscribe to realtime updates on this product and its images
        productSub = supabase
          .channel(`product-updates-${id}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
            (payload) => {
              if (payload.new) setProduct(payload.new as Product)
            }
          )
          .subscribe()

        imagesSub = supabase
          .channel(`product-images-${id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'images', filter: `product_id=eq.${id}` },
            (payload) => {
              if (payload.new) {
                setImages((prev) => [...prev, payload.new as ProductImage])
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'images', filter: `product_id=eq.${id}` },
            (payload) => {
              if (payload.old) {
                setImages((prev) => prev.filter((img) => img.image_url !== payload.old.image_url))
              }
            }
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
    return <div className="container">Đang tải...</div>
  }

  if (error || !product) {
    return (
      <div className="container">
        <div>{error || "Không tìm thấy sản phẩm"}</div>
        <div style={{ marginTop: 12 }}>
          <Link href="/products">Quay lại danh sách</Link>
        </div>
      </div>
    )
  }

  const hasImages = images && images.length > 0
  const shouldShowAside = hasImages

  return (
    <div className="container">
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1, ...(shouldShowAside ? {} : { maxWidth: 600, margin: "0 auto" }) }}>
          <h1>{product.name}</h1>
          {product.img && (
            <img
              src={product.img}
              alt={product.name}
              style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 12 }}
            />
          )}
          

          <h3 className="section-title">Thông tin chi tiết</h3>
          {product.description && <p>{product.description}</p>}
          {product.origin && (
            <p>
              <strong>Xuất xứ:</strong> {product.origin}
            </p>
          )}
          {product.contact_address && (
            <p>
              <strong>Địa chỉ liên hệ:</strong> {product.contact_address}
            </p>
          )}
        </div>

        {shouldShowAside && (
          <aside style={{ width: 320 }}>
            <h4>Hình ảnh</h4>
            {images.map((it: ProductImage, idx: number) => (
              <img
                key={idx}
                src={it.image_url}
                alt={`product-${product.id}-img-${idx}`}
                style={{ width: "100%", marginBottom: 8, borderRadius: 6 }}
              />
            ))}
          </aside>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/products">Quay lại danh sách</Link>
      </div>
    </div>
  )
}
