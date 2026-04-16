# Nâng Cấp Hệ Thống Đa Vai Trò (Database)

Hệ thống cũ chỉ dành cho Admin cơ bản đã bị loại bỏ. Xin mời bạn copy khối SQL MỚI dưới đây, ném vào **SQL Editor trên Supabase** và nhấn **RUN** để áp dụng cấu trúc đa phân quyền.

## Mã SQL Chạy:

```sql
-- Bước 1: Dọn dẹp tàn tích hệ thống cũ
DROP TABLE IF EXISTS "public"."admin";
-- Xoá bảng thì mọi dữ liệu sẽ mất, vì chúng ta sẽ thêm cột nên không xoá Users nữa!
-- DROP TABLE IF EXISTS "public"."users" CASCADE;

-- Bước 2: Nâng cấp Bảng Cư Dân Đại Điền (Users)
-- Nâng cấp Bảng Cư Dân Đại Điền (Users)
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN DEFAULT FALSE;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "tax_id" VARCHAR(255);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "business_registration" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "ocop_certificate" TEXT;

-- Cấp duyệt tự động cho tất cả user cũ để khỏi lỗi
UPDATE "public"."users" SET "is_approved" = TRUE WHERE "is_approved" IS FALSE;

-- Khoá bảng (bảo mật dữ liệu)
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Bước 3: Nâng cấp kho chứa Sản phẩm (Products)
-- Thêm cột Chủ sở hữu sản phẩm (Cực kỳ quan trọng để thêm sản phẩm không bị lỗi)
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "seller_id" integer REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Thêm status ('approved', 'pending_new', 'pending_edit', 'pending_delete', 'rejected')
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'pending_new';

-- Cập nhật tất cả sản phẩm cũ hiện có (nếu có) thành đã duyệt 
UPDATE "public"."products" SET "status" = 'approved' WHERE "status" = 'pending_new';

-- Bước 4: Tạo tài khoản Quản Trị Viên tối cao
-- Email: t219t3@gmail.com - Mật khẩu: gtCo0408t (Password hash là bcrypt)
INSERT INTO "public"."users" ("email", "password", "role", "is_approved")
VALUES 
  ('t219t3@gmail.com', '$2b$10$CmWOMEGdEdrU2iEzNk0cx.wKcIie8IzJheuA.HwSY/vi6IoTyQJOa', 'admin', true),
  ('quanly@ocop.vn', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'admin', true),
  ('chulo@ocop.vn', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'seller', true),
  ('khachhang@gmail.com', '$2b$10$5S42qauzFAvHMq2B/cgDH.RNWkV.WeH/In0tqElceiHLyYzUpi8T.', 'user', true)
ON CONFLICT ("email") DO NOTHING;
```

> LƯU Ý PHÂN QUYỀN MỚI: 
> 1. QTV Cao Cấp: **`t219t3@gmail.com`** - Mật khẩu: **`gtCo0408t`**
> 2. Tài khoản Quản lý phụ: **`quanly@ocop.vn`** - Mật khẩu: **`123456`** -> (Vào `/admin/login`).
> 3. Tài khoản Chủ xưởng: **`chulo@ocop.vn`** - Mật khẩu: **`123456`** -> (Được dắt vào Sổ tay Cửa hàng).
> 4. Tài khoản Khách: **`khachhang@gmail.com`** - Mật khẩu: **`123456`** -> (Chỉ hiện lỗi, hoặc đưa ra trang chủ do chưa được mua hàng).
