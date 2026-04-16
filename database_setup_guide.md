# Nâng Cấp Hệ Thống Đa Vai Trò (Database)

Hệ thống cũ chỉ dành cho Admin cơ bản đã bị loại bỏ. Xin mời bạn copy khối SQL MỚI dưới đây, ném vào **SQL Editor trên Supabase** và nhấn **RUN** để áp dụng cấu trúc đa phân quyền.

## Mã SQL Chạy:

```sql
-- Bước 1: Dọn dẹp tàn tích hệ thống cũ
DROP TABLE IF EXISTS "public"."admin";
DROP TABLE IF EXISTS "public"."users" CASCADE;

-- Bước 2: Khởi tạo bảng Cư Dân Đại Điền (Users)
CREATE TABLE "public"."users" (
    "id" serial PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "role" text NOT NULL DEFAULT 'user', /* Các chức danh: admin | seller | user */
    "created_at" timestamp with time zone DEFAULT now()
);

-- Bảo mật (RLS)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Bước 3: Mở rộng kho chứa Sản phẩm (Products)
-- Ghép thêm thông tin "Ai là người tạo ra sản phẩm này?" (seller_id)
ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "seller_id" integer REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Bước 4: Tạo 3 tài khoản mẫu đại diện cho 3 Thế lực
-- (Tất cả Mật khẩu đều dùng chung là: 123456)
INSERT INTO "public"."users" ("email", "password", "role")
VALUES 
  ('quanly@ocop.vn', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'admin'),
  ('chulo@ocop.vn', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'seller'),
  ('khachhang@gmail.com', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'user');

-- Cập nhật tất cả sản phẩm cũ hiện có (nếu có) thuộc về "chulo@ocop.vn" (Seller có ID = 2)
UPDATE "public"."products" SET "seller_id" = 2 WHERE "seller_id" IS NULL;

```

> LƯU Ý PHÂN QUYỀN MỚI: 
> 1. Tài khoản Quản lý: **`quanly@ocop.vn`** - Mật khẩu: **`123456`** -> (Lọt vào Bàn làm việc Tối cao, quản lý hệ thống).
> 2. Tài khoản Chủ xưởng: **`chulo@ocop.vn`** - Mật khẩu: **`123456`** -> (Được dắt vào Sổ tay Cửa hàng).
> 3. Tài khoản Khách: **`khachhang@gmail.com`** - Mật khẩu: **`123456`** -> (Chỉ hiện lỗi, hoặc đưa ra trang chủ do chưa được mua hàng).
