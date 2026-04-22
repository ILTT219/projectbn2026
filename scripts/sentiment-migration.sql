-- =============================================
-- FEATURE: Sentiment Analysis & Admin Alerts
-- Chạy script này trên Supabase SQL Editor
-- =============================================

-- 1. Thêm cột sentiment vào bảng product_reviews
ALTER TABLE "public"."product_reviews" 
  ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'pending';
-- Giá trị: 'positive', 'neutral', 'negative', 'pending'

CREATE INDEX IF NOT EXISTS idx_reviews_sentiment 
  ON "public"."product_reviews"(sentiment);

-- 2. Bảng cảnh báo cho admin
CREATE TABLE IF NOT EXISTS "public"."admin_alerts" (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES "public"."product_reviews"(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES "public"."products"(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL DEFAULT 'negative_review',
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    -- severity: 'critical' (chất lượng/vệ sinh), 'warning' (tiêu cực), 'info' (trung lập)
    message TEXT NOT NULL,
    keywords_found TEXT,
    suggested_response TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES "public"."users"(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON "public"."admin_alerts"(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON "public"."admin_alerts"(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON "public"."admin_alerts"(created_at DESC);

-- 3. RLS policies
ALTER TABLE "public"."admin_alerts" ENABLE ROW LEVEL SECURITY;

-- Chỉ admin đọc được (service_role bypass RLS)
CREATE POLICY "alerts_admin_read" ON "public"."admin_alerts" FOR SELECT USING (false);
CREATE POLICY "alerts_admin_insert" ON "public"."admin_alerts" FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_admin_update" ON "public"."admin_alerts" FOR UPDATE USING (false);
