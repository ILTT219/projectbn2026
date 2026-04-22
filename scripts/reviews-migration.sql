-- =============================================
-- FEATURE: Product Reviews & Top Rankings
-- Chạy script này trên Supabase SQL Editor
-- =============================================

-- 1. Bảng đánh giá sản phẩm
CREATE TABLE IF NOT EXISTS "public"."product_reviews" (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES "public"."products"(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES "public"."users"(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(100) NOT NULL DEFAULT 'Ẩn danh',
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON "public"."product_reviews"(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON "public"."product_reviews"(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON "public"."product_reviews"(created_at DESC);

-- 2. RLS policies
ALTER TABLE "public"."product_reviews" ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc public
CREATE POLICY "reviews_read" ON "public"."product_reviews" FOR SELECT USING (true);

-- Cho phép insert (ai cũng có thể đánh giá)
CREATE POLICY "reviews_insert" ON "public"."product_reviews" FOR INSERT WITH CHECK (true);

-- Cho phép delete bởi admin (service_role sẽ bypass)
CREATE POLICY "reviews_delete" ON "public"."product_reviews" FOR DELETE USING (false);

-- 3. View thống kê rating cho mỗi product
CREATE OR REPLACE VIEW "public"."product_rating_stats" AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.img,
    p.origin,
    p.contact_address,
    COALESCE(COUNT(r.id), 0) AS review_count,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
    COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0) AS star_5,
    COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0) AS star_4,
    COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0) AS star_3,
    COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0) AS star_2,
    COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) AS star_1
FROM "public"."products" p
LEFT JOIN "public"."product_reviews" r ON r.product_id = p.id
WHERE p.status = 'approved'
GROUP BY p.id, p.name, p.img, p.origin, p.contact_address;
