"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProductDetail1() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/products/1")
  }, [])
  
  return <div>Redirecting...</div>
}