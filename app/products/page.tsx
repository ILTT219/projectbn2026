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

const images: Record<number, string> = {
  1: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/2.jpg",
  2: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/3.jpg",
  3: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/4.jpg",
  4: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/5.jpg",
  5: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/6.jpg",
  6: "https://raw.githubusercontent.com/ILTT219/Image-storage/e3bafca79afca99ee318e82959982cc5697a40b4/7.jpg",
}

// sample product data (each product has categoryId 1-6)
// products will be loaded from Supabase table `products`
// each row should include id, name, category_id
const products: Array<{id:number;name:string;categoryId:number;img?: string}> = []

export default function ProductsPage() {
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [productList, setProductList] = useState<typeof products>(products)

  // fetch products from Supabase table when component mounts
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category_id, img")
      
      console.log("Supabase error:", error)
      console.log("Supabase data:", data)
      
      if (error) {
        console.error("Fetch failed:", error.message)
        return
      }
      if (data) {
        console.log("Fetched products:", data)
        setProductList(
          data.map((r: any) => ({
            id: r.id,
            name: r.name,
            categoryId: r.category_id,
            img: r.img || undefined,
          }))
        )
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return productList.filter((p) => {
      if (activeCategory && p.categoryId !== activeCategory) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q)
    })
  }, [query, activeCategory, productList])

  return (
    <div className="container">
      <h1>Danh sách sản phẩm</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input
          aria-label="Tìm kiếm sản phẩm"
          placeholder="Tìm sản phẩm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", minWidth: 220 }}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: "8px 12px", borderRadius: 8, border: activeCategory === null ? "2px solid #2f6f3e" : "1px solid #ddd", background: activeCategory === null ? "#e8f5e9" : "white" }}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{ padding: "8px 12px", borderRadius: 8, border: activeCategory === c.id ? "2px solid #2f6f3e" : "1px solid #ddd", background: activeCategory === c.id ? "#e8f5e9" : "white" }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {filtered.length === 0 && <div>Không tìm thấy sản phẩm.</div>}
        {filtered.map((p) => {
          const cat = categories.find((c) => c.id === p.categoryId)
          return (
            <Link key={p.id} href={`/products/${p.id}`}>
              <div
                className="card"
                data-name={p.name}
                style={{
                  cursor: "pointer",
                  padding: 0,
                  border: "2px solid #2f6f3e",
                  borderRadius: 8,
                  backgroundImage: p.img ? `url(${p.img})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: 200,
                }}
              >
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}