"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin',
      })

      // consume JSON body for debugging and error display
      const data = await res.json().catch(() => ({}))
      console.log('Admin login response', { status: res.status, ok: res.ok, body: data })

      setLoading(false)
      if (res.ok) {
        // cookie should be set by the server (path=/); do a full navigation
        // so the browser includes the cookie on the request (avoid RSC prefetch)
        window.location.href = '/admin'
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err: any) {
      setLoading(false)
      console.error('Login fetch error', err)
      setError('Network error')
    }
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ color: '#2f6f3e', marginBottom: 30 }}>Admin Login</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontWeight: 600 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd' }}
        />

        <label style={{ fontWeight: 600 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd' }}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          type="submit"
          style={{
            padding: '12px 20px',
            borderRadius: 6,
            border: 'none',
            background: 'linear-gradient(90deg, #1b5e20, #2e7d32)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
