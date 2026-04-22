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

              {messages.map((msg, i) => {
                const isUser = msg.role === "user"
                
                // Parse markdown-style product links: [Product Name](/products/ID)
                const markdownLinkRegex = /\[([^\]]+)\]\(\/products\/(\d+)\)/g
                const productMap = new Map<string, string>() // id -> name (dedup)
                let match
                while ((match = markdownLinkRegex.exec(msg.content)) !== null) {
                  if (!productMap.has(match[2])) {
                    productMap.set(match[2], match[1])
                  }
                }

                // Also catch bare /products/ID links (without markdown syntax)
                const bareLinksRegex = /(?<!\]\()\/products\/(\d+)/g
                while ((match = bareLinksRegex.exec(msg.content)) !== null) {
                  if (!productMap.has(match[1])) {
                    productMap.set(match[1], `Sản phẩm #${match[1]}`)
                  }
                }

                // Clean the display text:
                // 1. Replace [Name](/products/ID) with just Name
                // 2. Remove any remaining bare (/products/ID) or /products/ID references
                let formattedContent = msg.content
                  .replace(/\[([^\]]+)\]\(\/products\/\d+\)/g, '$1')
                  .replace(/\s*\(\/products\/\d+\)/g, '')
                  .replace(/(?<=\s|^)\/products\/\d+/g, '')
                
                const productEntries = Array.from(productMap.entries())

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                        background: isUser ? "#16a34a" : "#e5e7eb",
                        color: isUser ? "white" : "#333",
                        fontSize: 14,
                        lineHeight: 1.5,
                        wordWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {formattedContent}
                    </div>
                    {productEntries.length > 0 && !isUser && (
                       <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, width: "80%" }}>
                         {productEntries.map(([id, name]) => (
                           <a 
                             key={id} 
                             href={`/products/${id}`}
                             style={{
                               display: "flex", alignItems: "center", justifyContent: "space-between",
                               padding: "8px 12px", background: "white", border: "1px solid #16a34a",
                               borderRadius: 8, textDecoration: "none", color: "#16a34a", fontSize: 13, fontWeight: "bold"
                             }}
                           >
                             <span style={{flex:1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>🛒 {name}</span>
                             <span>→</span>
                           </a>
                         ))}
                       </div>
                    )}
                  </div>
                )
              })}

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