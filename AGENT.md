# AGENT.md — Hướng dẫn dự án UniSync (repo ConflictV2) cho Coding Agent

> Đọc file này **trước** khi đọc hoặc sửa bất kỳ thư mục nào. Đây là tài liệu cấp
> dự án. Chi tiết quy ước của code cũ nằm ở `backend/AGENTS.MD` và
> `frontend/AGENTS.MD`. Lưu ý hai file đó mô tả sản phẩm cũ "Conflict" và
> **chưa cập nhật các module mới của UniSync**. Khi các tài liệu mâu thuẫn nhau, **code và cấu
> hình chạy được là nguồn sự thật**. Sau đó ưu tiên [`plan/prd.md`](./plan/prd.md), rồi đến file này.

---

## 1. Dự án là gì

**UniSync** là nền tảng đồng bộ học vụ thông minh và ôn tập gamification có tích
hợp AI, dự thi SICT WEB/APP CHALLENGE (CLB Tin học HIT). Đặc tả đầy đủ:
[`plan/prd.md`](./plan/prd.md).

Năm module sản phẩm:

1. **Smart Timetable**: thời khóa biểu Ngày/Tuần/Tháng/Agenda, CRUD môn học, màu theo loại sự kiện, duyệt sự kiện AI 1 chạm.
2. **Zalo Whitelist + AI Sync**: ghép group Zalo vào môn học. AI đọc tin nhắn mới (văn bản & ảnh chụp TKB) và tự điền nghỉ học, học bù, đổi phòng, kiểm tra, deadline.
3. **Smart Reminder**: quét sự kiện sắp tới rồi nhắc qua WebSocket toast/in-app notification và Email.
4. **Syllabus → Minigame**: upload PDF/DOCX/TXT. AI tóm tắt (Smart Cheatsheet + Flashcard) và sinh Speed Quiz + Memory Match.
5. **Social**: kết bạn, chat realtime 1-1, chia sẻ học liệu và thách đấu minigame trực tiếp trong khung chat, leaderboard bạn bè/toàn cục.

Repo này được mở rộng từ nền tảng mạng xã hội thu nhỏ ("Conflict") sang
UniSync. Tên thư mục/package cũ (`ConflictV2`, `com.conflict.be`, `conflict`,
`hadilao`, `Roamly`, PIN `RML-` / `UNI-`) là tàn dư. Chỉ đổi tên khi task yêu cầu rõ ràng.

---

## 2. Trạng thái triển khai (cập nhật theo thực tế mã nguồn)

| Hạng mục | Trạng thái | Vị trí |
| --- | --- | --- |
| Auth (register + OTP email, login, refresh cookie, logout, forgot/reset/change password, rate limit) | ✅ Xong | `backend/.../modules/auth`, `frontend/src/features/auth` |
| Profile + avatar Cloudinary | ✅ Xong | `modules/user`, `features/profile` |
| Kết bạn (PIN), danh sách/lời mời | ✅ Xong (cần thêm tìm theo tên/email) | `modules/friendship`, `features/friend` |
| Chat 1-1 STOMP & Social Sharing | ✅ Xong (Chat 1-1 STOMP, ChatWindow & MessengerDropdown UI, Rich Card chia sẻ đề cương & thách đấu Minigame) | `modules/chat`, `features/chat` |
| Online/Offline presence | ❌ Chưa (UI đang hiển thị chấm xanh tĩnh) | — |
| Môn học / Thời khóa biểu / FullCalendar | ✅ Xong nền tảng & UI lịch tuần (Migrations V8–V10, CRUD môn học & sự kiện, tự sinh buổi học định kỳ, duyệt sự kiện AI; cần bổ sung view Ngày/Tháng/Agenda & UI sửa môn học) | `modules/subject`, `modules/schedule`, `modules/zalo`, `features/timetable` |
| AI Engine (Python FastAPI + Gemini) | ✅ Xong (Bóc tách tin nhắn văn bản & ảnh TKB Zalo, tách ca A–L / M–Z, 16 tiết học, xử lý PDF/DOCX/TXT 2 giai đoạn, Mock Mode, Auth `X-Internal-Api-Key`, Streamlit Playground) | `ai/` |
| Zalo Bridge (Node + zca-js) + Demo Simulator | ✅ Xong (Multi-session theo `userId`, QR login, đồng bộ whitelist, đẩy tin nhắn & ảnh về Backend; có `POST /api/v1/zalo/simulate` & `MockZaloSimulator.jsx`) | `zalo-bridge/`, `modules/zalo`, `features/timetable` |
| Đề cương + Minigame + điểm + Chia sẻ/Thách đấu | ✅ Xong (V11 + V13, AI bóc tách PDF/DOCX/TXT, Smart Cheatsheet + Xem đề cương gốc & PDF preview/download, Speed Quiz, Memory Match, Chia sẻ đề cương & Thách đấu bạn bè, Leaderboard Global/Friends) | `backend/.../modules/material`, `ai/app`, `frontend/.../features/study` |
| Thông báo & Dropdown Facebook (TKB mới, Lịch học hôm nay, Tin nhắn, Đề cương & Thách đấu) | ✅ Xong (V12, WS `/user/queue/notifications`, Dropdown UI hỗ trợ `MATERIAL_SHARED`, `MINIGAME_CHALLENGE`, `FRIEND_REQUEST`, Cron 06:00 sáng nhắc lịch trong ngày) | `backend/.../modules/notification`, `frontend/.../features/notification` |
| Reminder engine nâng cao (nhắc trước 30p/24h/2h + cấu hình cá nhân + mail) | 🔄 Một phần (Đã có `DailyScheduleNotificationScheduler` 06:00 sáng; chưa có bảng `user_reminder_settings` & nhắc trước 30p/24h/2h qua Email) | `modules/notification/scheduler` |
| Dashboard Trung tâm Học vụ (`HomePage.jsx`) | ✅ Xong (Landing page khi chưa đăng nhập; Trung tâm Học vụ + `ContactsSidebar` khi đã đăng nhập) | `frontend/src/pages/HomePage.jsx` |
| Docker Production & Nginx Reverse Proxy | ✅ Xong (`docker-compose.prod.yml` điều phối `backend`, `ai-engine`, `zalo-bridge`, `redis`, `nginx` HTTPS) | `docker-compose.prod.yml`, `nginx/` |

---

## 3. Kiến trúc đích & Thực tế vận hành

```text
+------------------------------- FRONTEND (frontend/) -------------------------------+
| React 19 + Vite + Tailwind + FullCalendar + KaTeX + Lucide + STOMP/SockJS          |
+--------------------+-------------------------------------+-------------------------+
                     | REST /api/v1 (JWT Bearer)           | STOMP over WS (/ws, /ws-sockjs)
                     v                                     v
+------------------------------ CORE BACKEND (backend/) -----------------------------+
| Spring Boot 3.5 / Java 17: auth, user, friendship, chat, subject, schedule,        |
| zalo (client + proxy + webhook), material (study + game_scores), notification      |
| PostgreSQL 15 (Flyway V1..V13) + Redis 7                                           |
+-------------+------------------------------------------+---------------------------+
              | Internal REST (X-Internal-Api-Key)       | Internal REST / Webhook (X-Internal-Api-Key)
              v                                          v
+------- AI ENGINE (ai/) --------+          +------- ZALO BRIDGE (zalo-bridge/) -------+
| FastAPI + google-genai         |          | Node.js + Express + zca-js               |
| gemini-2.5-flash, Pydantic v2  |          | Multi-user session, QR login, groups,    |
| PyMuPDF, python-docx           |          | whitelist filter, POST message -> BE     |
+--------------------------------+          +------------------------------------------+
```

Nguyên tắc ranh giới:

- **Frontend chỉ nói chuyện với Spring Boot (`/api/v1/**`, `/ws`, `/ws-sockjs`).** Không bao giờ gọi trực tiếp AI Engine hoặc Zalo Bridge. Trên môi trường Production, Nginx chặn cứng `/api/v1/internal/**` và không mở cổng của `zalo-bridge` hay `ai-engine` ra Internet.
- **Spring Boot là orchestrator và chủ sở hữu dữ liệu duy nhất.** AI Engine **stateless** (không có DB). Zalo Bridge chỉ giữ session Zalo theo `userId` và whitelist.
- Mọi lời gọi service ↔ service đi qua header `X-Internal-Api-Key`.
- Whitelist được kiểm tra **hai lớp**: bridge lọc theo `group_id` trong whitelist, backend kiểm tra lại mapping `is_active` trước khi gọi AI.

### Luồng chính "Zalo → Thời khóa biểu"

```text
Tin nhắn group Zalo (hoặc Demo Simulator POST /api/v1/zalo/simulate)
 -> zalo-bridge lọc whitelist -> POST /api/v1/internal/zalo/messages
 -> backend: tìm mapping active (user, group -> subject), lọc sơ bộ qua ZaloKeywordFilter
 -> AI Engine POST /v1/zalo/parse-message (hỗ trợ cả văn bản & ảnh thời khóa biểu Vision)
 -> nếu is_academic_announcement: tách ca học theo tên sinh viên (nếu có), lưu schedule_events
    (source=ZALO_AI, status=PENDING_REVIEW, raw_zalo_message, attachment_urls, ai_confidence);
    CANCELLED_CLASS gắn related_event_id vào buổi học gốc
 -> push STOMP /user/queue/schedule & /user/queue/notifications cho user -> FE hiển thị banner/toast, invalidate cache lịch
 -> người dùng Xác nhận / Từ chối / Xóa (1 chạm)
```

---

## 4. Bản đồ repository

```text
ConflictV2/
|- AGENT.md                 (file này) hướng dẫn cấp dự án
|- plan/
|  `- prd.md                đặc tả sản phẩm đầy đủ (Product Requirements Document)
|- docker-compose.prod.yml  điều phối Production (backend, ai-engine, zalo-bridge, redis, nginx)
|- nginx/                   cấu hình Nginx Reverse Proxy & SSL (nginx.conf, conf.d/app.conf)
|- backend/                 Spring Boot core API
|  |- src/main/java/com/conflict/be/
|  |  |- core/              ApiResponse, config, security, exception, constant, utils
|  |  `- modules/<feature>/ auth, user, friendship, chat, subject, schedule, zalo, material, notification
|  |- src/main/resources/   application*.yml, db/migration (Flyway V1..V13)
|  |- src/test/             JUnit5 + Mockito + MockMvc, profile `test` (H2)
|  |- docker-compose.yml    Postgres 15 (5433) + Redis 7 (6380) cho local dev
|  `- AGENTS.MD             quy ước chi tiết backend
|- frontend/                React 19 SPA
|  |- src/app/store.js      Redux store (auth, chat, baseApi)
|  |- src/services/         baseApi.js (RTK Query + refresh mutex); realtime.js (STOMP/SockJS)
|  |- src/features/<name>/  auth, profile, friend, chat, timetable, study, notification
|  |- src/layouts/          Header, Footer, MainLayout
|  |- src/pages/            HomePage.jsx (Landing page & Trung tâm Học vụ)
|  `- AGENTS.MD             quy ước chi tiết frontend
|- ai/                      FastAPI AI Engine (app/main.py, gemini_service.py, extractor_service.py, prompts.py, playground.py, tests/)
`- zalo-bridge/             Node.js Multi-session Zalo Bridge (src/server.js, sessionManager.js, zaloUserClient.js)
```

Không chỉnh sửa: `node_modules/`, `target/`, `dist/`, `.venv/`, `.idea/`,
`.tmp/`, lockfile (trừ khi đổi dependency), `backend/.gemini/skills/`.

---

## 5. Tech stack và ràng buộc phiên bản

| Lớp | Công nghệ | Ràng buộc |
| --- | --- | --- |
| Backend | Java **17**, Spring Boot **3.5.15**, Security + JJWT 0.11.5, Data JPA, Flyway, WebSocket (STOMP + SockJS), Mail (`@EnableAsync`), Validation, Redis, Springdoc, Lombok, Cloudinary | Không dùng cú pháp chỉ có ở Java 21. DTO theo phong cách Lombok/record xung quanh |
| Frontend | React 19, Vite 8, React Router 7, Redux Toolkit + **RTK Query** (lớp API duy nhất), Tailwind 3, FullCalendar 6, `@stomp/stompjs` + `sockjs-client`, `canvas-confetti`, `katex`, `lucide-react` | JavaScript/JSX (không TS). Giữ state server trong RTK Query |
| AI Engine | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `google-genai`, PyMuPDF (`fitz`), `python-docx`, `httpx`, `streamlit`, `pytest` | Model chuẩn `gemini-2.5-flash`, `temperature=0.2`, `response_schema` bằng Pydantic |
| Zalo Bridge | Node.js 20+, Express, `zca-js` | Quản lý phiên theo `userId`, lưu session tại `data/sessions` |
| Data | PostgreSQL 15 (JSONB cho dữ liệu game, BYTEA cho file đề cương gốc), Redis 7 | Flyway (`V1`..`V13`) là nguồn sự thật của schema |

---

## 6. Quy tắc làm việc cho Agent

1. **Đọc trước, sửa sau.** Đọc controller → service → DTO → entity → test → FE api/page liên quan. Tìm mọi call site trước khi đổi contract.
2. **Tôn trọng working tree của người dùng.** Chạy `git status --short` trước và sau. Không reset, format hàng loạt hay ghi đè thay đổi không liên quan. Không commit/push, không xóa volume Docker, không reset DB nếu không được yêu cầu.
3. **Vertical slice.** Một thay đổi contract phải đồng bộ: migration → entity → DTO/validation → service → controller → `ErrorCode` → test BE → `xxxApi.js` + tag cache → UI + map lỗi tiếng Việt.
4. **Bảo mật.** Không in hoặc commit `.env`, JWT, OTP, cookie, API key Gemini, mật khẩu SMTP, session Zalo. Không lưu token vào localStorage/sessionStorage. Không mở cổng nội bộ (`/api/v1/internal/**`, `zalo-bridge`, `ai-engine`) ra ngoài Nginx public.
5. **Giữ UTF-8 tiếng Việt.** PowerShell có thể hiển thị mojibake, điều đó không có nghĩa là file hỏng.
6. **Migration chỉ thêm, không sửa.** Tạo `V{n+1}__mo_ta.sql`. Không sửa file Flyway đã áp dụng.
7. **AI luôn có Human-in-the-loop.** Sự kiện do AI tạo luôn khởi tạo ở trạng thái `PENDING_REVIEW` để người dùng xác nhận hoặc từ chối.
8. **Demo phải chạy được ổn định.** Mọi tính năng AI/Zalo đều có đường giả lập (`POST /api/v1/zalo/simulate`, `AI_MODE=mock`) phục vụ trình diễn trên sân khấu.
9. Chạy check hẹp nhất khi lặp, chạy check đầy đủ của service đã chạm trước khi bàn giao. Báo riêng lỗi có sẵn và lỗi do mình gây ra.
10. **Cập nhật file này** (bảng §2, contract §8, env §7) khi kiến trúc, lệnh, contract hoặc trạng thái thay đổi.

---

## 7. Chạy local, cổng và biến môi trường

| Service | Lệnh (từ thư mục service) | Cổng |
| --- | --- | --- |
| Postgres + Redis | `docker compose up -d postgres redis` (trong `backend/`) | 5433, 6380 |
| Backend | `mvnw.cmd spring-boot:run` (Windows) / `./mvnw spring-boot:run` hoặc `mvn spring-boot:run` | 8080 (`/api/v1`, Swagger `/swagger-ui/index.html`, WS `/ws` & `/ws-sockjs`) |
| Frontend | `npm ci` rồi `npm run dev` (hoặc `npm.cmd run dev`) | 5173 |
| AI Engine | `uvicorn app.main:app --reload --port 8000` | 8000 |
| Zalo Bridge | `npm run dev` | 3001 |

Kiểm tra:

- Backend: `mvn test`, `mvn clean verify`, `mvn -Dtest=XxxTest test`.
- Frontend: `npm run lint`, `npm run build`.
- AI: `pytest`. Bridge: `npm test`.

Biến môi trường (chỉ khai báo trong `.env` bị ignore, `.env.example` chỉ chứa placeholder):

```text
# backend
DB_URL, DB_USERNAME, DB_PASSWORD, REDIS_HOST, REDIS_PORT(=6380 với compose local)
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, JWT_SECRET (Base64, HS256)
COOKIE_SECURE, COOKIE_SAME_SITE, CORS_ALLOWED_ORIGINS
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
AI_SERVICE_URL=http://localhost:8000, ZALO_BRIDGE_URL=http://localhost:3001
INTERNAL_API_KEY, AI_TIMEOUT_SECONDS=120
# frontend
VITE_API_URL=http://localhost:8080/api      (có hậu tố /api; endpoint FE bắt đầu bằng /v1)
VITE_WS_URL=ws://localhost:8080/ws
# ai
GEMINI_API_KEY, GEMINI_MODEL=gemini-2.5-flash, AI_MODE=live|mock, INTERNAL_API_KEY
# zalo-bridge
BACKEND_URL=http://localhost:8080/api/v1/internal/zalo/messages, INTERNAL_API_KEY, PORT=3001
```

---

## 8. Contract

### 8.1 REST (backend)

- Base `/api/v1`. Controller dùng `@RestApiV1` + hằng số trong `UrlConstant`.
- Mọi response bọc trong `ApiResponse<T>`: `{code, status, message, data, errorCode, timestamp}`. **HTTP status là chuẩn**.
- Lỗi nghiệp vụ: `throw new AppException(ErrorCode.X)`.

Endpoint **đã triển khai**:

```text
# Auth & User
POST   /auth/register | /auth/verify-otp | /auth/login | /auth/refresh-token | /auth/logout
POST   /auth/forgot-password | /auth/verify-otp-forgot-password | /auth/reset-password | /auth/change-password
GET    /users/me
PATCH  /user/update-profile (multipart)

# Friendship & Chat
GET    /friends
DELETE /friends/{friendshipId}
POST   /friends/requests
GET    /friends/requests/incoming | /friends/requests/outgoing
PATCH  /friends/requests/{requestId}/accept
DELETE /friends/requests/{requestId}
GET    /chat/{friendUserId}/messages?page&size

# Subjects & Schedule
GET|POST       /subjects
PUT|DELETE     /subjects/{id}
GET|POST       /schedule/events?from&to
PUT|DELETE     /schedule/events/{id}
POST           /schedule/events/{id}/confirm | /schedule/events/{id}/reject

# Zalo Bridge Proxy, Mappings & Simulator
GET    /zalo/bridge/status | /zalo/bridge/groups
POST   /zalo/bridge/qr/generate | /zalo/bridge/logout | /zalo/bridge/groups/refresh
GET|POST       /zalo/mappings
PATCH          /zalo/mappings/{id}/toggle
DELETE         /zalo/mappings/{id}
POST           /zalo/simulate                 (JWT required - Demo Simulator FR-2.4)
POST           /internal/zalo/messages        (chỉ cho zalo-bridge nội bộ, header X-Internal-Api-Key)

# Study Materials & Minigames
GET|POST       /materials
GET            /materials/shared
GET|DELETE     /materials/{id}
GET            /materials/{id}/file?download=
POST           /materials/{id}/share
POST           /materials/{id}/regenerate
POST           /materials/{id}/generate-minigames
POST           /materials/{id}/scores
GET            /materials/{id}/leaderboard?gameType=SPEED_QUIZ|MEMORY_MATCH&scope=global|friends

# Notifications
GET    /notifications?page&size&unreadOnly
GET    /notifications/unread-count
PATCH  /notifications/{id}/read
POST   /notifications/read-all
DELETE /notifications/{id}
POST   /notifications/trigger-today
```

### 8.2 WebSocket (STOMP)

- Endpoint `/ws` (WebSocket thuần) và `/ws-sockjs` (SockJS fallback). Header `Authorization: Bearer <accessToken>` gửi trong frame CONNECT.
- Prefix: app `/app`, user `/user`, broker `/queue`.
- **Hiện có:** SEND `/app/chat.send` `{recipientId, content, sharedMaterialId?, messageType?, challengeGameType?, challengerScore?, challengerTimeSeconds?}`. SUBSCRIBE `/user/queue/messages`, `/user/queue/errors`, `/user/queue/schedule`, `/user/queue/notifications`.
- `WebSocketAuthChannelInterceptor` **whitelist cứng** các destination và xác thực access token (`isAccessTokenValid`).

### 8.3 AI Engine (nội bộ, port 8000)

- `POST /v1/zalo/parse-message`: phân tích tin nhắn văn bản hoặc ảnh thời khóa biểu từ group Zalo.
- `POST /v1/materials/summarize`: trích xuất văn bản từ PDF/DOCX/TXT và sinh Smart Cheatsheet Markdown (Stage 1).
- `POST /v1/materials/generate-games`: sinh bộ câu hỏi `speed_quiz` và `memory_match_pairs` từ bản tóm tắt (Stage 2).
- `POST /v1/materials/process`: xử lý trọn gói (tóm tắt + minigame).

### 8.4 Zalo Bridge (nội bộ, port 3001)

- Các endpoint nội bộ (yêu cầu `X-Internal-Api-Key`):
  - `GET /zalo/session/:userId/status`
  - `POST /zalo/session/:userId/qr/generate`
  - `POST /zalo/session/:userId/logout`
  - `GET /zalo/session/:userId/groups`
  - `POST /zalo/session/:userId/groups/refresh`
- Khi nhận tin nhắn mới từ Zalo, bridge đẩy về `POST /api/v1/internal/zalo/messages` kèm `X-Internal-Api-Key`.

---

## 9. Mô hình dữ liệu (Flyway V1–V13)

- **V1–V7 (Cốt lõi & Mạng xã hội):**
  - `users`: UUID, email, `password_hash`, `full_name`, avatar, `pin_code`, `status`, timestamps.
  - `friendships`: cặp không thứ tự `low_user_id/high_user_id`, `requester_id`, `PENDING|ACCEPTED`.
  - `chat_messages`: `sender_id`, `recipient_id`, `content`, `created_at`.
- **V8–V10 (Thời khóa biểu & Đồng bộ Zalo):**
  - `users`: thêm `zalo_connected`.
  - `subjects`: môn học kèm lịch cố định hàng tuần và ngày bắt đầu/kết thúc học kỳ (`semester_start_date`, `semester_end_date`).
  - `zalo_group_mappings`: liên kết `(user_id, zalo_group_id)` với `subject_id`, `is_active` mặc định `false`.
  - `schedule_events`: sự kiện lịch học (`REGULAR_CLASS`, `MAKEUP_CLASS`, `CANCELLED_CLASS`, `EXAM`, `DEADLINE`), trạng thái (`CONFIRMED`, `PENDING_REVIEW`, `REJECTED`), `source` (`MANUAL`, `ZALO_AI`), `raw_zalo_message`, `attachment_urls`, `related_event_id`.
- **V11 & V13 (Học liệu, Minigame & Chia sẻ qua Chat):**
  - `study_materials`: thông tin đề cương, `extracted_text`, `ai_summary_markdown`, `quiz_data_json` (JSONB), `memory_match_json` (JSONB), `processing_status`.
  - `study_material_files`: lưu trữ nhị phân (`BYTEA`) tệp gốc để xem trước PDF / tải về.
  - `game_scores`: điểm chơi `SPEED_QUIZ` và `MEMORY_MATCH`.
  - `chat_messages`: mở rộng thêm `shared_material_id`, `message_type`, `metadata` cho thẻ chia sẻ đề cương & thách đấu.
- **V12 (Thông báo):**
  - `notifications`: thông báo đa loại (`SCHEDULE_NEW`, `DAILY_SUMMARY`, `FRIEND_REQUEST`, `MATERIAL_SHARED`, `MINIGAME_CHALLENGE`, ...).

---

## 10. Quy tắc nghiệp vụ quan trọng

- **Múi giờ:** mọi tính toán dùng `Asia/Ho_Chi_Minh` và ISO 8601 có offset `+07:00`.
- **Bảng giờ tiết học:** 16 tiết học chuẩn (07:00–22:20).
- **Màu sự kiện (FR-1.3):** `REGULAR_CLASS` xanh dương, `MAKEUP_CLASS` cam, `EXAM`/`DEADLINE` đỏ, `CANCELLED_CLASS` xám gạch ngang.
- **Sự kiện AI:** luôn có trạng thái chờ duyệt (`PENDING_REVIEW`), hiển thị tin nhắn gốc, có nút xác nhận/từ chối 1 chạm.
- **Quyền riêng tư Zalo:** mapping mặc định OFF (`is_active = false`).

---

## 11. Nợ kỹ thuật còn lại & Hạng mục tiếp theo

- Thời khóa biểu trên Frontend mới bật chế độ xem Tuần (`timeGridWeek`), cần mở thêm Ngày/Tháng/Agenda và form sửa môn học.
- Cần bổ sung tìm kiếm người dùng theo tên/email (`GET /api/v1/users/search?q=`) và trạng thái Online/Offline thực tế qua WebSocket.
- Cần mở rộng Smart Reminder thêm bảng cấu hình cá nhân (`user_reminder_settings`) và quét nhắc lịch qua Email trước 30 phút / 24h / 2h.
