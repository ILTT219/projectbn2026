-- =============================================
-- HỆ THỐNG BẢO MẬT: 2FA & LỌC IP KHẢ NGHI
-- Chạy script này trên Supabase SQL Editor
-- =============================================

-- 1. Thêm cột phone và two_factor_enabled vào bảng users
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN DEFAULT FALSE;

-- 2. Bảng OTP: lưu mã xác minh tạm thời
CREATE TABLE IF NOT EXISTS "public"."otp_codes" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "public"."users"(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE "public"."otp_codes" ENABLE ROW LEVEL SECURITY;

-- 3. Bảng Login Attempts: theo dõi lịch sử đăng nhập
CREATE TABLE IF NOT EXISTS "public"."login_attempts" (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(255),
    user_id INTEGER REFERENCES "public"."users"(id) ON DELETE SET NULL,
    success BOOLEAN DEFAULT FALSE,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON "public"."login_attempts"(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON "public"."login_attempts"(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_email ON "public"."login_attempts"(ip_address, email);
ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;

-- 4. Bảng Blocked IPs: danh sách IP bị chặn
CREATE TABLE IF NOT EXISTS "public"."blocked_ips" (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES "public"."users"(id) ON DELETE SET NULL
);
ALTER TABLE "public"."blocked_ips" ENABLE ROW LEVEL SECURITY;

-- 5. Dọn dẹp OTP cũ (tự động xóa sau 1 giờ) - chạy thủ công hoặc cron
-- DELETE FROM "public"."otp_codes" WHERE expires_at < NOW() - INTERVAL '1 hour';
