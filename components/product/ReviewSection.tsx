"use client"

import { useState, useEffect } from 'react'

interface Review {
  id: number
  product_id: number
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
  seller_reply?: string | null
  seller_reply_at?: string | null
}

interface RatingStats {
  review_count: number
  avg_rating: number
  star_5: number
  star_4: number
  star_3: number
  star_2: number
  star_1: number
}

function StarRating({ rating, size = 'md', interactive = false, onChange }: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeMap[size]} ${interactive ? 'cursor-pointer' : ''} transition-colors duration-150 ${
            star <= (hover || rating) ? 'text-amber-400' : 'text-slate-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(star)}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-500 font-medium w-6 text-right">{label}</span>
      <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-400 font-mono text-xs w-8 text-right">{count}</span>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  const months = Math.floor(days / 30)
  return `${months} tháng trước`
}

export default function ReviewSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  // Reply state
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Kiểm tra seller/admin đã đăng nhập (cookie httpOnly nên phải gọi API)
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.loggedIn && (data.role === 'seller' || data.role === 'admin')) {
          setIsLoggedIn(true)
        }
      })
      .catch(() => {})
  }, [])

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) return
    setReplySubmitting(true)
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ review_id: reviewId, reply: replyText }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã gửi phản hồi!' })
        setReplyingTo(null)
        setReplyText('')
        fetchReviews()
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi gửi phản hồi' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setReplySubmitting(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`)
      const data = await res.json()
      if (res.ok) {
        setReviews(data.reviews || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Fetch reviews error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [productId])

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Vui lòng chọn số sao' })
      return
    }
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: name, rating, comment }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Đã gửi đánh giá!' })
        setName('')
        setRating(0)
        setComment('')
        setShowForm(false)
        fetchReviews()
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi gửi đánh giá' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <svg className="animate-spin w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
          ⭐ Đánh giá sản phẩm
          {stats && stats.review_count > 0 && (
            <span className="text-base font-normal text-slate-400">({stats.review_count})</span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-heading font-semibold text-sm py-2.5 px-5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          ✍️ Viết đánh giá
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Stats Overview */}
      {stats && stats.review_count > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            {/* Left: Big Rating */}
            <div className="text-center shrink-0">
              <div className="font-heading text-5xl font-bold text-slate-900 mb-1">
                {stats.avg_rating}
              </div>
              <StarRating rating={Math.round(stats.avg_rating)} size="md" />
              <p className="text-sm text-slate-400 mt-1.5">{stats.review_count} đánh giá</p>
            </div>

            {/* Right: Breakdown */}
            <div className="flex-1 w-full space-y-1.5">
              <RatingBar label="5" count={stats.star_5} total={stats.review_count} color="bg-green-500" />
              <RatingBar label="4" count={stats.star_4} total={stats.review_count} color="bg-lime-500" />
              <RatingBar label="3" count={stats.star_3} total={stats.review_count} color="bg-amber-400" />
              <RatingBar label="2" count={stats.star_2} total={stats.review_count} color="bg-orange-400" />
              <RatingBar label="1" count={stats.star_1} total={stats.review_count} color="bg-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-brand-green/20 shadow-sm p-6 mb-6">
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Chia sẻ trải nghiệm của bạn</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 font-heading block mb-2">Đánh giá sao *</label>
              <StarRating rating={rating} size="lg" interactive onChange={setRating} />
              {rating > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  {['', 'Rất tệ 😢', 'Tệ 😕', 'Bình thường 🙂', 'Tốt 😊', 'Tuyệt vời 🤩'][rating]}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 font-heading block mb-1.5">Tên hiển thị *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 font-heading block mb-1.5">Nhận xét</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700 py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                Hủy
              </button>
              <button type="submit" disabled={submitting} className="bg-brand-green hover:bg-brand-green-dark text-white font-heading font-semibold text-sm py-2.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-50">
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💭</div>
          <p className="text-slate-500 font-medium mb-2">Chưa có đánh giá nào</p>
          <p className="text-sm text-slate-400">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/5 flex items-center justify-center shrink-0 text-sm font-bold text-brand-green border border-brand-green/10">
                    {review.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-slate-900 text-sm">{review.reviewer_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{timeAgo(review.created_at)}</span>
                    </div>
                    <div className="mt-0.5">
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                  </div>
                </div>
                {/* Nút trả lời (chỉ hiện cho seller/admin) */}
                {isLoggedIn && !review.seller_reply && replyingTo !== review.id && (
                  <button
                    onClick={() => { setReplyingTo(review.id); setReplyText('') }}
                    className="text-xs text-brand-green hover:text-brand-green-dark font-semibold flex items-center gap-1 shrink-0 py-1 px-2 rounded-lg hover:bg-brand-green/5 transition-colors"
                  >
                    💬 Trả lời
                  </button>
                )}
              </div>

              {review.comment && (
                <p className="text-slate-600 text-sm leading-relaxed mt-3 pl-[52px]">
                  {review.comment}
                </p>
              )}

              {/* Phản hồi từ cửa hàng */}
              {review.seller_reply && (
                <div className="mt-3 ml-[52px] bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    </div>
                    <span className="text-xs font-bold text-emerald-800">Phản hồi từ cửa hàng</span>
                    {review.seller_reply_at && (
                      <span className="text-[10px] text-emerald-500">• {timeAgo(review.seller_reply_at)}</span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-700 leading-relaxed">{review.seller_reply}</p>
                </div>
              )}

              {/* Form trả lời inline */}
              {replyingTo === review.id && (
                <div className="mt-3 ml-[52px] border border-brand-green/20 rounded-xl p-3.5 bg-brand-green/5">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Viết phản hồi cho đánh giá này..."
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all resize-none"
                    rows={2}
                    maxLength={1000}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400">{replyText.length}/1000</span>
                    <div className="flex gap-2">
                      <button onClick={() => setReplyingTo(null)} className="text-xs text-slate-500 hover:text-slate-700 font-semibold py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                        Hủy
                      </button>
                      <button
                        onClick={() => submitReply(review.id)}
                        disabled={replySubmitting || !replyText.trim()}
                        className="text-xs bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-1.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {replySubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
