/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Image as ImageIcon, 
  MapPin, 
  Tag, 
  Info, 
  Download, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  Upload,
  X,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FormData {
  logo: string;
  logo_image: string | null;
  ten_san_pham: string;
  xuat_xu: string;
  dac_diem: string;
  yeu_cau_hinh_anh: string;
  anh_that: string[];
  aspect_ratio: "1:1" | "16:9";
}

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    logo: '',
    logo_image: null,
    ten_san_pham: '',
    xuat_xu: '',
    dac_diem: '',
    yeu_cau_hinh_anh: '',
    anh_that: [],
    aspect_ratio: '1:1',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo_image: null }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 2 - formData.anh_that.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setFormData(prev => ({ 
            ...prev, 
            anh_that: [...prev.anh_that, result].slice(0, 2) 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      anh_that: prev.anh_that.filter((_, i) => i !== index) 
    }));
  };

  const generateImage = async () => {
    if (!formData.ten_san_pham) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Create a professional artistic advertising background for a Vietnamese OCOP (One Commune, One Product) product.
        
        ${formData.anh_that.length > 0 ? `I have provided ${formData.anh_that.length} real photo(s) of the product. Please use these photos as the primary reference for the product's appearance, packaging, and label. Ensure the product in the poster looks consistent with the provided images.` : ''}
        
        Product Name: ${formData.ten_san_pham}
        Origin: ${formData.xuat_xu}
        Key Features: ${formData.dac_diem}
        Logo/Brand: ${formData.logo_image ? 'I have provided the EXACT brand logo image. You MUST use this specific logo as the only source for the brand identity. Do not generate a new logo.' : (formData.logo || 'Professional brand logo')}
        User Requirements: ${formData.yeu_cau_hinh_anh}
        
        Design Style Requirements:
        - High-end commercial photography style, studio lighting.
        - The product should be the central focus, looking realistic and appealing.
        - IMPORTANT: Use the EXACT logo provided in the input image. Place this original logo at the TOP CENTER of the generated image. Do not invent, modify, or generate a new logo. The logo should look like it was professionally placed on the final poster.
        - DO NOT include any other arbitrary text, typography, or letters on the image. No product names or origin text should be rendered as text labels.
        - Focus entirely on the artistic context, background, and the visual presentation of the product.
        - Incorporate subtle traditional Vietnamese cultural elements or motifs related to ${formData.xuat_xu} if applicable (e.g., Kinh Bac patterns, traditional silk, bamboo, or local landscapes).
        - Composition should be balanced, clean, and professional.
        - Lighting should be natural and enhance the product's texture and details.
        - Overall mood: Trustworthy, premium, authentic, and culturally rich.
        - Aspect ratio: ${formData.aspect_ratio}.
        - No distorted shapes, maintain realistic product features.
      `;

      const parts: any[] = [{ text: prompt }];
      
      // Add logo image if exists
      if (formData.logo_image) {
        parts.unshift({
          inlineData: {
            data: formData.logo_image.split(',')[1],
            mimeType: formData.logo_image.match(/data:(.*?);base64/)?.[1] || 'image/png'
          }
        });
      }

      // Add product images
      formData.anh_that.forEach(imgData => {
        const mimeType = imgData.match(/data:(.*?);base64/)?.[1] || 'image/png';
        parts.unshift({
          inlineData: {
            data: imgData.split(',')[1],
            mimeType: mimeType
          }
        });
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: formData.aspect_ratio,
          },
        },
      });

      let imageUrl = null;
      let textResponse = "";

      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            textResponse += part.text;
          }
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        // If no image but we have text, it might be an error message from the model
        if (textResponse) {
          throw new Error(`AI phản hồi: ${textResponse}`);
        } else {
          throw new Error("Không thể tạo hình ảnh. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.");
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định trong quá trình tạo hình ảnh.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `OCOP-${formData.ten_san_pham || 'Product'}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-bottom border-zinc-200 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">Sáng Tạo OCOP</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="text-zinc-900">Thiết kế</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Thư viện</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Hướng dẫn</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold leading-tight">
              Kiến tạo hình ảnh <br />
              <span className="text-emerald-600 italic">Thương hiệu OCOP</span>
            </h1>
            <p className="text-zinc-500">
              Nhập thông tin sản phẩm để AI tạo ra những poster quảng cáo chuyên nghiệp, mang đậm bản sắc Việt.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layout size={14} /> Logo / Thương hiệu
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="logo"
                    placeholder="Tên thương hiệu (ví dụ: HTX Nông nghiệp A)"
                    className="input-field"
                    value={formData.logo}
                    onChange={handleInputChange}
                  />
                  <div className="relative">
                    {formData.logo_image ? (
                      <div className="relative w-full h-20 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center p-2">
                        <img src={formData.logo_image} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        <button
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-emerald-500/50 transition-all group">
                        <div className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-sm text-zinc-500">Tải ảnh Logo</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Tag size={14} /> Tên sản phẩm
                </label>
                <input
                  type="text"
                  name="ten_san_pham"
                  placeholder="Ví dụ: Trà sen Tây Hồ"
                  className="input-field"
                  value={formData.ten_san_pham}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <MapPin size={14} /> Xuất xứ
                </label>
                <input
                  type="text"
                  name="xuat_xu"
                  placeholder="Ví dụ: Tây Hồ, Hà Nội"
                  className="input-field"
                  value={formData.xuat_xu}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Info size={14} /> Đặc điểm nổi bật
                </label>
                <textarea
                  name="dac_diem"
                  rows={3}
                  placeholder="Ví dụ: Hương thơm thanh khiết, vị ngọt hậu, đóng gói thủ công..."
                  className="input-field resize-none"
                  value={formData.dac_diem}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ImageIcon size={14} /> Ảnh thật sản phẩm (Tối đa 02 ảnh)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.anh_that.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                      <img src={img} alt={`Product preview ${index + 1}`} className="w-full h-full object-contain" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {formData.anh_that.length < 2 && (
                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-emerald-500/50 transition-all group">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 transition-colors mb-1" />
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">Tải ảnh {formData.anh_that.length + 1}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ImageIcon size={14} /> Kích thước ảnh
                </label>
                <div className="flex gap-3">
                  {(["1:1", "16:9"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setFormData(prev => ({ ...prev, aspect_ratio: ratio }))}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-xl border text-sm font-medium transition-all",
                        formData.aspect_ratio === ratio
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      )}
                    >
                      {ratio === "1:1" ? "Hình vuông (1:1)" : "Nằm ngang (16:9)"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <ImageIcon size={14} /> Yêu cầu hình ảnh
                </label>
                <textarea
                  name="yeu_cau_hinh_anh"
                  rows={3}
                  placeholder="Ví dụ: Phong cách tối giản, nền gỗ, ánh sáng ấm áp..."
                  className="input-field resize-none"
                  value={formData.yeu_cau_hinh_anh}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={generateImage}
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2 group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang thiết kế...
                </>
              ) : (
                <>
                  Bắt đầu sáng tạo
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-28">
            <div className={cn(
              "w-full glass-card rounded-3xl overflow-hidden relative group transition-all duration-500",
              formData.aspect_ratio === "1:1" ? "aspect-square" : "aspect-video"
            )}>
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full"
                  >
                    <img
                      src={generatedImage}
                      alt="Generated OCOP Ad"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        onClick={downloadImage}
                        className="p-4 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform shadow-lg"
                        title="Tải xuống"
                      >
                        <Download size={24} />
                      </button>
                      <button
                        onClick={generateImage}
                        className="p-4 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform shadow-lg"
                        title="Tạo lại"
                      >
                        <RefreshCw size={24} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                      <ImageIcon size={40} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-xl font-bold">Chưa có thiết kế</h3>
                      <p className="text-zinc-500 max-w-xs">
                        Điền thông tin bên trái và nhấn nút "Bắt đầu sáng tạo" để xem kết quả.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isGenerating && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-zinc-900">AI đang phân tích sản phẩm...</p>
                    <p className="text-xs text-zinc-500">Quá trình này có thể mất vài giây</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tips/Info */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Mẹo thiết kế</h4>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Hãy mô tả chi tiết về bao bì và bối cảnh để AI hiểu rõ hơn về phong cách bạn muốn.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Định dạng</h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Hình ảnh được tạo với tỉ lệ 1:1, độ phân giải cao, phù hợp cho Facebook và Instagram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <p>© 2024 Thiết Kế Quảng Cáo OCOP. Được vận hành bởi Gemini AI.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-600">Điều khoản</a>
            <a href="#" className="hover:text-zinc-600">Bảo mật</a>
            <a href="#" className="hover:text-zinc-600">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
