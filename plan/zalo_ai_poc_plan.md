# KẾ HOẠCH THỰC HIỆN BẢN THỬ NGHIỆM (PoC): ĐỒNG BỘ ZALO & AI VÀO THỜI KHÓA BIỂU

* **Mục tiêu giai đoạn:** Xây dựng nhanh bản Proof of Concept (PoC) theo mô hình *Risk-First Prototyping* để kiểm chứng luồng kỹ thuật khó nhất của dự án **UniSync**: **Đọc tin nhắn Group Zalo (theo Whitelist) $\rightarrow$ AI bóc tách lịch học/lịch thi $\rightarrow$ Tự động điền lên Thời khóa biểu**.


---


## 1. SƠ ĐỒ LUỒNG DỮ LIỆU BẢN TEST (DATA PIPELINE)

```
[Nhóm Zalo Lớp Học] 
       │ (1) Có tin nhắn mới
       ▼
[Node.js Zalo Bridge (zca-js)]
       │ (2) Bắn Webhook (POST /api/webhook/zalo-message)
       ▼
[Spring Boot Core Backend] ──► Kiểm tra Whitelist (is_active == true?) ──► (Nếu False: Bỏ qua)
       │ (3) Lọc từ khóa sơ bộ & Gọi nội bộ (POST /ai/analyze-message)
       ▼
[Python FastAPI + Gemini 2.5 Flash]
       │ (4) Trả về Structured JSON (Danh sách sự kiện học vụ)
       ▼
[PostgreSQL Database] (Lưu vào bảng schedule_events)
       │ (5) Đẩy sự kiện mới qua WebSocket / Polling
       ▼
[ReactJS FullCalendar UI] (Tự động nhảy lịch mới với màu sắc tương ứng)
```

---

## 2. PHÂN CHIA NHIỆM VỤ CHI TIẾT CHO 4 THÀNH PHẦN

### 2.1. Database (PostgreSQL) – *Thiết kế 3 bảng cốt lõi*

Chưa cần tạo toàn bộ bảng của hệ thống lớn, chỉ chạy script SQL tạo 3 bảng dưới đây để phục vụ luồng test:

```sql
-- 1. Bảng Môn học
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,           -- VD: "Lập trình Web"
    code VARCHAR(50),                     -- VD: "IT4409"
    default_room VARCHAR(100)             -- VD: "401-A1"
);

-- 2. Bảng Ghép nối Group Zalo với Môn học (Whitelist)
CREATE TABLE zalo_group_mappings (
    id SERIAL PRIMARY KEY,
    zalo_group_id VARCHAR(100) UNIQUE NOT NULL, -- ID nhóm lấy từ Zalo
    zalo_group_name VARCHAR(255) NOT NULL,      -- Tên hiển thị của nhóm Zalo
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,             -- Cờ cho phép đọc tin nhắn (ON/OFF)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Sự kiện trên Thời khóa biểu
CREATE TABLE schedule_events (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,      -- 'REGULAR', 'MAKEUP_CLASS', 'CANCELLED_CLASS', 'EXAM', 'DEADLINE'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    room VARCHAR(100),
    raw_zalo_message TEXT,                -- Lưu tin nhắn gốc để đối chiếu trên UI
    sender_name VARCHAR(100),             -- Tên người nhắn trên Zalo
    created_by_ai BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.2. Zalo Bridge (Node.js) & Core Backend (Java Spring Boot)

#### A. Nhiệm vụ của Node.js Worker (Cầu nối Zalo)
Do thư viện lắng nghe Zalo cá nhân (`zca-js`) hoạt động trên môi trường JavaScript, cần dựng 1 service nhỏ chạy ở cổng `3001`:
1. **Đăng nhập & Lưu phiên (Session):** Dùng `zca-js` quét mã QR lần đầu và lưu thông tin đăng nhập (`credentials/cookies`) ra file `zalo_session.json` để các lần khởi động sau tự động kết nối.
2. **API Lấy danh sách Group (`GET http://localhost:3001/zalo/groups`):** Trả về danh sách các nhóm Zalo mà tài khoản đang tham gia (`groupId`, `groupName`) để người dùng chọn trên giao diện ReactJS.
3. **Lắng nghe tin nhắn (`api.listener.on("message")`):**
   * Chỉ bắt các tin nhắn đến từ **Group** (bỏ qua tin nhắn cá nhân 1-1).
   * Khi có tin nhắn mới, bắn ngay HTTP POST sang Spring Boot (`http://localhost:8080/api/webhook/zalo-message`) với payload:
     ```json
     {
       "zaloGroupId": "84930284920",
       "senderName": "Lớp trưởng Nam",
       "messageText": "Thứ 7 tuần này nghỉ nhé ae, học bù sáng thứ 2 tuần sau tiết 1-3 phòng 305-A2",
       "timestamp": "2026-10-22T15:20:00+07:00"
     }
     ```

#### B. Nhiệm vụ của Spring Boot (Cổng `8080` - Điều phối trung tâm)
1. **CRUD Môn học & Mapping (`POST /api/mappings`, `PATCH /api/mappings/{id}/toggle`):**
   * Cho phép gán 1 `zalo_group_id` vào 1 `subject_id` và bật/tắt cờ `is_active`.
2. **Xử lý Webhook nhận tin nhắn (`POST /api/webhook/zalo-message`):**
   * **Bước 1 (Kiểm tra Whitelist):** Truy vấn bảng `zalo_group_mappings` theo `zaloGroupId`. Nếu không tồn tại hoặc `is_active == false` $\rightarrow$ Dừng xử lý ngay lập tức.
   * **Bước 2 (Bộ lọc Regex tiết kiệm Quota AI):** Kiểm tra nhanh xem `messageText` có độ dài $> 10$ ký tự và chứa ít nhất 1 từ khóa học vụ cơ bản không (VD: *thứ, t2, t3, t4, t5, t6, t7, cn, mai, tuần, tiết, phòng, nghỉ, bù, thi, ktra, kiểm tra, nộp, deadline, lịch, báo*). Nếu không có $\rightarrow$ Bỏ qua, không gọi AI.
   * **Bước 3 (Gọi sang Python AI Service):** Nếu vượt qua bộ lọc, lấy `subject.name` và `subject.default_room`, sau đó gửi HTTP POST sang Python FastAPI (`http://localhost:8000/ai/analyze-message`).
   * **Bước 4 (Lưu DB & Phát sự kiện):** Nếu kết quả trả về từ Python có `is_academic_announcement == true`, lưu toàn bộ các sự kiện trong mảng `detected_events` vào bảng `schedule_events` và đẩy thông báo qua WebSocket cho ReactJS.
3. **API Giả lập phục vụ Test & Demo (`POST /api/webhook/mock-zalo`):**
   * Nhận cùng cấu trúc JSON như Webhook thật để lập trình viên test luồng AI ngay cả khi chưa bật Node.js hoặc dùng làm phương án dự phòng an toàn tuyệt đối khi đứng trên sân khấu thuyết trình.

---

### 2.3. AI Service (Python FastAPI + Gemini API)

Chạy độc lập tại cổng `8000`, chỉ cần 1 file `main.py` với thư viện `fastapi`, `uvicorn`, `pydantic` và `google-genai`.

1. **Endpoint:** `POST /ai/analyze-message`
2. **Cấu trúc Dữ liệu Đầu vào (Request Schema):**
   ```json
   {
     "current_datetime": "2026-10-22T15:20:00+07:00",
     "subject_name": "Lập trình Web",
     "default_room": "401-A1",
     "sender_name": "Lớp trưởng Nam",
     "message_text": "Ae chú ý t7 tuần này (24/10) thầy bận nên nghỉ nhé, chuyển sang học bù sáng t2 tuần sau tiết 1-3 ở phòng 305-A2. Thứ 6 tuần sau nữa ktra giữa kỳ luôn."
   }
   ```
3. **Quy tắc thiết kế System Prompt cho Gemini 2.5 Flash:**
   * **Nhiệt độ mô hình (`temperature`):** Đặt ở mức `0.1` để đảm bảo tính chính xác và nhất quán cao nhất khi tính toán ngày giờ.
   * **Bảng quy đổi Tiết học chuẩn (Cung cấp trong Prompt):**
     * Tiết 1–3: `07:00` – `09:30`
     * Tiết 4–6: `09:35` – `12:00`
     * Tiết 7–9: `12:30` – `15:00`
     * Tiết 10–12: `15:05` – `17:30`
   * **Từ điển viết tắt sinh viên Việt Nam:** Giải nghĩa sẵn các từ như `t2`..`t7` (Thứ 2..Thứ 7), `cn` (Chủ nhật), `ktra`/`kt` (Kiểm tra), `btl` (Bài tập lớn), `off`/`nghỉ` (Hủy buổi học), `onl` (Học trực tuyến).
   * **Ép kiểu đầu ra (`response_schema` bằng Pydantic):** Bắt buộc trả về đúng cấu trúc JSON chứa cờ `is_academic_announcement: bool` và danh sách `detected_events: list[EventItem]`.

---

### 2.4. Frontend (ReactJS) – *Giao diện Bảng điều khiển Test (1 Trang duy nhất)*

Xây dựng một màn hình Dashboard chia làm **3 khu vực** để theo dõi trực quan toàn bộ quá trình hoạt động:

1. **Khu vực 1 (Cột Trái - Quản lý Whitelist & Mapping):**
   * Hiển thị danh sách Group Zalo lấy từ hệ thống.
   * Cho phép chọn Môn học tương ứng từ Dropdown và nút gạt (Switch) **Bật / Tắt quyền đọc tin nhắn**.
2. **Khu vực 2 (Cột Giữa - Live Log & Công cụ Giả lập):**
   * **Khung Giả lập nhanh (Mock Sender):** Cho phép chọn nhóm Zalo, gõ thử một câu thông báo tiếng lóng và bấm *"Bắn tin nhắn thử nghiệm"*.
   * **Khung Console thời gian thực:** Hiển thị trạng thái xử lý: *"Đã nhận tin nhắn từ nhóm..."* $\rightarrow$ *"Đang phân tích bằng Gemini AI..."* $\rightarrow$ Hiển thị đoạn JSON kết quả do AI bóc tách được.
3. **Khu vực 3 (Cột Phải - Thời khóa biểu `FullCalendar`):**
   * Hiển thị lịch theo Tuần (`timeGridWeek`).
   * Tự động cập nhật ngay khi có sự kiện mới với mã màu rõ ràng:
     * 🟦 **Xanh dương:** Lịch học thường.
     * 🟧 **Cam:** Lịch học bù (`MAKEUP_CLASS`).
     * 🟥 **Đỏ:** Lịch kiểm tra / Deadline (`EXAM`, `DEADLINE`).
     * ⬜ **Xám:** Báo nghỉ (`CANCELLED_CLASS`).
   * Khi bấm vào sự kiện trên lịch, hiển thị Popup ghi rõ: *"✨ Tạo tự động bởi AI từ tin nhắn của [Tên người gửi]: '[Nội dung tin nhắn gốc]'"*.

---

## 3. LỘ TRÌNH THỰC HIỆN TRONG 3 NGÀY (STEP-BY-STEP)

### Ngày 1 (Sáng): Dựng Python AI Service & Tinh chỉnh Prompt
* [ ] Khởi tạo môi trường ảo Python, cài đặt `fastapi`, `uvicorn`, `google-genai`, `pydantic`.
* [ ] Viết endpoint `/ai/analyze-message` tích hợp Gemini API với `response_schema`.
* [ ] Mở giao diện Swagger UI (`http://localhost:8000/docs`), thử nghiệm với 10–15 mẫu tin nhắn Zalo thực tế của sinh viên (bao gồm cả tin nhắn rác/tán gẫu và tin nhắn báo lịch phức tạp) để tinh chỉnh Prompt cho đến khi AI tính toán ngày giờ chính xác 100%.

### Ngày 1 (Chiều): Dựng Database & Spring Boot Core
* [ ] Tạo 3 bảng trên PostgreSQL và thêm sẵn 2–3 môn học mẫu.
* [ ] Viết các API trên Spring Boot: lấy danh sách sự kiện, lưu cấu hình Mapping, và Webhook nhận tin nhắn gọi sang cổng `8000` của Python.
* [ ] Dùng Postman gửi thử request vào `/api/webhook/mock-zalo` và kiểm tra xem dữ liệu sau khi qua AI đã tự động chui vào bảng `schedule_events` trong Database hay chưa.

### Ngày 2: Xây dựng Node.js Zalo Bridge & Test trên Nhóm Zalo thật
* [ ] Lập 1 nhóm Zalo thử nghiệm trên điện thoại gồm các thành viên trong nhóm (VD: *"Nhóm Test Lập Trình Web"*).
* [ ] Viết script Node.js kết nối `zca-js`, quét QR bằng một tài khoản Zalo phụ để lấy danh sách `groupId`.
* [ ] Map `groupId` của nhóm thử nghiệm vào môn *"Lập trình Web"* trong Database (đặt `is_active = true`).
* [ ] Dùng điện thoại nhắn tin vào nhóm Zalo thật và kiểm tra luồng tự động: `Zalo -> Node.js -> Spring Boot -> Python AI -> PostgreSQL`.

### Ngày 3: Ghép Giao diện ReactJS FullCalendar hoàn chỉnh luồng PoC
* [ ] Khởi tạo project ReactJS + TailwindCSS + `@fullcalendar/react`.
* [ ] Ghép API hiển thị bảng Thời khóa biểu và khung cấu hình Whitelist Group Zalo.
* [ ] Kết nối WebSocket (hoặc cơ chế tự động làm mới dữ liệu mỗi 3 giây) để hoàn thành kịch bản: **Nhắn tin trên điện thoại $\rightarrow$ 3 giây sau Thời khóa biểu trên màn hình Web tự động nhảy lịch kiểm tra/học bù**.

---

## 4. CÁC NGUYÊN TẮC AN TOÀN KỸ THUẬT CẦN NHỚ

1. **Tránh bị Zalo khóa tính năng tạm thời (Rate-limit):**
   * Trong giai đoạn PoC và cả khi Demo, service Node.js chỉ thực hiện hành vi **Lắng nghe thụ động (Read-only WebSocket)** giống như người dùng đang mở tab Zalo Web trên trình duyệt, tuyệt đối không dùng vòng lặp bắn tin nhắn tự động hàng loạt vào các nhóm.
2. **Bảo vệ API Key & Quota của Gemini:**
   * Luôn giữ bộ lọc từ khóa (Regex Filter) ở tầng Spring Boot trước khi gọi sang Python để loại bỏ 90% các tin nhắn chat phiếm hàng ngày (*"hello"*, *"đi ăn không"*, *"ok"*).
3. **Luôn duy trì nút "Mock Zalo Message":**
   * Dù kết nối Zalo thật đã chạy mượt, vẫn phải giữ lại chức năng giả lập tin nhắn đến để phục vụ việc kiểm thử nhanh và làm phương án dự phòng (Backup Plan) đảm bảo 100% không xảy ra sự cố mạng trong buổi chấm thi Chung kết.