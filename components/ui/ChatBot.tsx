"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ChatMessage {
  role: "user" | "bot"
  content: string
}

export default function ChatBot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    // Thêm tin nhắn của user
    const userMessage: ChatMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })

      const data = await res.json()
      const reply = data.reply || "Có lỗi xảy ra"
      const botMessage: ChatMessage = { role: "bot", content: reply }
      setMessages((prev) => [...prev, botMessage])

      // Kiểm tra nếu response chứa link sản phẩm và tự động điều hướng
      const productLinkRegex = /\/products\/(\d+)/
      const match = reply.match(productLinkRegex)
      if (match) {
        const productId = match[1]
        setTimeout(() => {
          router.push(`/products/${productId}`)
          setOpen(false)
        }, 800)
      }
    } catch (err) {
      const botMessage: ChatMessage = { role: "bot", content: "Không thể kết nối đến server" }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "#16a34a",
              color: "white",
              padding: "12px 16px",
              borderRadius: "50px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.05)"
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(22, 163, 74, 0.4)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.3)"
            }}
          >
            💬 Tư vấn ngay
          </button>
        )}

        {open && (
          <div
            style={{
              width: 350,
              height: 500,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "#16a34a",
                color: "white",
                padding: "16px",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>🌿 Tư vấn sản phẩm</span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 18,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "#f9fafb",
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#999",
                    marginTop: "auto",
                    marginBottom: "auto",
                    padding: "20px",
                  }}
                >
                  <p style={{ fontSize: 14, marginBottom: 8 }}>
                    👋 Xin chào! Tôi là trợ lý tư vấn sản phẩm
                  </p>
                  <p style={{ fontSize: 12 }}>
                    Hãy đặt câu hỏi về các sản phẩm của chúng tôi
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: msg.role === "user" ? "#16a34a" : "#e5e7eb",
                      color: msg.role === "user" ? "white" : "#333",
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordWrap: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", gap: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#16a34a",
                      animation: "dot-bounce 1.4s infinite",
                    }}
                  ></div>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#16a34a",
                      animation: "dot-bounce 1.4s infinite",
                      animationDelay: "0.2s",
                    }}
                  ></div>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#16a34a",
                      animation: "dot-bounce 1.4s infinite",
                      animationDelay: "0.4s",
                    }}
                  ></div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !loading) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Nhập câu hỏi..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    background: loading || !input.trim() ? "#d1d5db" : "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 6,
                    cursor: loading || !input.trim() ? "default" : "pointer",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  {loading ? "..." : "Gửi"}
                </button>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  style={{
                    width: "100%",
                    background: "#f3f4f6",
                    color: "#666",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#e5e7eb"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#f3f4f6"
                  }}
                >
                  Xóa lịch sử
                </button>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes dot-bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    </>
  )
}