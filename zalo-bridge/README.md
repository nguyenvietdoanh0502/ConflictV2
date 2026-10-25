# UniSync Zalo Bridge (Phase 4)

Dịch vụ Node.js làm cầu nối giữa Zalo cá nhân/nhóm và hệ sinh thái **UniSync** (Spring Boot Backend & AI Engine).

---

## 🎯 Chức năng chính

1. **Lắng nghe tin nhắn Group Zalo**: Bắt các tin nhắn đến từ các nhóm Zalo sinh viên mà tài khoản tham gia (bỏ qua tin nhắn cá nhân 1-1).
2. **Cơ chế 2 chế độ (Dual-Mode)**:
   - **`MOCK` Mode (Mặc định)**: Cung cấp sẵn danh sách các nhóm môn học mẫu (`Lập trình Web - K64`, `Mạng máy tính - Lớp 2`, `Cơ sở dữ liệu - K64`, `Giải tích 2`...). Hỗ trợ kiểm thử và trình diễn độc lập 100% không cần kết nối mạng Zalo thật.
   - **`REAL` Mode**: Sử dụng thư viện `zca-js`, tạo mã QR đăng nhập qua ứng dụng Zalo trên điện thoại và tự động lưu phiên làm việc vào `zalo_session.json` để tái sử dụng.
3. **Chuyển tiếp Webhook bảo mật**:
   - Gửi payload chuẩn hóa sang Core Backend (`POST /api/v1/internal/zalo/messages`).
   - Xác thực bảo mật hai chiều bằng header `X-Internal-Api-Key`.
4. **API Tiện ích**:
   - `GET /health`: Kiểm tra trạng thái hoạt động của bridge.
   - `GET /zalo/status`: Thông tin kết nối và số lượng nhóm đang theo dõi.
   - `GET /zalo/groups`: Danh sách nhóm Zalo cho giao diện Whitelist trên Frontend.
   - `POST /zalo/simulate-incoming`: Giả lập tin nhắn đến để kiểm thử toàn diện luồng dữ liệu.

---

## 🚀 Cài đặt & Khởi chạy

### 1. Cài đặt thư viện
```bash
cd zalo-bridge
npm install
```

### 2. Cấu hình biến môi trường (`.env`)
```ini
PORT=3001
BACKEND_URL=http://localhost:8080/api/v1/internal/zalo/messages
INTERNAL_API_KEY=unisync_internal_secret_key_2026
ZALO_MODE=mock
SESSION_FILE_PATH=./zalo_session.json
```

### 3. Chạy dịch vụ
```bash
# Chạy ở chế độ production
npm start

# Chạy ở chế độ phát triển (tự động reload khi sửa code)
npm run dev

# Chạy kiểm thử tự động
npm test
```

---

## 📡 Đặc tả API

### 1. `GET /health`
Trả về trạng thái sức khỏe của dịch vụ:
```json
{
  "status": "UP",
  "service": "zalo-bridge",
  "uptime": 12.45,
  "connected": true,
  "mode": "mock",
  "groupCount": 5
}
```

### 2. `GET /zalo/groups`
Trả về danh sách các nhóm Zalo để người dùng lựa chọn ghép vào môn học:
```json
{
  "success": true,
  "total": 5,
  "data": [
    {
      "id": "group-it101",
      "name": "Lập trình Web - K64",
      "memberCount": 65,
      "active": true
    },
    {
      "id": "group-cs202",
      "name": "Mạng máy tính - Lớp 2",
      "memberCount": 72,
      "active": true
    }
  ]
}
```

### 3. `POST /zalo/simulate-incoming`
Giả lập một tin nhắn mới từ nhóm gửi tới Backend:
```bash
curl -X POST http://localhost:3001/zalo/simulate-incoming \
  -H "Content-Type: application/json" \
  -d '{
    "zalo_group_id": "group-it101",
    "sender_name": "Lớp trưởng Nam",
    "message_text": "Thứ 2 tuần sau kiểm tra 15p tại phòng 401-A1 nhé ae"
  }'
```

---

## 🛡️ Sơ đồ Luồng Dữ liệu (Data Pipeline)

```
[Group Zalo Sinh viên]
        │
        ▼ (zca-js WebSocket / Mock)
[Node.js Zalo Bridge (:3001)]
        │
        ▼ POST /api/v1/internal/zalo/messages (X-Internal-Api-Key)
[Spring Boot Backend (:8080)]
        │ (Kiểm tra Whitelist & Regex Filter)
        ▼ POST /ai/analyze-message
[Python AI Service (:8000) / Gemini 2.5 Flash]
        │ (Bóc tách sự kiện học vụ)
        ▼
[PostgreSQL DB (schedule_events)] ──► [WebSocket STOMP] ──► [ReactJS FullCalendar]
```
