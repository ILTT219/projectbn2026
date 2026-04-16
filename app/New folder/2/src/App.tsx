import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MapPin, 
  Award, 
  Package, 
  Building2, 
  ChevronRight, 
  Copy, 
  Check, 
  Loader2,
  Search,
  FileText,
  RefreshCw
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateOcopContent } from './services/gemini';
import { OcopFormData, GeneratedContent } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_FORM: OcopFormData = {
  productName: '',
  subject: '',
  location: '',
  productGroup: '',
  highlights: '',
  certification: '',
  localStory: '',
};

export default function App() {
  const [formData, setFormData] = useState<OcopFormData>(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const data = await generateOcopContent(formData);
      setResult(data);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-brand-red/10 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-brand-red/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif text-brand-red leading-none">OCOP Bắc Ninh</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Trợ lý Nội dung AI</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="hover:text-brand-red cursor-pointer transition-colors">Hướng dẫn</span>
            <span className="hover:text-brand-red cursor-pointer transition-colors">Mẫu nội dung</span>
            <button 
              onClick={() => { setFormData(INITIAL_FORM); setResult(null); }}
              className="flex items-center gap-1 text-brand-red hover:bg-brand-red/5 px-3 py-1.5 rounded-full transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Section */}
          <section className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="mb-8">
                <h2 className="text-2xl text-slate-900 mb-2">Thông tin sản phẩm</h2>
                <p className="text-slate-500 text-sm">Cung cấp thông tin cơ bản để AI tạo nội dung chuẩn nhất.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Tên sản phẩm
                  </label>
                  <input
                    required
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="VD: Trà hoa vàng Quế Võ"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" /> Chủ thể OCOP
                    </label>
                    <input
                      required
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Tên HTX/Doanh nghiệp"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> Địa phương
                    </label>
                    <input
                      required
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Huyện/Thị xã/Thành phố"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" /> Nhóm sản phẩm
                    </label>
                    <select
                      required
                      name="productGroup"
                      value={formData.productGroup}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none appearance-none"
                    >
                      <option value="">Chọn nhóm...</option>
                      <option value="Lương thực">Lương thực</option>
                      <option value="Thực phẩm">Thực phẩm</option>
                      <option value="Dược liệu">Dược liệu</option>
                      <option value="Đồ uống">Đồ uống</option>
                      <option value="Hàng tiêu dùng">Hàng tiêu dùng</option>
                      <option value="Thủ công mỹ nghệ">Thủ công mỹ nghệ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" /> Chứng nhận
                    </label>
                    <select
                      required
                      name="certification"
                      value={formData.certification}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none appearance-none"
                    >
                      <option value="">Chọn hạng sao...</option>
                      <option value="3 sao">OCOP 3 sao</option>
                      <option value="4 sao">OCOP 4 sao</option>
                      <option value="5 sao">OCOP 5 sao (Quốc gia)</option>
                      <option value="Tiềm năng 5 sao">Tiềm năng 5 sao</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Câu chuyện địa phương
                  </label>
                  <textarea
                    name="localStory"
                    value={formData.localStory}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="VD: Sản phẩm gắn liền với truyền thuyết về trạng nguyên, hoặc lịch sử làng nghề 500 năm..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Điểm nổi bật
                  </label>
                  <textarea
                    required
                    name="highlights"
                    value={formData.highlights}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="VD: Quy trình canh tác hữu cơ, không chất bảo quản, hương vị đặc trưng của vùng đất Kinh Bắc..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                    isGenerating 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-brand-red hover:bg-red-800 active:scale-[0.98] shadow-brand-red/30"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang tạo nội dung...
                    </>
                  ) : (
                    <>
                      Tạo nội dung ngay
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </section>

          {/* Results Section */}
          <section className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!result && !isGenerating ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white/40 border-2 border-dashed border-slate-200 rounded-3xl"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl text-slate-400 font-serif">Chưa có nội dung được tạo</h3>
                  <p className="text-slate-400 max-w-xs mt-2">Điền thông tin bên trái và nhấn nút để bắt đầu hành trình quảng bá sản phẩm của bạn.</p>
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-inner"
                >
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-brand-red animate-spin" />
                    <Sparkles className="w-6 h-6 text-brand-gold absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h3 className="text-xl text-brand-red font-serif mt-6">Đang dệt nên câu chuyện...</h3>
                  <p className="text-slate-500 max-w-sm mt-2">AI đang phân tích dữ liệu và lồng ghép tinh hoa văn hóa Kinh Bắc vào nội dung của bạn.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Description Card */}
                  <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-brand-red px-6 py-4 flex items-center justify-between">
                      <h3 className="text-white text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" /> Mô tả chi tiết sản phẩm
                      </h3>
                      <button 
                        onClick={() => copyToClipboard(result!.description, 'desc')}
                        className="text-white/80 hover:text-white flex items-center gap-1 text-sm bg-white/10 px-3 py-1 rounded-full transition-colors"
                      >
                        {copiedSection === 'desc' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedSection === 'desc' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div className="p-6 md:p-8 text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                      {result!.description}
                    </div>
                  </div>

                  {/* SEO Card */}
                  <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
                      <h3 className="text-white text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-brand-gold" /> Tối ưu hóa SEO
                      </h3>
                      <button 
                        onClick={() => copyToClipboard(result!.seoContent, 'seo')}
                        className="text-white/60 hover:text-white flex items-center gap-1 text-sm bg-white/5 px-3 py-1 rounded-full transition-colors"
                      >
                        {copiedSection === 'seo' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedSection === 'seo' ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div className="p-6 md:p-8 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      <Markdown>{result!.seoContent}</Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-10 text-center">
        <p className="text-slate-400 text-sm">© 2024 OCOP Bắc Ninh Content Assistant. Phát triển bởi AI Studio.</p>
        <div className="flex justify-center gap-4 mt-4 opacity-50 grayscale">
          <img src="https://picsum.photos/seed/ocop/100/40" alt="OCOP Logo" className="h-8" referrerPolicy="no-referrer" />
          <img src="https://picsum.photos/seed/bacninh/100/40" alt="Bac Ninh Logo" className="h-8" referrerPolicy="no-referrer" />
        </div>
      </footer>
    </div>
  );
}
