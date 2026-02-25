"use client"

import { useState } from "react"

export default function AdminPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        price: Number(price),
      }),
    })

    const result = await res.json()

    if (result.error) {
      setMessage("Lỗi khi thêm sản phẩm")
    } else {
      setMessage("Thêm sản phẩm thành công")
      setName("")
      setPrice("")
    }
  }

  return (
    <div>
      <h1>Quản trị - Thêm sản phẩm</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
        <div>
          <label>Tên sản phẩm</label>
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        

        <div style={{ marginTop: 15 }}>
          <label>Giá</label>
          <br />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <button style={{ marginTop: 20 }} type="submit">
          Thêm sản phẩm
        </button>
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  )
}