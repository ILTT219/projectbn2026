import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 mt-24 border-t-4 border-brand-green">
      <div className="container-custom grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
        
        {/* Brand Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border-2 border-brand-green/20 flex items-center justify-center bg-white transition-transform group-hover:scale-105">
              <img src="https://raw.githubusercontent.com/ILTT219/Image-storage/c674f7253196749a55fbdd18d6b540a4cdc5e1f2/12.png" alt="OCOP Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-xl tracking-tight leading-tight">OCOP Bắc Ninh</h3>
            </div>
          </div>
          <p className="leading-relaxed opacity-90 max-w-sm">
            Hệ thống quảng bá và phân phối các sản phẩm chất lượng cao OCOP thuộc chương trình Mỗi Xã Một Sản Phẩm của tỉnh Bắc Ninh. Tinh hoa vùng đất Kinh Bắc.
          </p>
        </div>
        
        {/* Quick Links */}
        <div className="space-y-6">
          <h4 className="text-white font-heading font-semibold tracking-wide text-base uppercase">Liên kết nhanh</h4>
          <ul className="space-y-3">
            <li><Link href="/" className="hover:text-brand-green transition-colors inline-flex items-center gap-2"><span className="w-1 h-1 bg-brand-green rounded-full"></span> Trang chủ</Link></li>
            <li><Link href="/products" className="hover:text-brand-green transition-colors inline-flex items-center gap-2"><span className="w-1 h-1 bg-brand-green rounded-full"></span> Sản phẩm OCOP</Link></li>
            <li><Link href="/contact" className="hover:text-brand-green transition-colors inline-flex items-center gap-2"><span className="w-1 h-1 bg-brand-green rounded-full"></span> Liên hệ hợp tác</Link></li>
            <li><Link href="/seller" className="hover:text-brand-green transition-colors inline-flex items-center gap-2"><span className="w-1 h-1 bg-brand-green rounded-full"></span> Kênh Người Bán</Link></li>
          </ul>
        </div>
        
        {/* Contact Info */}
        <div className="space-y-6">
          <h4 className="text-white font-heading font-semibold tracking-wide text-base uppercase">Thông tin liên hệ</h4>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
              <span className="text-brand-green mt-0.5">📍</span> 
              <span>Sở Nông nghiệp và Phát triển nông thôn tỉnh Bắc Ninh</span>
            </li>
            <li className="flex gap-3 items-center">
              <span className="text-brand-green">📞</span> 
              <span>0222.3822.456</span>
            </li>
            <li className="flex gap-3 items-center">
              <span className="text-brand-green">✉️</span> 
              <span>ocop@bacninh.gov.vn</span>
            </li>
          </ul>
        </div>

      </div>
      
      {/* Bottom Bar */}
      <div className="container-custom mt-16 pt-8 border-t border-slate-800 text-center flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <p className="opacity-70">&copy; {new Date().getFullYear()} Cổng Thông tin OCOP Bắc Ninh. Tất cả quyền được bảo lưu.</p>
        <div className="flex gap-4 opacity-70">
          <Link href="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
        </div>
      </div>
    </footer>
  );
}

