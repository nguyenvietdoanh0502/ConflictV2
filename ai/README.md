# UniSync AI Engine Microservice (FastAPI + Gemini 2.5 Flash)

Microservice xử lý ngôn ngữ tự nhiên (NLP) phục vụ dự án **UniSync**:
- **Bóc tách tin nhắn Zalo**: Nhận diện thông báo học vụ (nghỉ học, học bù, kiểm tra, deadline) từ tin nhắn tiếng lóng sinh viên Việt Nam và quy đổi thành các sự kiện có ngày giờ chuẩn ISO 8601 (+07:00).
- **Hỗ trợ 2 chế độ**:
  - `AI_MODE=live`: Sử dụng mô hình `gemini-2.5-flash` của Google Gemini API qua SDK `google-genai` với tính năng Structured Outputs.
  - `AI_MODE=mock`: Tự động kích hoạt khi chưa có API Key hoặc chỉ định offline, bóc tách thông minh dựa trên ngữ cảnh phục vụ kiểm thử và kịch bản thuyết trình an toàn 100%.

---

## 1. Cài đặt & Cấu hình

### Bước 1: Cài đặt thư viện
```bash
cd ai
pip install -r requirements.txt
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```

Mở file `.env` và điền Google Gemini API Key của bạn:
```env
PORT=8000
HOST=0.0.0.0
AI_MODE=live
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-2.5-flash
INTERNAL_API_KEY=unisync_internal_secret_key_2026
```

> **Ghi chú**: Nếu chưa có API key, service sẽ tự động chạy ở chế độ **Mock Mode** mà không làm gián đoạn hệ thống.

---

## 2. Khởi chạy Service

```bash
# Từ thư mục ai/
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Chạy kiểm thử tự động

```bash
pytest tests/
```

---

## 4. Danh sách Endpoint API

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `GET` | `/health` | Kiểm tra trạng thái service và chế độ hoạt động |
| `POST` | `/ai/analyze-message` | Bóc tách tin nhắn Zalo thành cấu trúc sự kiện học vụ (Chuẩn PoC Plan) |
| `POST` | `/v1/zalo/parse-message` | Alias endpoint (Chuẩn PRD / AGENT.md) |
