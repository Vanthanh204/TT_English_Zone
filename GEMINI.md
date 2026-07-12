# Project Instructions: LVTN_app

Tài liệu này chứa các quy tắc và hướng dẫn mà Gemini CLI phải tuân thủ khi làm việc trên dự án này.

## 1. Ngôn ngữ & Giao tiếp
- Luôn sử dụng tiếng Việt để trao đổi với người dùng.
- Comment trong code có thể sử dụng tiếng Anh hoặc tiếng Việt tùy theo ngữ cảnh hiện tại của file.

## 2. Tiêu chuẩn Backend (Node.js/Express)
- **Cấu trúc:** Tuân thủ mô hình `Routes -> Controllers -> Models`.
- **Database:** Sử dụng pool kết nối từ `backend/config/db.js`.
- **Xác thực:** Luôn kiểm tra quyền truy cập bằng `authMiddleware.js` cho các route cần bảo mật.
- **API:** Trả về kết quả dưới dạng JSON nhất quán (ví dụ: `{ success: true, data: ... }` hoặc `{ success: false, message: ... }`).

## 3. Tiêu chuẩn Frontend (React/TypeScript/Vite)
- **Styling:** Sử dụng Tailwind CSS cho toàn bộ giao diện. Không sử dụng thư viện CSS-in-JS khác trừ khi có yêu cầu.
- **TypeScript:** Luôn định nghĩa interface/type cho props và dữ liệu. Hạn chế tối đa việc sử dụng `any`.
- **Components:** Sử dụng Functional Components và Hooks.
- **Quản lý trạng thái:** Ưu tiên sử dụng hooks (useState, useEffect, useContext) hoặc các patterns hiện có trong dự án.

## 4. Quy trình sửa đổi Code
- **Lập kế hoạch trước khi thực thi:** Đối với các tính năng hoặc thay đổi nghiệp vụ quan trọng, bắt buộc phải liệt kê các bước thiết kế và tạo bản kế hoạch (`implementation_plan.md`) chi tiết để thảo luận và nhận được sự đồng ý từ người dùng trước khi tiến hành viết code.
- **Nghiên cứu:** Phải đọc các file liên quan trước khi sửa đổi để đảm bảo tính nhất quán.
- **Sửa đổi:** Thực hiện các thay đổi nhỏ, chính xác (surgical edits).
- **Kiểm tra:** Luôn nhắc nhở hoặc thực hiện chạy thử (nếu có thể) để xác nhận thay đổi hoạt động đúng.

## 5. Bảo mật
- Không bao giờ in, log hoặc commit các file `.env`, thông tin database hoặc API keys.
