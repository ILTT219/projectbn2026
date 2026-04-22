"use client"

import { useState } from 'react'

interface HistoryItem {
  id: number
  prompt: string
  url: string
  style: string
}

export default function AIStudioPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('flux-realism')
  const [loading, setLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')

  const styles = [
    { id: 'flux-realism', name: 'Siêu thực (Flux Realism)' },
    { id: 'flux', name: 'Tiêu chuẩn (Flux)' },
    { id: 'flux-anime', name: 'Anime / Hoạt hình' },
    { id: 'flux-3d', name: '3D Render' },
    { id: 'any-dark', name: 'Nghệ thuật Tối (Dark Art)' },
  ]

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Vui lòng nhập từ khóa tạo ảnh!');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Bổ sung prompt để chất lượng cao hơn
      const enhancedPrompt = `${prompt}, masterpiece, 8k, highly detailed, no watermarks, professional`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}&model=${style}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tạo ảnh');
      
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setCurrentImage(objectUrl);
      setHistory(prev => [{
        id: Date.now(),
        prompt: prompt,
        url: objectUrl,
        style: styles.find(s => s.id === style)?.name || style
      }, ...prev]);

    } catch (err: any) {
      setError('Lỗi tạo ảnh: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-800">✨ AI Studio</h2>
          <p className="text-slate-500 mt-1">Trạm kiểm thử hình ảnh hoàn toàn miễn phí. Hãy thử nghiệm các từ khóa (Prompt) và phong cách khác nhau tại đây.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột Công cụ (Trái) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 text-lg">Bảng Điều Khiển</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả bức ảnh (Prompt)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: Một chai mật ong OCOP đặt trên tảng đá trong rừng sâu, ánh nắng chiếu rọi, phong cách điện ảnh..."
                  className="w-full border border-slate-200 rounded-xl p-3 h-32 focus:ring-2 focus:ring-brand-gold outline-none text-sm transition-all"
                ></textarea>
                <button
                  onClick={() => setPrompt(`Product photography, pure product isolation. Center focus on the main object: [TÊN SẢN PHẨM Ở ĐÂY].\nCRITICAL REQUIREMENT: The core object MUST REMAIN 100% ORIGINAL and UNTOUCHED. Do not change its shape, color, text, logo, or design.\nONLY change the SURROUNDING BACKGROUND and LIGHTING to: [MÔ TẢ NỀN Ở ĐÂY].\nCinematic studio lighting, 8k resolution, photorealistic DSLR, masterpiece. NO fictional text, NO watermarks.`)}
                  className="mt-2 text-xs text-brand-gold hover:text-yellow-600 font-semibold flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Dùng Template Giữ Nguyên Vật Thể
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô hình / Phong cách</label>
                <div className="flex flex-col gap-2">
                  {styles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all ${style === s.id ? 'bg-brand-gold text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={generateImage}
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo ảnh...
                  </>
                ) : (
                  'Tạo Ảnh Ngay'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cột Hiển thị (Phải) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-xl flex items-center justify-center min-h-[500px] relative overflow-hidden">
            {loading && (
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-brand-gold font-bold animate-pulse">AI đang vẽ bức tranh của bạn...</p>
               </div>
            )}
            
            {currentImage ? (
              <img src={currentImage} alt="Generated AI" className="max-w-full max-h-[600px] rounded-2xl shadow-2xl object-contain" />
            ) : (
              <div className="text-center text-slate-500">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="text-lg">Khu vực hiển thị ảnh</p>
                <p className="text-sm">Hãy nhập mô tả và bấm tạo ảnh</p>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">Lịch sử Phiên làm việc</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="group relative rounded-xl overflow-hidden border border-slate-200 cursor-pointer" onClick={() => setCurrentImage(item.url)}>
                    <img src={item.url} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <p className="text-white text-xs font-semibold line-clamp-2">{item.prompt}</p>
                      <p className="text-brand-gold text-[10px] mt-1">{item.style}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
