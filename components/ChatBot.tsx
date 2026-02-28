"use client"

import { useState } from "react"

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<string[]>([])

  const sendMessage = async () => {
    if (!input) return

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    })

    const data = await res.json()

    setMessages([...messages, "Bạn: " + input, "Bot: " + data.reply])
    setInput("")
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
            }}
          >
            💬 Chat
          </button>
        )}

        {open && (
          <div
            style={{
              width: 300,
              height: 400,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              padding: 10,
            }}
          >
            <div style={{ flex: 1, overflowY: "auto" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {m}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Nhập câu hỏi..."
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 6,
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={sendMessage}
                  style={{
                    flex: 1,
                    background: '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Gửi
                </button>

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    background: '#f3f3f3',
                    color: '#333',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}