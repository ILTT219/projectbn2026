"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

export default function LiveSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchSuggest = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchSuggest()
      } else {
        setResults([])
      }
    }, 500) // Debounce

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <form action="/products" method="GET" className="relative w-full">
        <input
          type="text"
          name="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm kiếm nông sản, gợi ý..."
          className="w-full bg-white border border-slate-200 text-slate-900 rounded-full py-3.5 pl-6 pr-16 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all"
          autoComplete="off"
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-green text-white rounded-full flex items-center justify-center hover:bg-brand-green-dark transition-colors" aria-label="Tìm kiếm">
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </form>

      {/* Dropdown Results */}
      {isOpen && (query.trim() !== "" || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">Đang phân tích gợi ý...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((product) => (
                <li key={product.id} className="border-b border-slate-50 last:border-0">
                  <Link href={`/products/${product.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                      🌾
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm line-clamp-1">{product.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{product.origin || 'Bắc Ninh'}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">Không tìm thấy gợi ý nào. Nhấn Enter để tìm kiếm toàn bộ.</div>
          )}
        </div>
      )}
    </div>
  )
}
