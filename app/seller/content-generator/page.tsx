"use client"

import { useState } from "react"

const categories = [
  "Lương thực", "Thực phẩm", "Dược liệu",
  "Thủ công mỹ nghệ", "Hàng tiêu dùng", "Đồ uống"
]

type ContentType = 'seo' | 'social' | 'tiktok'

export default function ContentGeneratorPage() {
  const [productName, setProductName] = useState("")
  const [description, setDescription] = useState("")
  const [highlights, setHighlights] = useState("")
  const [category, setCategory] = useState(categories[0])
  const [activeTab, setActiveTab] = useState<ContentType>('seo')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<ContentType, any>>({ seo: null, social: null, tiktok: null })
  const [copied, setCopied] = useState("")

  const generate = async (type: ContentType) => {
    if (!productName.trim()) {
      alert("Vui lòng nhập tên sản phẩm")
      return
    }
    setLoading(true)
    setActiveTab(type)
    try {
      const res = await fetch('/api/seller/generate-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productName, description, highlights, category, contentType: type })
      })
      const data = await res.json()
      if (res.ok && data.result) {
        setResults(prev => ({ ...prev, [type]: data.result }))
      } else {
        alert(data.error || 'Lỗi tạo nội dung')
      }
    } catch {
      alert('Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  const tabs: { key: ContentType; label: string; icon: string; desc: string }[] = [
    { key: 'seo', label: 'Mô tả SEO', icon: '🔍', desc: 'Tiêu đề, meta, từ khóa, nội dung tối ưu SEO' },
    { key: 'social', label: 'Facebook / Zalo', icon: '📱', desc: 'Caption, hashtags, CTA cho mạng xã hội' },
    { key: 'tiktok', label: 'Kịch bản TikTok', icon: '🎬', desc: 'Hook, scenes, âm nhạc cho video ngắn' },
  ]

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-green to-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-brand-green/20">
              ✨
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900">
                Công cụ Truyền thông AI
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Tạo nội dung marketing chuyên nghiệp cho sản phẩm OCOP</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Form */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <h2 className="font-heading font-bold text-slate-800 text-lg mb-5 flex items-center gap-2">
                📝 Thông tin sản phẩm
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">* Tên sản phẩm</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="VD: Gốm Phù Lãng"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Nhóm sản phẩm</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-sm cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Mô tả ngắn</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả sơ lược về sản phẩm..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-sm resize-y"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Điểm nổi bật</label>
                  <textarea
                    value={highlights}
                    onChange={e => setHighlights(e.target.value)}
                    placeholder="VD: Thủ công 100%, men gốm tự nhiên, truyền thống 700 năm..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none text-sm resize-y"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-3 font-medium">Chọn loại nội dung cần tạo:</p>
                <div className="grid grid-cols-1 gap-2">
                  {tabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => generate(t.key)}
                      disabled={loading}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 disabled:opacity-50 ${
                        activeTab === t.key && results[t.key]
                          ? 'bg-brand-green/5 border-brand-green/30 text-brand-green'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-green/30 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div>{t.label}</div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-8">
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === t.key
                      ? 'bg-brand-green text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center">
                <svg className="w-10 h-10 animate-spin text-brand-green mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="font-heading font-bold text-slate-600 text-lg">AI đang soạn thảo...</p>
                <p className="text-sm text-slate-400 mt-1">Quá trình này mất 10-30 giây</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !results[activeTab] && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                  {tabs.find(t => t.key === activeTab)?.icon}
                </div>
                <h3 className="font-heading font-bold text-slate-500 text-xl mb-2">
                  Chưa có nội dung {tabs.find(t => t.key === activeTab)?.label}
                </h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Điền thông tin sản phẩm bên trái và nhấn nút tạo nội dung tương ứng để bắt đầu.
                </p>
              </div>
            )}

            {/* SEO Results */}
            {!loading && activeTab === 'seo' && results.seo && (
              <div className="space-y-4">
                <ResultCard title="📌 Tiêu đề SEO" content={results.seo.title} onCopy={() => copyText(results.seo.title, 'title')} copied={copied === 'title'} />
                <ResultCard title="📝 Meta Description" content={results.seo.metaDescription} onCopy={() => copyText(results.seo.metaDescription, 'meta')} copied={copied === 'meta'} />
                {results.seo.keywords && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h4 className="font-heading font-bold text-slate-800 text-sm mb-3">🏷️ Từ khóa SEO</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.seo.keywords.map((kw: string, i: number) => (
                        <span key={i} className="bg-brand-green/10 text-brand-green text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-green/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <ResultCard title="📄 Nội dung chi tiết" content={results.seo.content} onCopy={() => copyText(results.seo.content, 'content')} copied={copied === 'content'} large />
              </div>
            )}

            {/* Social Results */}
            {!loading && activeTab === 'social' && results.social && (
              <div className="space-y-4">
                <ResultCard title="📱 Caption Facebook / Zalo" content={results.social.caption} onCopy={() => copyText(results.social.caption, 'caption')} copied={copied === 'caption'} large />
                <ResultCard title="#️⃣ Hashtags" content={results.social.hashtags} onCopy={() => copyText(results.social.hashtags, 'hashtags')} copied={copied === 'hashtags'} />
                <ResultCard title="📢 Kêu gọi hành động (CTA)" content={results.social.cta} onCopy={() => copyText(results.social.cta, 'cta')} copied={copied === 'cta'} />
                {results.social.tip && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200/60 p-5">
                    <h4 className="font-heading font-bold text-amber-800 text-sm mb-2">💡 Gợi ý đăng bài</h4>
                    <p className="text-sm text-amber-700">{results.social.tip}</p>
                  </div>
                )}
              </div>
            )}

            {/* TikTok Results */}
            {!loading && activeTab === 'tiktok' && results.tiktok && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-200/60 p-5">
                  <h4 className="font-heading font-bold text-pink-800 text-sm mb-2">🎣 Hook (3 giây đầu)</h4>
                  <p className="text-pink-900 font-semibold text-lg">{results.tiktok.hook}</p>
                  <button onClick={() => copyText(results.tiktok.hook, 'hook')} className="mt-2 text-xs text-pink-600 hover:text-pink-800 font-semibold">
                    {copied === 'hook' ? '✅ Đã copy!' : '📋 Copy hook'}
                  </button>
                </div>

                {results.tiktok.scenes && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h4 className="font-heading font-bold text-slate-800 text-sm mb-4">🎬 Kịch bản chi tiết</h4>
                    <div className="space-y-3">
                      {results.tiktok.scenes.map((scene: any, i: number) => (
                        <div key={i} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="shrink-0 w-16 text-center">
                            <span className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-1 rounded-full">
                              {scene.time}
                            </span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs text-slate-400 font-semibold">📷 Hình ảnh</p>
                            <p className="text-sm text-slate-700">{scene.visual}</p>
                            <p className="text-xs text-slate-400 font-semibold mt-2">🎤 Lời/Text</p>
                            <p className="text-sm text-slate-800 font-medium">{scene.script}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => copyText(
                        results.tiktok.scenes.map((s: any) => `[${s.time}]\n📷 ${s.visual}\n🎤 ${s.script}`).join('\n\n'),
                        'scenes'
                      )}
                      className="mt-3 text-xs text-brand-green hover:text-brand-green-dark font-semibold"
                    >
                      {copied === 'scenes' ? '✅ Đã copy!' : '📋 Copy toàn bộ kịch bản'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {results.tiktok.music && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <h4 className="font-heading font-bold text-slate-800 text-sm mb-2">🎵 Nhạc nền gợi ý</h4>
                      <p className="text-sm text-slate-600">{results.tiktok.music}</p>
                    </div>
                  )}
                  {results.tiktok.cta && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <h4 className="font-heading font-bold text-slate-800 text-sm mb-2">📢 CTA cuối video</h4>
                      <p className="text-sm text-slate-600 font-medium">{results.tiktok.cta}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ title, content, onCopy, copied, large }: {
  title: string; content: string; onCopy: () => void; copied: boolean; large?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-heading font-bold text-slate-800 text-sm">{title}</h4>
        <button onClick={onCopy} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
          copied ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 hover:bg-brand-green/10 hover:text-brand-green'
        }`}>
          {copied ? '✅ Đã copy!' : '📋 Copy'}
        </button>
      </div>
      <div className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${large ? 'max-h-[400px] overflow-y-auto' : ''}`}>
        {content}
      </div>
    </div>
  )
}
