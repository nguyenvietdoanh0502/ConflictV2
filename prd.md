# TÀI LIỆU ĐẶC TẢ YÊU CẦU SẢN PHẨM (PRODUCT REQUIREMENTS DOCUMENT - PRD)

* **Tên dự án (Dự kiến):** **UniSync** – Nền tảng Đồng bộ Học vụ Thông minh & Ôn tập Gamification tích hợp AI
* **Cuộc thi:** SICT WEB/APP CHALLENGE (Đơn vị phụ trách: Câu lạc bộ Tin học HIT)
* **Chủ đề:** Giải pháp số nâng cao trải nghiệm sinh viên (*Digital Solutions for Student Life*)
* **Nhóm định hướng:** Hỗ trợ học tập & Kết nối cộng đồng sinh viên

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

### 1.1. Bối cảnh & Nỗi đau thực tế (Problem Statement)
Sinh viên đại học hiện nay đang đối mặt với tình trạng **phân mảnh thông tin học vụ nghiêm trọng**:
1. **Thất lạc thông báo quan trọng trên Zalo:** Lịch nghỉ học đột xuất, lịch học bù, đổi phòng học, hạn nộp bài tập lớn (BTL) hay lịch kiểm tra giữa kỳ thường được giảng viên hoặc lớp trưởng thông báo trong các nhóm chat Zalo. Tin nhắn thảo luận của sinh viên dễ làm trôi mất các thông báo này, dẫn đến việc đi học nhầm giờ, quên lịch kiểm tra hoặc trễ deadline.
2. **Áp lực ôn thi với khối lượng tài liệu lớn:** Đề cương môn học, slide bài giảng thường dài hàng chục đến hàng trăm trang PDF/Word khô khan, khiến sinh viên khó hệ thống hóa kiến thức và nhanh chán nản khi tự ôn tập.
3. **Thiếu môi trường học tập tương tác:** Việc ôn tập đơn lẻ kém hiệu quả hơn so với việc cùng bạn bè thi đua giải đề hoặc trao đổi tài liệu ngay trên cùng một nền tảng quản lý lịch học.

### 1.2. Giải pháp đề xuất (Proposed Solution)
**UniSync** là một Web Application đóng vai trò như một **"Trợ lý học vụ cá nhân hóa"**, kết hợp quản lý Thời khóa biểu, tự động hóa cập nhật lịch từ Zalo bằng Trí tuệ nhân tạo (AI), chuyển đổi đề cương thành Minigame ôn tập và kết nối bạn bè:
* **AI Zalo-to-Calendar Sync (Có kiểm soát quyền riêng tư):** Người dùng chủ động ghép (mapping) các Group Zalo lớp học được phép đọc vào từng môn học trên Thời khóa biểu. AI sẽ phân tích tin nhắn mới trong các nhóm này để tự động phát hiện thông báo nghỉ học, học bù, kiểm tra và điền thẳng vào Thời khóa biểu.
* **AI Syllabus-to-Minigame:** Tự động đọc file đề cương (PDF/DOCX), tóm tắt trọng tâm và sinh ra các Minigame (Trắc nghiệm tốc độ, Lật thẻ ghép cặp khái niệm) giúp sinh viên ôn thi hiệu quả.
* **Smart Reminder & Social Learning:** Hệ thống nhắc nhở đa kênh trước giờ học/kiểm tra và mạng xã hội thu nhỏ giúp kết bạn, nhắn tin và thách đấu Minigame ôn tập.

### 1.3. Đối tượng người dùng mục tiêu (Target Audience)
* **Sinh viên đại học/cao đẳng (Đặc biệt là sinh viên CNTT/Kỹ thuật):** Cần quản lý lịch học nhiều biến động, nhiều bài tập nhóm và khối lượng kiến thức ôn thi lớn.
* **Cán bộ lớp / Nhóm trưởng học tập:** Cần công cụ đồng bộ thông báo lịch học chính xác đến các thành viên.

---

## 2. ĐẶC TẢ CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)

### Module 1: Quản lý Thời khóa biểu Thông minh (Smart Timetable)
* **FR-1.1:** Hiển thị Thời khóa biểu trực quan theo định dạng Ngày / Tuần / Tháng và dạng Danh sách (Agenda).
* **FR-1.2:** Quản lý môn học (CRUD): Tên môn học, mã lớp, giảng viên, phòng học mặc định, khung giờ cố định hàng tuần.
* **FR-1.3:** Phân loại sự kiện bằng màu sắc trực quan:
  * 🟦 **Màu xanh dương:** Lịch học cố định hàng tuần.
  * 🟧 **Màu cam:** Lịch học bù / Đổi phòng học (Do AI cập nhật hoặc tự thêm).
  * 🟥 **Màu đỏ:** Lịch kiểm tra / Thi / Hạn chót nộp bài (Deadline).
  * ⬜ **Màu xám (Gạch ngang):** Buổi học được báo nghỉ.
* **FR-1.4:** Trạng thái duyệt sự kiện AI: Các sự kiện do AI tự động tạo từ Zalo sẽ có nhãn `"✨ AI cập nhật từ Zalo"` kèm trích dẫn tin nhắn gốc để người dùng xác nhận hoặc chỉnh sửa 1 chạm.

### Module 2: Tích hợp Zalo theo Whitelist & AI Tự động điền lịch (Key AI Feature #1)
* **FR-2.1 (Xác thực Zalo):** Cung cấp mã QR hoặc cổng liên kết để người dùng kết nối tài khoản Zalo cá nhân với hệ thống.
* **FR-2.2 (Cơ chế Whitelist & Mapping bảo mật):**
  * Hệ thống hiển thị danh sách các Group Zalo của người dùng nhưng **mặc định tắt quyền đọc (OFF)** toàn bộ.
  * Người dùng chủ động chọn 1 Group Zalo cụ thể và **ghép nối (map)** với 1 môn học trên Thời khóa biểu (Ví dụ: Ghép nhóm Zalo *"Lập trình Web - CNTT01"* vào môn *"Lập trình Web"*).
  * Nút bật/tắt (Toggle) cho phép thu hồi quyền đọc của bất kỳ nhóm nào ngay lập tức.
* **FR-2.3 (AI Phân tích & Trích xuất thông báo học vụ):**
  * Chỉ khi có tin nhắn mới từ các `group_id` nằm trong Whitelist, hệ thống mới chuyển văn bản sang AI Engine.
  * AI tự động phân loại tin nhắn: Bỏ qua các tin nhắn tán gẫu thông thường; chỉ trích xuất khi phát hiện thông báo về *nghỉ học, học bù, đổi phòng, lịch kiểm tra, hạn nộp bài*.
  * Tự động quy đổi các từ chỉ thời gian tương đối (*"thứ 5 tuần này"*, *"sáng mai"*, *"tuần sau"*, *"tiết 1-3"*) thành ngày giờ chuẩn (`ISO 8601`) dựa trên thời gian thực và cập nhật vào Thời khóa biểu.
* **FR-2.4 (Chế độ Giả lập phục vụ Demo - Mock Webhook):** Trang bị giao diện giả lập tin nhắn Zalo đến ngay trên Web để đảm bảo kịch bản thuyết trình trước Ban Giám khảo luôn hoạt động ổn định 100% trong mọi điều kiện mạng.

### Module 3: Hệ thống Nhắc nhở Thông minh (Smart Reminder Engine)
* **FR-3.1:** Tự động quét các sự kiện sắp diễn ra trên Thời khóa biểu theo cấu hình của người dùng (mặc định: trước 30 phút đối với giờ đi học, trước 24 giờ và 2 giờ đối với lịch kiểm tra/deadline).
* **FR-3.2:** Đa kênh thông báo:
  * Thông báo đẩy trực tiếp trên trình duyệt (Web Push Notification / Toast Notification có âm thanh khi đang mở web).
  * Gửi Email tự động nhắc nhở các sự kiện quan trọng (Kiểm tra, Thi, Học bù).

### Module 4: Tổng hợp Đề cương & AI Minigame Ôn tập (Key AI Feature #2)
* **FR-4.1 (Tải lên & Quản lý tài liệu):** Cho phép người dùng tải lên các file đề cương, giáo trình, ghi chú (`.pdf`, `.docx`, `.txt`) gắn với từng môn học.
* **FR-4.2 (AI Tóm tắt đề cương - Smart Cheatsheet):** AI đọc nội dung file và sinh ra bản tóm tắt theo cấu trúc Markdown rõ ràng: *Khái niệm cốt lõi*, *Công thức/Quy tắc cần nhớ*, và *Các câu hỏi thường gặp*.
* **FR-4.3 (AI Sinh Minigame Ôn tập tự động):** Từ nội dung đề cương, AI tự động trích xuất dữ liệu để tạo ra 2 chế độ Minigame:
  * **Game 1 – Speed Quiz (Đấu trường Trắc nghiệm):** Bộ 10–15 câu hỏi trắc nghiệm 4 đáp án có đếm ngược thời gian (15s/câu), tính chuỗi trả lời đúng liên tiếp (Combo Streak), giải thích chi tiết lý do đúng/sai sau mỗi câu.
  * **Game 2 – Memory Match (Lật thẻ Ghép cặp khái niệm):** Ma trận 12 hoặc 16 thẻ bài úp (Một nửa là *Thuật ngữ/Câu hỏi ngắn*, một nửa là *Định nghĩa/Đáp án tương ứng*). Người chơi lật thẻ ghép đúng cặp trong thời gian ngắn nhất để leo bảng xếp hạng.

### Module 5: Kết nối Bạn bè & Học tập Cộng đồng (Social & Real-time Chat)
* **FR-5.1:** Tìm kiếm người dùng theo tên/email, gửi lời mời kết bạn, chấp nhận/hủy kết bạn và hiển thị trạng thái Online/Offline.
* **FR-5.2:** Nhắn tin thời gian thực (Real-time Chat 1-1) giữa bạn bè thông qua WebSocket.
* **FR-5.3 (Chia sẻ Học liệu & Thách đấu Minigame):** Người dùng có thể gửi trực tiếp **Thẻ Đề cương / Bộ Minigame** vào khung chat để bạn bè bấm vào ôn tập cùng và so điểm cao nhất (Leaderboard giữa bạn bè).

---

## 3. KIẾN TRÚC HỆ THỐNG & TECH STACK (TECHNICAL ARCHITECTURE)

### 3.1. Sơ đồ Kiến trúc Tổng thể (System Architecture)

```
+-------------------------------------------------------------------------+
|                           FRONTEND CLIENT                               |
|   ReactJS (Vite) + TailwindCSS + Shadcn/UI + FullCalendar + Framer      |
+------------------------------------+------------------------------------+
                                     | REST API (JWT) & WebSocket (STOMP)
                                     v
+-------------------------------------------------------------------------+
|                        CORE BACKEND & GATEWAY                           |
|                         Java Spring Boot 3.x                            |
|  - Auth & User Service          - Timetable & Reminder (@Scheduled)     |
|  - Social & WebSocket Chat      - Storage & Orchestrator                |
+---------+---------------------------------+-----------------------------+
          | Internal REST                   | Internal REST / Webhook
          v                                 v
+-------------------------------+ +---------------------------------------+
|      AI ENGINE SERVICE        | |          ZALO BRIDGE WORKER           |
|       Python (FastAPI)        | |          Node.js + zca-js             |
| - PyMuPDF / python-docx       | | - Quét QR & Lấy danh sách Group Zalo  |
| - Gemini 2.5 Flash API        | | - Lọc tin nhắn theo Whitelist GroupID |
| - Structured JSON Outputs     | | - Đẩy tin nhắn mới về Spring Boot     |
+-------------------------------+ +---------------------------------------+
```

### 3.2. Chi tiết Công nghệ Sử dụng (Tech Stack)
* **Frontend:**
  * Framework: `ReactJS 18+` (khởi tạo bằng `Vite`), ngôn ngữ `TypeScript` hoặc `JavaScript`.
  * UI & Styling: `TailwindCSS`, `Shadcn/UI`, `Lucide Icons`.
  * Thư viện Lịch: `@fullcalendar/react` (`daygrid`, `timegrid`, `interaction`).
  * Hiệu ứng Minigame: `Framer Motion`, `canvas-confetti` (hiệu ứng pháo giấy khi hoàn thành game).
  * Giao tiếp Real-time: `@stomp/stompjs` và `sockjs-client`.
* **Core Backend (Java):**
  * Framework: `Spring Boot 3.x` (Java 17/21).
  * Các module: `Spring Security + JWT`, `Spring Data JPA`, `Spring WebSocket`, `Spring Boot Starter Mail` (gửi email nhắc lịch), `Spring Scheduling`.
* **AI Microservice (Python):**
  * Framework: `FastAPI` + `Uvicorn`.
  * Xử lý tài liệu: `PyMuPDF` (`fitz`) cho file PDF, `python-docx` cho file Word.
  * AI SDK: `google-genai` (Sử dụng mô hình `gemini-2.5-flash` với tính năng **Structured Outputs / Pydantic Schema**).
* **Zalo Bridge Service:**
  * Môi trường: `Node.js` + `Express` + thư viện `zca-js` (kèm cơ chế Mock API an toàn cho buổi thi).
* **Cơ sở dữ liệu:**
  * `PostgreSQL` (Lưu trữ toàn bộ dữ liệu định dạng quan hệ và cột `JSONB` cho dữ liệu câu hỏi Minigame).

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

1. **`users`**:
   * `id` (UUID, PK), `email` (Unique), `password_hash`, `full_name`, `avatar_url`, `zalo_connected` (Boolean), `created_at`.
2. **`subjects` (Môn học trên Thời khóa biểu)**:
   * `id` (UUID, PK), `user_id` (FK), `name`, `code`, `lecturer`, `default_room`, `color_hex`, `day_of_week` (1-7), `start_time`, `end_time`, `semester`.
3. **`zalo_group_mappings` (Bảng Whitelist ghép nhóm Zalo với Môn học)**:
   * `id` (UUID, PK), `user_id` (FK), `subject_id` (FK -> `subjects.id`), `zalo_group_id` (String), `zalo_group_name` (String), `is_active` (Boolean - Cho phép đọc hay không), `last_synced_at`.
4. **`schedule_events` (Các buổi học cụ thể, lịch bù, lịch kiểm tra)**:
   * `id` (UUID, PK), `user_id` (FK), `subject_id` (FK, Nullable), `title`, `event_type` (`REGULAR_CLASS`, `MAKEUP_CLASS`, `CANCELLED_CLASS`, `EXAM`, `DEADLINE`), `start_datetime`, `end_datetime`, `room`, `source` (`MANUAL`, `ZALO_AI`), `raw_zalo_message` (Text - Tin nhắn gốc để đối chiếu), `is_reminded` (Boolean).
5. **`study_materials` (Đề cương & Dữ liệu Minigame)**:
   * `id` (UUID, PK), `user_id` (FK), `subject_id` (FK), `title`, `file_url`, `extracted_text` (Text), `ai_summary_markdown` (Text), `quiz_data_json` (JSONB), `memory_match_json` (JSONB), `created_at`.
6. **`game_scores` (Lịch sử điểm chơi Minigame)**:
   * `id` (UUID, PK), `material_id` (FK), `user_id` (FK), `game_type` (`SPEED_QUIZ`, `MEMORY_MATCH`), `score` (Int), `time_taken_seconds` (Int), `played_at`.
7. **`friendships` & `chat_messages` (Kết nối & Nhắn tin)**:
   * `friendships`: `id`, `requester_id` (FK), `addressee_id` (FK), `status` (`PENDING`, `ACCEPTED`).
   * `chat_messages`: `id`, `sender_id` (FK), `receiver_id` (FK), `content` (Text), `shared_material_id` (FK, Nullable - Dùng khi chia sẻ đề cương/game qua chat), `sent_at`.

---

## 5. ĐẶC TẢ TRÍ TUỆ NHÂN TẠO (AI SPECIFICATION - ĐÁP ỨNG THỂ LỆ THI)

> Phần này được thiết kế bám sát yêu cầu bắt buộc trong thể lệ của BTC: *"Đội thi phải trình bày rõ công nghệ AI đã sử dụng, vai trò của AI, dữ liệu đầu vào, kết quả mang lại và các hạn chế có thể phát sinh."*

### 5.1. Công nghệ & Vai trò của AI
* **Mô hình sử dụng:** Google **Gemini 2.5 Flash API** thông qua Python FastAPI.
* **Vai trò cốt lõi:** Không làm chatbot hỏi đáp chung chung. AI đóng vai trò là **Bộ xử lý ngôn ngữ tự nhiên ngầm (Background NLP Parser)** và **Bộ sinh học liệu tự động (Automated Content Generator)** gắn chặt với Cơ sở dữ liệu Thời khóa biểu và Đề cương của sản phẩm.

### 5.2. Bài toán AI số 1: Phân tích tin nhắn Group Zalo thành Sự kiện Thời khóa biểu
* **Dữ liệu đầu vào (Input):**
  ```json
  {
    "current_datetime": "2026-10-21T23:40:00+07:00",
    "subject_name": "Lập trình Web",
    "default_room": "402-A1",
    "sender_name": "Lớp trưởng Minh",
    "message_text": "Thông báo: Thứ 5 tuần này (22/10) thầy bận họp nên lớp mình nghỉ nhé. Học bù vào tiết 1-3 sáng thứ 7 tuần này tại phòng 305-A2. Tuần sau thứ 5 (29/10) kiểm tra giữa kỳ luôn nha ae!"
  }
  ```
* **Kết quả đầu ra (Structured JSON Output):**
  ```json
  {
    "is_academic_announcement": true,
    "confidence_score": 0.96,
    "detected_events": [
      {
        "event_type": "CANCELLED_CLASS",
        "title": "Nghỉ học: Lập trình Web",
        "start_datetime": "2026-10-22T07:00:00+07:00",
        "end_datetime": "2026-10-22T09:30:00+07:00",
        "room": "402-A1",
        "note": "Giảng viên bận họp"
      },
      {
        "event_type": "MAKEUP_CLASS",
        "title": "Học bù: Lập trình Web (Tiết 1-3)",
        "start_datetime": "2026-10-24T07:00:00+07:00",
        "end_datetime": "2026-10-24T09:30:00+07:00",
        "room": "305-A2",
        "note": "Học bù cho buổi nghỉ ngày 22/10"
      },
      {
        "event_type": "EXAM",
        "title": "Kiểm tra giữa kỳ: Lập trình Web",
        "start_datetime": "2026-10-29T07:00:00+07:00",
        "end_datetime": "2026-10-29T09:30:00+07:00",
        "room": "402-A1",
        "note": "Kiểm tra giữa kỳ"
      }
    ]
  }
  ```

### 5.3. Bài toán AI số 2: Chuyển đổi Đề cương thành Tóm tắt & Minigame
* **Dữ liệu đầu vào (Input):** Văn bản trích xuất từ file PDF/DOCX đề cương môn học do người dùng tải lên.
* **Kết quả đầu ra (Structured JSON Output):**
  ```json
  {
    "summary_markdown": "## 1. Trọng tâm kiến thức\n- Khái niệm RESTful API...\n## 2. Các mã trạng thái HTTP cần nhớ...",
    "speed_quiz": [
      {
        "question": "Trong kiến trúc Spring Boot, Annotation nào dùng để đánh dấu một lớp là REST Controller?",
        "options": ["@Controller", "@RestController", "@Service", "@Component"],
        "correct_index": 1,
        "explanation": "@RestController kết hợp @Controller và @ResponseBody giúp trả về dữ liệu JSON trực tiếp."
      }
    ],
    "memory_match_pairs": [
      {
        "pair_id": 1,
        "term": "HTTP 401",
        "definition": "Unauthorized - Chưa xác thực danh tính"
      },
      {
        "pair_id": 2,
        "term": "JWT",
        "definition": "JSON Web Token - Chuẩn truyền thông tin an toàn dưới dạng JSON"
      }
    ]
  }
  ```

### 5.4. Các hạn chế có thể phát sinh & Giải pháp khắc phục (Trình bày khi Phản biện)
| Hạn chế tiềm ẩn | Giải pháp kỹ thuật của đội thi |
| :--- | :--- |
| **1. Ngôn ngữ viết tắt, teencode trên Zalo** (*"t7", "btl", "ktr", "k học"*) hoặc tin nhắn đùa giỡn của sinh viên làm AI hiểu nhầm. | Bổ sung từ điển viết tắt sinh viên Việt Nam vào `System Prompt`. Đồng thời, mọi sự kiện do AI thêm đều có nhãn `"AI gợi ý"` kèm tin nhắn gốc để người dùng bấm xác nhận hoặc xóa bằng 1 click (Human-in-the-loop). |
| **2. Quyền riêng tư & Chính sách API của Zalo.** | Hệ thống áp dụng cơ chế **Whitelist nghiêm ngặt**: Chỉ đọc đúng `group_id` mà người dùng chủ động gán vào môn học, và chỉ lọc tin nhắn có từ khóa học vụ, tuyệt đối không lưu trữ tin nhắn cá nhân. |
| **3. Hiện tượng "Ảo giác" (Hallucination) khi tạo câu hỏi ôn tập từ đề cương.** | Áp dụng kỹ thuật **Context Grounding**: Ép nhiệt độ mô hình (`temperature = 0.2`) và ràng buộc AI chỉ được phép sinh câu hỏi từ văn bản trích xuất trong file PDF của người dùng. |

---

## 6. LỘ TRÌNH PHÁT TRIỂN SẢN PHẨM (DEVELOPMENT ROADMAP)

### Giai đoạn 1: Xây dựng Core Backend & Giao diện Thời khóa biểu (20% thời gian)
* [ ] Thiết lập cơ sở dữ liệu PostgreSQL và khởi tạo dự án Spring Boot + ReactJS.
* [ ] Hoàn thiện chức năng Đăng ký / Đăng nhập (JWT).
* [ ] Xây dựng màn hình Thời khóa biểu (`FullCalendar`), cho phép thêm/sửa/xóa môn học và sự kiện thủ công.

### Giai đoạn 2: Xây dựng Python AI Service & Tính năng Đề cương Minigame (25% thời gian)
* [ ] Dựng FastAPI server, viết hàm bóc tách văn bản từ PDF/DOCX.
* [ ] Tích hợp Gemini API với `response_schema` để sinh dữ liệu Tóm tắt, Speed Quiz và Memory Match.
* [ ] Xây dựng giao diện chơi 2 Minigame trên ReactJS với bộ đếm giờ, hiệu ứng lật thẻ và tính điểm.

### Giai đoạn 3: Kết nối Zalo Whitelist & Tự động điền Thời khóa biểu (30% thời gian)
* [ ] Dựng Zalo Bridge lấy danh sách Group và làm giao diện ghép Group Zalo vào môn học trên Thời khóa biểu.
* [ ] Xây dựng luồng Webhook đẩy tin nhắn từ Group đã ghép sang Python AI $\rightarrow$ Lưu vào Spring Boot $\rightarrow$ Cập nhật Thời khóa biểu thời gian thực qua WebSocket.
* [ ] Xây dựng bảng điều khiển **"Giả lập tin nhắn Zalo (Demo Simulator)"** để đảm bảo an toàn tuyệt đối khi trình diễn trên sân khấu.

### Giai đoạn 4: Hệ thống Nhắc nhở & Mạng xã hội Kết bạn / Chat (15% thời gian)
* [ ] Lập trình CronJob (`@Scheduled`) trong Spring Boot quét lịch sắp tới để bắn thông báo WebSocket và gửi Email.
* [ ] Hoàn thiện tính năng Kết bạn, Nhắn tin Real-time và nút "Chia sẻ Minigame vào khung chat".

### Giai đoạn 5: Kiểm thử, Đóng gói Dữ liệu Mẫu & Luyện Pitching (10% thời gian)
* [ ] Tạo sẵn dữ liệu mẫu phong phú (Thời khóa biểu cả tuần, 3 đề cương môn học CNTT thực tế, danh sách bạn bè).
* [ ] Chuẩn bị kịch bản Demo trực tiếp 3–5 phút và bộ câu trả lời phản biện trước Ban Giám khảo.

---

## 7. KỊCH BẢN DEMO TRÊN SÂN KHẤU (PITCHING & LIVE DEMO SCRIPT)

Để đạt tối đa **20/20 điểm phần Trình diễn & Phản biện**, buổi Demo sẽ diễn ra theo 3 bước liên hoàn:
1. **Phút 1 (Trải nghiệm Thời khóa biểu & Ghép nhóm Zalo):** Mở Thời khóa biểu của một sinh viên CNTT. Cho Ban Giám khảo thấy môn *"An toàn bảo mật thông tin"* đang được liên kết (Whitelist ON) với một Group Zalo thực tế trên điện thoại.
2. **Phút 2 (Khoảnh khắc "Wow" - AI Tự động điền lịch):** Một thành viên trong đội dùng điện thoại nhắn trực tiếp vào Group Zalo đó: *"Thông báo: Chiều thứ 6 tuần này lớp nghỉ nhé, chuyển sang học bù sáng thứ 7 tiết 1-3 phòng 501-A1, tuần sau kiểm tra 45 phút"*. Ngay trên màn chiếu, giao diện Web phát âm báo, hiển thị thông báo đã bắt được tin nhắn từ Zalo và **Thời khóa biểu tự động gạch buổi chiều thứ 6, đồng thời ghim buổi học bù màu cam vào sáng thứ 7 và lịch kiểm tra màu đỏ vào tuần sau**.
3. **Phút 3 (AI tạo Minigame Ôn tập & Thách đấu bạn bè):** Để chuẩn bị cho bài kiểm tra vừa được thêm vào lịch, người thuyết trình bấm vào buổi kiểm tra đó, tải lên file PDF đề cương môn học. Trong vài giây, AI xuất ra bản tóm tắt và mở ngay màn hình **Minigame Lật thẻ / Trắc nghiệm**, chơi thử 2 câu trực tiếp trên sân khấu rồi bấm nút **"Gửi thách đấu cho bạn bè"** qua khung Chat Real-time.