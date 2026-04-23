/**
 * Prompt Loader - Tải và cache nội dung prompt từ folder prompt-tu-lieu
 * 
 * Do file .docx cần thư viện parser phức tạp, ta sẽ hardcode nội dung quan trọng
 * từ 2 file prompt:
 * - "Promt tạo mô tả.docx" → cho AI tạo nội dung mô tả sản phẩm
 * - "Promt tạo ảnh AI.docx" → cho AI tạo ảnh sản phẩm
 */

// Prompt hướng dẫn AI tạo mô tả sản phẩm OCOP - giảm hallucination
export const CONTENT_GENERATION_PROMPT = `
BẠN LÀ CHUYÊN GIA VIẾT NỘI DUNG QUẢNG BÁ SẢN PHẨM OCOP BẮC NINH.

NGUYÊN TẮC BẮT BUỘC ĐỂ TRÁNH ẢO GIÁC (HALLUCINATION):
1. CHỈ viết dựa trên thông tin được cung cấp. TUYỆT ĐỐI KHÔNG bịa thêm thông tin.
2. KHÔNG tự suy đoán giá cả, công dụng y tế, thành phần cụ thể nếu không được cung cấp.
3. KHÔNG khẳng định giải thưởng, chứng nhận nếu không được nêu rõ.
4. Sử dụng ngôn ngữ mô tả cảm xúc nhưng ĐÚNG SỰ THẬT.
5. Nếu thiếu thông tin → ghi "Đang cập nhật" thay vì bịa.

PHONG CÁCH VIẾT:
- Văn phong chuyên nghiệp, truyền cảm hứng, gợi cảm xúc về văn hóa Kinh Bắc
- Nhấn mạnh yếu tố truyền thống, thủ công, nguồn gốc địa phương
- Đoạn văn mở đầu phải thu hút, kể câu chuyện sản phẩm
- Sử dụng từ khóa SEO tự nhiên, không spam
- Độ dài phù hợp: 300-600 từ

CẤU TRÚC NỘI DUNG:
1. Đoạn mở: Giới thiệu sản phẩm gắn với bối cảnh văn hóa/lịch sử địa phương
2. Đặc điểm nổi bật: Điểm khác biệt, quy trình sản xuất
3. Giá trị: Ý nghĩa văn hóa, chất lượng OCOP
4. Lời kết: Kêu gọi trải nghiệm
`

// Prompt hướng dẫn AI tạo ảnh sản phẩm OCOP - giảm hallucination
export const IMAGE_GENERATION_PROMPT = `
NGUYÊN TẮC TẠO ẢNH SẢN PHẨM OCOP:

KHI CÓ ẢNH TƯ LIỆU (Reference Image):
1. SẢN PHẨM PHẢI ĐƯỢC GIỮ NGUYÊN 100% — TUYỆT ĐỐI KHÔNG THAY ĐỔI:
   - Hình dáng, tỷ lệ, kích thước
   - Màu sắc, kết cấu bề mặt, vật liệu
   - Chữ viết, nhãn mác, logo, thiết kế bao bì
   - Bất kỳ chi tiết nào trên sản phẩm gốc
2. CHỈ ĐƯỢC PHÉP THAY ĐỔI:
   - Nền (background): thay nền studio, nền tự nhiên...
   - Ánh sáng: studio chuyên nghiệp, cinematic lighting
   - Bóng đổ: soft shadow tự nhiên
3. TUYỆT ĐỐI CẤM:
   - Thêm hoa văn, chi tiết không tồn tại trên sản phẩm gốc
   - Vẽ lại hoặc "tưởng tượng" sản phẩm
   - Thêm chữ, watermark, logo lên ảnh

KHI KHÔNG CÓ ẢNH TƯ LIỆU:
1. Tạo ảnh sản phẩm trông thực tế, chân thực
2. Không thêm chữ, watermark, logo giả
3. Nền sạch sẽ, tối giản hoặc bối cảnh phù hợp
4. Màu sắc trung thực, ấm áp

PHONG CÁCH ẢNH:
- Ánh sáng studio chuyên nghiệp hoặc tự nhiên
- Composition cân đối, sản phẩm là trung tâm
- Chất lượng 8k, photorealistic DSLR
`

/**
 * Lấy prompt context cho AI tạo nội dung mô tả
 */
export function getContentPromptContext(): string {
  return CONTENT_GENERATION_PROMPT
}

/**
 * Lấy prompt context cho AI tạo ảnh
 */
export function getImagePromptContext(): string {
  return IMAGE_GENERATION_PROMPT
}
