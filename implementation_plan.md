# Triển khai 5 Tính năng Nâng cao cho OCOP Bắc Ninh

Dựa trên file `idea.txt`, triển khai 5 module mới vào nền tảng Next.js + Supabase + TailwindCSS hiện có.

---

## Tổng quan các tính năng

| # | Tính năng | Mô tả ngắn |
|---|-----------|-------------|
| 1 | Gợi ý sản phẩm thông minh | Gợi ý dựa trên danh mục, hành vi xem hàng |
| 2 | Công cụ hỗ trợ chủ thể OCOP | AI tạo mô tả SEO, bài Facebook/Zalo, kịch bản TikTok |
| 3 | Tối ưu hóa AI & Dữ liệu | Sử dụng prompt từ `prompt-tu-lieu` để giảm hallucination |
| 4 | Bản đồ số tương tác làng nghề | Geolocation + bản đồ hiển thị cơ sở OCOP gần nhất |
| 5 | Quản lý uy tín thương hiệu | Phân tích sentiment đánh giá, cảnh báo tiêu cực cho admin |

---

## Proposed Changes

### Feature 1: Hệ thống Gợi ý Sản phẩm Thông minh

Khi user xem 1 sản phẩm → hiển thị "Sản phẩm liên quan" dựa trên `category_id` + lịch sử xem (lưu trong `localStorage`). Khi user tìm kiếm → gợi ý sản phẩm từ danh mục có liên quan.

#### [NEW] [route.ts](file:///c:/Users/ASUS/web/app/api/products/recommendations/route.ts)
- API trả về sản phẩm gợi ý dựa trên:
  - **Cùng danh mục** (`category_id`) với sản phẩm đang xem
  - **Lịch sử xem** (nhận `viewed_ids[]` từ client) → tìm danh mục phổ biến nhất → gợi ý sản phẩm từ đó
  - **Ánh xạ danh mục văn hóa**: Thủ công mỹ nghệ (4) ↔ liên quan Hàng tiêu dùng (5); Lương thực (1) ↔ Thực phẩm (2) ↔ Đồ uống (6)
- Trả về tối đa 6 sản phẩm, loại trừ sản phẩm hiện tại

#### [NEW] [RecommendedProducts.tsx](file:///c:/Users/ASUS/web/components/product/RecommendedProducts.tsx)
- Component hiển thị grid sản phẩm gợi ý trên trang chi tiết sản phẩm
- Lưu `product_id` đã xem vào `localStorage` (tối đa 20 sản phẩm gần nhất)
- UI: Card ngang với ảnh + tên + xuất xứ, animation hover

#### [MODIFY] [page.tsx](file:///c:/Users/ASUS/web/app/products/%5Bid%5D/page.tsx)
- Thêm `<RecommendedProducts>` component phía dưới `<ReviewSection>`

#### [MODIFY] [page.tsx](file:///c:/Users/ASUS/web/app/products/page.tsx)  
- Upgrade thanh tìm kiếm: khi user gõ → hiển thị "Gợi ý liên quan" bên dưới kết quả tìm kiếm nếu có ít kết quả

---

### Feature 2: Công cụ Hỗ trợ Chủ thể OCOP (AI Content Generator)

Nâng cấp trang seller để có tool tạo 3 loại nội dung marketing bằng AI.

#### [NEW] [page.tsx](file:///c:/Users/ASUS/web/app/seller/content-generator/page.tsx)
- Trang full-page cho seller tạo nội dung marketing
- Form nhập: Tên sản phẩm, mô tả ngắn, điểm nổi bật, nhóm sản phẩm
- 3 tab output:
  1. **Mô tả chuẩn SEO**: Tiêu đề, meta description, từ khóa, nội dung chi tiết
  2. **Bài mạng xã hội** (Facebook/Zalo): Caption hấp dẫn, hashtags, CTA
  3. **Kịch bản video ngắn** (TikTok): Hook → Nội dung → CTA, timing gợi ý
- Nút copy nhanh cho mỗi loại nội dung
- UI premium với tabs, glassmorphism cards

#### [NEW] [route.ts](file:///c:/Users/ASUS/web/app/api/seller/generate-marketing/route.ts)
- API endpoint nhận thông tin sản phẩm + loại nội dung (`seo` | `social` | `tiktok`)
- Sử dụng Groq API với prompt chuyên biệt cho từng loại
- Tích hợp prompt từ `prompt-tu-lieu` folder (Feature 3)
- Trả về JSON structured content

#### [MODIFY] [page.tsx](file:///c:/Users/ASUS/web/app/seller/page.tsx)
- Thêm card link đến trang Content Generator trên dashboard seller

---

### Feature 3: Tối ưu hóa AI & Dữ liệu

Sử dụng nội dung từ folder `prompt-tu-lieu` để tạo system prompt chống hallucination.

#### [NEW] [prompt-loader.ts](file:///c:/Users/ASUS/web/lib/prompt-loader.ts)
- Utility đọc và cache nội dung các file `.docx` trong `app/prompt-tu-lieu/`
- Trích xuất text thuần từ docx format
- Export hàm `getPromptContext()` trả về string context cho AI

#### [MODIFY] [route.ts](file:///c:/Users/ASUS/web/app/api/chat/route.ts)
- Inject context từ `prompt-loader` vào system prompt của chatbot
- Thêm quy tắc: "CHỈ mô tả sản phẩm dựa trên dữ liệu thực, KHÔNG tưởng tượng thêm đặc điểm"

#### [MODIFY] [route.ts](file:///c:/Users/ASUS/web/app/api/seller/generate-marketing/route.ts) *(Feature 2)*
- Cũng inject context từ prompt-loader để AI tạo nội dung marketing chính xác hơn

---

### Feature 4: Bản đồ số Tương tác Làng nghề

Tích hợp bản đồ Leaflet (open-source, không cần API key) hiển thị cơ sở OCOP.

#### [NEW] [page.tsx](file:///c:/Users/ASUS/web/app/map/page.tsx)
- Trang bản đồ toàn màn hình sử dụng **Leaflet.js** (qua CDN, không cần npm install)
- Hiển thị các marker cho cơ sở sản xuất OCOP (dữ liệu từ bảng `products` field `origin`)
- Popup marker: tên cơ sở, sản phẩm nổi bật, link xem chi tiết
- Sidebar trái: danh sách cơ sở, lọc theo danh mục
- Nút "Tìm cơ sở gần tôi" → dùng `navigator.geolocation` → sort theo khoảng cách
- Banner gợi ý: "Có X cơ sở OCOP trong bán kính 20km"

#### [NEW] [route.ts](file:///c:/Users/ASUS/web/app/api/map/locations/route.ts)
- API trả về danh sách cơ sở OCOP với tọa độ
- Dữ liệu tọa độ được hardcode cho các làng nghề nổi tiếng Bắc Ninh:
  - Đồng Kỵ (Từ Sơn) - Gỗ mỹ nghệ
  - Phù Lãng (Quế Võ) - Gốm sứ
  - Đại Bái (Gia Bình) - Đồng đúc
  - Tương Giang (Từ Sơn) - Sắt thép  
  - Lim (Tiên Du) - Quan họ/Văn hóa
  - Và các cơ sở từ database `products.origin`

#### [MODIFY] [Navbar.tsx](file:///c:/Users/ASUS/web/components/layout/Navbar.tsx)
- Thêm link "Bản đồ" vào navigation menu

---

### Feature 5: Quản lý Uy tín Thương hiệu Tự động

AI phân tích sentiment review, tự động cảnh báo admin khi có review tiêu cực liên quan chất lượng/vệ sinh.

#### [NEW] [route.ts](file:///c:/Users/ASUS/web/app/api/reviews/analyze/route.ts)
- API phân tích sentiment của review bằng Groq AI
- Phân loại: `positive` | `neutral` | `negative`
- Phát hiện từ khóa nguy hiểm: "chất lượng kém", "vệ sinh", "hỏng", "giả", "quá hạn", "ôi thiu"...
- Nếu phát hiện → tạo record trong bảng `admin_alerts`
- Kèm gợi ý cách phản hồi do AI đề xuất

#### [MODIFY] [route.ts](file:///c:/Users/ASUS/web/app/api/products/%5Bid%5D/reviews/route.ts)
- Sau khi insert review mới → gọi API analyze sentiment
- Lưu kết quả `sentiment` vào review record

#### [NEW] [sentiment-migration.sql](file:///c:/Users/ASUS/web/scripts/sentiment-migration.sql)
- Thêm cột `sentiment` vào bảng `product_reviews` (`positive`, `neutral`, `negative`)
- Tạo bảng `admin_alerts`:
  - `id`, `review_id`, `product_id`, `alert_type`, `severity`, `message`, `suggested_response`, `is_resolved`, `created_at`
- RLS policies

#### [NEW] [page.tsx](file:///c:/Users/ASUS/web/app/admin/reputation/page.tsx)
- Dashboard quản lý uy tín cho admin
- Hiển thị danh sách cảnh báo theo mức độ nghiêm trọng (🔴 Khẩn cấp, 🟡 Cảnh báo, 🟢 Bình thường)
- Mỗi alert: thông tin review, sản phẩm, sentiment score, gợi ý phản hồi
- Nút "Đã xử lý" để đánh dấu resolved
- Thống kê tổng quan: tỉ lệ positive/neutral/negative

#### [MODIFY] [page.tsx](file:///c:/Users/ASUS/web/app/admin/page.tsx)
- Thêm tab/link đến trang Reputation Management
- Hiển thị badge đếm số alert chưa xử lý

---

## Open Questions

> [!IMPORTANT]
> **GROQ API Key**: Hiện tại `.env.local` không có `GROQ_API_KEY`. Cần bổ sung key để các tính năng AI (Feature 2, 3, 5) hoạt động. Bạn có GROQ API key chưa?

> [!IMPORTANT]  
> **Tọa độ làng nghề**: Feature 4 cần tọa độ GPS các cơ sở sản xuất. Hiện bảng `products` chỉ có field `origin` (text). Tôi sẽ hardcode tọa độ cho các làng nghề nổi tiếng Bắc Ninh và map theo tên origin. Bạn có muốn thêm field `latitude/longitude` vào bảng products không?

> [!NOTE]
> **Leaflet.js**: Tôi chọn Leaflet qua CDN vì miễn phí, không cần API key (dùng OpenStreetMap tiles), và không cần cài thêm npm package.

---

## Verification Plan

### Automated Tests
- `npm run build` — đảm bảo không có lỗi TypeScript/compile
- Kiểm tra mỗi API route bằng browser dev tools

### Manual Verification
- Chạy `npm run dev` và test từng tính năng trên browser:
  1. Xem trang sản phẩm → kiểm tra phần gợi ý hiển thị đúng
  2. Vào seller dashboard → test content generator với 3 loại nội dung
  3. Chat với chatbot → xác nhận không hallucinate
  4. Vào trang bản đồ → kiểm tra markers và geolocation
  5. Gửi review tiêu cực → kiểm tra alert xuất hiện ở admin
