"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

const categories: Record<number, string> = {
  1: 'Lương thực',
  2: 'Thực phẩm',
  3: 'Dược liệu',
  4: 'Thủ công mỹ nghệ',
  5: 'Hàng tiêu dùng',
  6: 'Đồ uống',
}

const STORAGE_KEY = 'ocop_viewed_products'

// Lưu sản phẩm đã xem vào localStorage
export function trackProductView(productId: number) {
  if (typeof window === 'undefined') return
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as number[]
    const filtered = stored.filter(id => id !== productId)
    filtered.unshift(productId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)))
  } catch {}
}

function getViewedProducts(): number[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as number[]
  } catch {
    return []
  }
}

interface Product {
  id: number
  name: string
  img?: string
  origin?: string
  category_id?: number
}

export default function RecommendedProducts({ productId, categoryId }: { productId: number; categoryId?: number }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const viewed = getViewedProducts()
        const params = new URLSearchParams({
          product_id: productId.toString(),
          category_id: (categoryId || 0).toString(),
          viewed_ids: viewed.join(','),
          limit: '6'
        })
        const res = await fetch(`/api/products/recommendations?${params}`)
        const data = await res.json()
        setProducts(data.recommendations || [])
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [productId, categoryId])

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          🔗 Sản phẩm liên quan
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
          🔗 Sản phẩm liên quan
        </h2>
        <Link href="/products" className="text-brand-green font-semibold text-sm hover:text-brand-green-dark transition-colors inline-flex items-center gap-1 group">
          Xem tất cả <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="block group">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-brand-green/30 transition-all group-hover:-translate-y-1 duration-300">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                {p.img ? (
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🌾</div>
                )}
                {p.category_id && (
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-brand-green px-2 py-1 rounded-full border border-brand-green/10 uppercase tracking-wide">
                    {categories[p.category_id] || ''}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-heading font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-brand-green transition-colors leading-snug">
                  {p.name}
                </h3>
                {p.origin && (
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    📍 {p.origin}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
