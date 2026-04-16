"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProductDetail2() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/products/2")
  }, [])
  
  return <div>Redirecting...</div>
}