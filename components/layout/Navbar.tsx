"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<{ loggedIn: boolean, role: string | null }>({ loggedIn: false, role: null });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setAuthState(data))
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false;
    return pathname?.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
      <div className="container-custom h-[72px] flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center text-white font-heading font-extrabold text-xl shadow-md transition-transform group-hover:scale-105">
            O
          </div>
          <div className="hidden sm:flex flex-col justify-center leading-tight">
            <h1 className="font-heading font-bold text-slate-800 text-xl tracking-tight">OCOP Tinh Hoa</h1>
            <p className="text-[0.65rem] font-sans font-semibold tracking-[0.15em] text-brand-green uppercase">Bắc Ninh</p>
          </div>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/" active={isActive("/")}>Trang chủ</NavLink>
            <NavLink href="/products" active={isActive("/products")}>Sản phẩm</NavLink>
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          
          {/* Auth Zone */}
          {!authState.loggedIn ? (
            <div className="flex items-center gap-3">
              <Link href="/login" className="ocop-btn-alt text-xs py-2 px-4 hidden sm:inline-flex">
                Đăng nhập
              </Link>
              <Link href="/register" className="ocop-btn text-xs py-2 px-4">
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
               <Link href={authState.role === 'admin' ? '/admin' : '/seller'} className="ocop-btn text-xs py-2 px-4 shadow-brand-green/20">
                 Kênh Quản Trị
               </Link>
               <button 
                 onClick={handleLogout}
                 className="text-sm font-sans text-slate-500 hover:text-brand-red transition-colors font-medium"
               >
                 Đăng xuất
               </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`font-heading text-sm font-semibold transition-all relative py-1 ${active ? 'text-brand-green' : 'text-slate-600 hover:text-brand-green'}`}
    >
      {children}
      {active && (
        <span className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-brand-green rounded-full"></span>
      )}
    </Link>
  );
}
