import { GoogleGenAI, Type } from "@google/genai";
import { OcopFormData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateOcopContent(data: OcopFormData) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Bạn là một chuyên gia copywriter và am hiểu sâu sắc về văn hóa Kinh Bắc (Bắc Ninh).
    Hãy viết nội dung quảng bá cho sản phẩm OCOP sau đây:
    
    - Tên sản phẩm: ${data.productName}
    - Chủ thể OCOP: ${data.subject}
    - Địa phương: ${data.location}
    - Nhóm sản phẩm: ${data.productGroup}
    - Điểm nổi bật: ${data.highlights}
    - Hạng chứng nhận OCOP: ${data.certification}
    - Câu chuyện địa phương: ${data.localStory}
    
    Yêu cầu:
    1. Mô tả chi tiết (300-600 từ): 
       - Giới thiệu về nguồn gốc, truyền thống của địa phương ${data.location} gắn liền với sản phẩm.
       - Lồng ghép khéo léo các yếu tố văn hóa Bắc Ninh (như dân ca Quan họ, làng nghề truyền thống, tinh thần hiếu học, sự tỉ mỉ của người thợ...) nếu phù hợp.
       - Phân tích sâu các điểm nổi bật: ${data.highlights}.
       - Đề cập đến hạng chứng nhận OCOP: ${data.certification}.
       - Sử dụng thông tin từ câu chuyện địa phương: ${data.localStory} để làm nội dung thêm phong phú và chân thực.
       - Văn phong chuyên nghiệp, truyền cảm hứng, đậm chất văn hóa.
    
    2. Nội dung chuẩn SEO:
       - Tiêu đề SEO (dưới 60 ký tự).
       - Meta Description (dưới 160 ký tự).
       - Danh sách 5-7 từ khóa chính.
       - Cấu trúc các thẻ H1, H2, H3 gợi ý.
    
    Lưu ý quan trọng: 
    - Sử dụng tiếng Việt chuẩn, không sai chính tả.
    - Tuyệt đối không sử dụng các thẻ HTML (như <p>, </p>, <br>, <div>...).
    - Định dạng nội dung là văn bản thuần túy (Plain Text).
    - Chia nội dung thành các đoạn văn rõ ràng, mỗi đoạn cách nhau bằng 2 lần xuống dòng để người dùng dễ dàng sao chép và sử dụng ngay.
    - Tuyệt đối không bịa đặt thông tin kỹ thuật hay số liệu không có trong dữ liệu đầu vào.
    - Chỉ sử dụng dữ liệu người dùng cung cấp và kiến thức văn hóa để làm giàu nội dung.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: "Mô tả chi tiết sản phẩm (300-600 từ)",
          },
          seoContent: {
            type: Type.STRING,
            description: "Nội dung chuẩn SEO bao gồm tiêu đề, meta, từ khóa và cấu trúc heading",
          },
        },
        required: ["description", "seoContent"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
