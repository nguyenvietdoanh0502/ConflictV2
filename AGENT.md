# AGENT.md — Hướng dẫn dự án UniSync (repo ConflictV2) cho Coding Agent

> Đọc file này **trước** khi đọc hoặc sửa bất kỳ thư mục nào. Đây là tài liệu cấp
> dự án. Chi tiết quy ước của code cũ nằm ở `backend/AGENTS.MD` và
> `frontend/AGENTS.MD`. Lưu ý hai file đó mô tả sản phẩm cũ "Conflict" và
> **chưa cập nhật module chat**. Khi các tài liệu mâu thuẫn nhau, **code và cấu
> hình chạy được là nguồn sự thật**. Sau đó ưu tiên `prd.md`, rồi đến file này.

---

## 1. Dự án là gì

**UniSync** là nền tảng đồng bộ học vụ thông minh và ôn tập gamification có tích
hợp AI, dự thi SICT WEB/APP CHALLENGE (CLB Tin học HIT). Đặc tả đầy đủ:
[`prd.md`](./prd.md).

Năm module sản phẩm:

1. **Smart Timetable**: thời khóa biểu Ngày/Tuần/Tháng/Agenda, CRUD môn học, màu theo loại sự kiện.
2. **Zalo Whitelist + AI Sync**: ghép group Zalo vào môn học. AI đọc tin nhắn mới và tự điền nghỉ học, học bù, đổi phòng, kiểm tra, deadline.
3. **Smart Reminder**: quét sự kiện sắp tới rồi nhắc qua WebSocket toast/Web Push và Email.
4. **Syllabus → Minigame**: upload PDF/DOCX/TXT. AI tóm tắt (cheatsheet) và sinh Speed Quiz + Memory Match.
5. **Social**: kết bạn, chat realtime 1-1, chia sẻ học liệu và thách đấu minigame, leaderboard bạn bè.

Repo này **đang được refactor** từ một mini mạng xã hội ("Conflict") sang
UniSync. Tên thư mục/package cũ (`ConflictV2`, `com.conflict.be`, `conflict`,
`hadilao`, `Roamly`, PIN `RML-`) là tàn dư. Chỉ đổi tên khi task yêu cầu rõ ràng.

---

## 2. Trạng thái triển khai (cập nhật khi hoàn thành hạng mục)

| Hạng mục | Trạng thái | Vị trí |
| --- | --- | --- |
| Auth (register + OTP email, login, refresh cookie, logout, forgot/reset/change password, rate limit) | ✅ Xong | `backend/.../modules/auth`, `frontend/src/features/auth` |
| Profile + avatar Cloudinary | ✅ Xong | `modules/user`, `features/profile` |
| Kết bạn (PIN), danh sách/lời mời | ✅ Xong (cần thêm tìm theo tên/email) | `modules/friendship`, `features/friend` |
| Chat 1-1 STOMP (backend) | ✅ Backend xong, ❌ chưa có UI | `modules/chat` |
| Online/Offline presence | ❌ Chưa | — |
| Môn học / Thời khóa biểu / FullCalendar | 🔄 Đang triển khai (DB Migration V8, V9, Entity, Repository xong) | `modules/subject`, `modules/schedule`, `modules/zalo` |
| AI Engine (Python FastAPI + Gemini) | 🔄 Đang triển khai (Bóc tách tin nhắn Zalo, 16 tiết học, Mock Mode, Auth) | `ai/` |
| Zalo Bridge (Node + zca-js) + Demo Simulator | ❌ Chưa | `zalo-bridge/` (sẽ tạo) |
| Đề cương + Minigame + điểm | ✅ Xong (V11, AI bóc tách PDF/DOCX/TXT, Cheatsheet, Speed Quiz, Memory Match, Leaderboard) | `backend/.../modules/material`, `ai/app`, `frontend/.../features/study` |
| Thông báo & Dropdown Facebook (TKB mới, Lịch học hôm nay, Tin nhắn) | ✅ Xong (V12, WS `/user/queue/notifications`, Dropdown UI) | `backend/.../modules/notification`, `frontend/.../features/notification` |
| Reminder engine (`@Scheduled` + mail + WS) | ❌ Chưa | — |
| Dashboard thay trang chủ feed tĩnh | ❌ Chưa (`pages/HomePage.jsx` là mock, sẽ xóa) | — |
| Docker/CI cấp monorepo | ❌ Chưa | — |

Báo cáo phân tích giữ/bỏ/bổ sung đầy đủ được tạo khi lập kế hoạch refactor. Lộ
trình thực hiện: **P0** dọn dẹp + sửa nền tảng → **P1** Timetable → **P2** AI +
Minigame → **P3** Zalo + Simulator → **P4** Reminder + Chat UI → **P5** seed demo,
Docker, CI.

---

## 3. Kiến trúc đích

```text
+------------------------------- FRONTEND (frontend/) -------------------------------+
| React 19 + Vite + Tailwind + Shadcn/UI + FullCalendar + Framer Motion (JavaScript) |
+--------------------+-------------------------------------+-------------------------+
                     | REST /api/v1 (JWT Bearer)           | STOMP over WebSocket /ws
                     v                                     v
+------------------------------ CORE BACKEND (backend/) -----------------------------+
| Spring Boot 3.5 / Java 17: auth, user, friendship, chat, presence, subject,        |
| schedule, zalo, material, game, reminder, notification                             |
| PostgreSQL (Flyway) + Redis                                                        |
+-------------+------------------------------------------+---------------------------+
              | Internal REST (X-Internal-Api-Key)       | Internal REST / Webhook
              v                                          v
+------- AI ENGINE (ai/) --------+          +------- ZALO BRIDGE (zalo-bridge/) -------+
| FastAPI + google-genai         |          | Node.js + Express + zca-js               |
| gemini-2.5-flash, Pydantic     |          | QR login, list groups, whitelist filter, |
| PyMuPDF, python-docx           |          | POST message -> backend; mock mode       |
+--------------------------------+          +------------------------------------------+
```

Nguyên tắc ranh giới:

- **Frontend chỉ nói chuyện với Spring Boot.** Không bao giờ gọi trực tiếp AI Engine hoặc Zalo Bridge.
- **Spring Boot là orchestrator và chủ sở hữu dữ liệu duy nhất.** AI Engine **stateless** (không có DB). Zalo Bridge chỉ giữ session Zalo và whitelist trong bộ nhớ/cache.
- Mọi lời gọi service ↔ service đi qua `/api/v1/internal/**` hoặc cổng nội bộ, kèm header `X-Internal-Api-Key`.
- Whitelist được kiểm tra **hai lớp**: bridge lọc theo `group_id`, backend kiểm tra lại mapping `is_active` trước khi gọi AI.

### Luồng chính "Zalo → Thời khóa biểu"

```text
Tin nhắn group Zalo (hoặc Demo Simulator)
 -> zalo-bridge lọc whitelist -> POST /api/v1/internal/zalo/messages
 -> backend: tìm mapping active (user, group -> subject), dedupe theo messageId
 -> AI Engine POST /v1/zalo/parse-message (kèm current_datetime, subject, default_room)
 -> nếu is_academic_announcement: lưu schedule_events (source=ZALO_AI, status=PENDING_REVIEW,
    raw_zalo_message, ai_confidence); CANCELLED_CLASS gắn vào buổi học gốc
 -> push STOMP /user/queue/schedule cho user -> FE phát âm báo, toast, invalidate cache lịch
 -> người dùng Xác nhận / Sửa / Xóa (1 chạm)
```

Demo Simulator (`POST /api/v1/zalo/simulate`, cần JWT) phải đi vào **đúng
pipeline đó** từ bước "tìm mapping". Không được làm một đường giả riêng.

---

## 4. Bản đồ repository

```text
ConflictV2/
|- AGENT.md                 (file này) hướng dẫn cấp dự án
|- prd.md                   đặc tả sản phẩm (nguồn yêu cầu)
|- backend/                 Spring Boot core API
|  |- src/main/java/com/conflict/be/
|  |  |- core/              ApiResponse, config, security, exception, utils (dùng chung)
|  |  |- integration/       client tới dịch vụ ngoài (aiengine, zalobridge, cloudinary...)
|  |  `- modules/<feature>/ controller / dto / entity / enums / repository / service
|  |- src/main/resources/   application*.yml, db/migration (Flyway V1..V9 hiện có)
|  |- src/test/             JUnit5 + Mockito + MockMvc, profile `test` (H2)
|  |- docker-compose.yml    Postgres 15 (5433) + Redis 7 (6380); sẽ chuyển ra root
|  `- AGENTS.MD             quy ước chi tiết backend (code cũ)
|- frontend/                React SPA
|  |- src/app/store.js      Redux store
|  |- src/services/         baseApi (RTK Query + refresh mutex); realtime.js (STOMP, sẽ thêm)
|  |- src/features/<name>/  <name>Api.js, pages/, components/, slice nếu cần
|  |- src/layouts/          Header/Footer/MainLayout
|  `- AGENTS.MD             quy ước chi tiết frontend (code cũ)
|- ai/                      (rỗng) sẽ là FastAPI AI Engine
`- zalo-bridge/             (chưa có) sẽ là Node Zalo Bridge
```

Không chỉnh sửa: `node_modules/`, `target/`, `dist/`, `.venv/`, `.idea/`,
`.tmp/`, lockfile (trừ khi đổi dependency), `backend/.gemini/skills/` (catalog
chung không liên quan, sẽ bị xóa).

---

## 5. Tech stack và ràng buộc phiên bản

| Lớp | Công nghệ | Ràng buộc |
| --- | --- | --- |
| Backend | Java **17**, Spring Boot **3.5.x**, Security + JJWT 0.11.5, Data JPA, Flyway, WebSocket (STOMP, simple broker), Mail, Validation, Redis, Springdoc, Lombok, Cloudinary | Không dùng cú pháp chỉ có ở Java 21 (`backend/GEMINI.md` ghi sai). DTO theo phong cách Lombok xung quanh |
| Frontend | React 19, Vite 8, React Router 7, Redux Toolkit + **RTK Query** (lớp API duy nhất), Tailwind 3, JavaScript (không TS) | Sẽ thêm: FullCalendar (`react`, `daygrid`, `timegrid`, `list`, `interaction`), `@stomp/stompjs`, `framer-motion`, `canvas-confetti`, `lucide-react`, `react-markdown` + `remark-gfm`, Shadcn/UI. Phiên bản Tailwind cho Shadcn cần chốt trước khi init |
| AI Engine | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `google-genai`, PyMuPDF (`fitz`), `python-docx`, pytest | Model `gemini-2.5-flash`, `temperature=0.2`, `response_schema` bằng Pydantic |
| Zalo Bridge | Node.js LTS, Express, `zca-js` | Bắt buộc có `ZALO_MODE=mock` |
| Data | PostgreSQL 15 (JSONB cho dữ liệu game), Redis 7 | Flyway là nguồn sự thật của schema |

Không tự thêm thư viện HTTP/state/form thứ hai ở frontend (Axios, React Hook
Form, Zod đang được cài nhưng **không dùng**). Chỉ áp dụng nếu task quyết định
dùng cho toàn bộ feature.

---

## 6. Quy tắc làm việc cho Agent

1. **Đọc trước, sửa sau.** Đọc controller → service → DTO → entity → test → FE api/page liên quan. Tìm mọi call site trước khi đổi contract.
2. **Tôn trọng working tree của người dùng.** Chạy `git status --short` trước và sau. Không reset, format hàng loạt hay ghi đè thay đổi không liên quan. Không commit/push, không xóa volume Docker, không reset DB nếu không được yêu cầu.
3. **Vertical slice.** Một thay đổi contract phải đồng bộ: migration → entity → DTO/validation → service → controller → `ErrorCode` → test BE → `xxxApi.js` + tag cache → UI + map lỗi tiếng Việt.
4. **Bảo mật.** Không in hoặc commit `.env`, JWT, OTP, cookie, API key Gemini, session Zalo, nội dung tin nhắn Zalo. Không lưu token vào localStorage/sessionStorage. Không log nội dung tin nhắn ngoài whitelist.
5. **Giữ UTF-8 tiếng Việt.** PowerShell có thể hiển thị mojibake, điều đó không có nghĩa là file hỏng.
6. **Migration chỉ thêm, không sửa.** Tạo `V{n+1}__mo_ta.sql`. Không sửa file Flyway đã áp dụng.
7. **AI luôn có Human-in-the-loop.** Sự kiện do AI tạo **không bao giờ** tự động thành `CONFIRMED` hay xóa dữ liệu người dùng nếu chưa được xác nhận.
8. **Demo phải chạy được offline.** Mọi tính năng AI/Zalo phải có đường mock (`AI_MODE=mock`, `ZALO_MODE=mock`) cho test và sân khấu.
9. Chạy check hẹp nhất khi lặp, chạy check đầy đủ của service đã chạm trước khi bàn giao. Báo riêng lỗi có sẵn và lỗi do mình gây ra.
10. **Cập nhật file này** (bảng §2, contract §8, env §7) khi kiến trúc, lệnh, contract hoặc trạng thái thay đổi.

---

## 7. Chạy local, cổng và biến môi trường

| Service | Lệnh (từ thư mục service) | Cổng |
| --- | --- | --- |
| Postgres + Redis | `docker compose up -d postgres redis` (trong `backend/`) | 5433, 6380 |
| Backend | `mvnw.cmd spring-boot:run` (Windows) / `./mvnw spring-boot:run`; nếu wrapper lỗi thì dùng `mvn spring-boot:run` | 8080 (`/api/v1`, Swagger `/swagger-ui/index.html`, WS `/ws`) |
| Frontend | `npm ci` rồi `npm run dev` (Windows chặn ps1 thì dùng `npm.cmd`) | 5173 |
| AI Engine (dự kiến) | `uvicorn app.main:app --reload --port 8000` | 8000 |
| Zalo Bridge (dự kiến) | `npm run dev` | 3001 |

Kiểm tra:

- Backend: `mvn test`, `mvn clean verify`, `mvn -Dtest=XxxTest test`.
- Frontend: `npm run lint`, `npm run build` (chưa có test runner; lỗi lint có sẵn ở `src/hooks/useFetch.js`, file sẽ bị xóa).
- AI: `pytest`. Bridge: `npm test` (khi được tạo).

Biến môi trường (chỉ khai báo trong `.env` bị ignore, `.env.example` chỉ chứa
placeholder):

```text
# backend (hiện có)
DB_URL, DB_USERNAME, DB_PASSWORD, REDIS_HOST, REDIS_PORT(=6380 với compose)
MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, JWT_SECRET (Base64, HS256)
COOKIE_SECURE, COOKIE_SAME_SITE, CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/FOLDER
# backend (sẽ thêm)
APP_CORS_ALLOWED_ORIGINS, APP_TIMEZONE=Asia/Ho_Chi_Minh
AI_ENGINE_URL=http://localhost:8000, ZALO_BRIDGE_URL=http://localhost:3001
INTERNAL_API_KEY
# frontend
VITE_API_URL=http://localhost:8080/api      (có hậu tố /api; endpoint FE bắt đầu bằng /v1)
VITE_WS_URL=ws://localhost:8080/ws          (sẽ thêm)
# ai
GEMINI_API_KEY, GEMINI_MODEL=gemini-2.5-flash, AI_MODE=live|mock, INTERNAL_API_KEY
# zalo-bridge
BACKEND_URL, INTERNAL_API_KEY, ZALO_MODE=real|mock, PORT=3001
```

> ⚠️ `backend/src/main/resources/application-local.yml` đang chứa fallback
> SMTP/JWT trông giống thông tin thật. Không sao chép các giá trị đó ra nơi khác.
> Nhiệm vụ P0 là xóa fallback và rotate credential.

---

## 8. Contract

### 8.1 REST (backend)

- Base `/api/v1`. Controller dùng `@RestApiV1` + hằng số trong `UrlConstant`.
- Mọi response bọc trong `ApiResponse<T>`: `{code, status, message, data, errorCode, timestamp}`. **HTTP status là chuẩn**.
- Lỗi nghiệp vụ: `throw new AppException(ErrorCode.X)`. Thêm mã mới vào `ErrorCode`, test, và map lỗi tiếng Việt ở FE.
- Không bao giờ trả entity JPA hay trường password/token.
- Định danh dễ nhầm trong friendship: `requestId` dùng cho accept/từ chối, `friendshipId` dùng cho unfriend, không bao giờ dùng `user.id`.

Endpoint **hiện có**: `/auth/*` (register, verify-otp, login, refresh-token,
logout, forgot-password, verify-otp-forgot-password, reset-password,
change-password), `GET /users/me`, `PATCH /user/update-profile` (multipart),
`/friends`, `/friends/requests[/incoming|/outgoing|/{id}/accept|/{id}]`,
`GET /chat/{friendUserId}/messages?page&size` (size ≤ 50). Xem bảng đầy đủ trong
`backend/AGENTS.MD`.

Endpoint **dự kiến** (đề xuất; chốt khi implement rồi sửa lại ở đây):

```text
GET    /users/search?q=                       tìm theo tên/email (FR-5.1)
POST   /friends/requests                      thêm body {userId} bên cạnh {pinCode}
GET    /chat/conversations
GET|POST /subjects   PUT|DELETE /subjects/{id}
GET    /schedule/events?from&to               (ISO 8601, +07:00)
POST   /schedule/events   PATCH|DELETE /schedule/events/{id}
POST   /schedule/events/{id}/confirm | /reject
POST   /zalo/connect  (trả QR)   GET /zalo/status   GET /zalo/groups
GET|POST /zalo/mappings   PATCH|DELETE /zalo/mappings/{id}   (toggle isActive)
POST   /zalo/simulate                         Demo Simulator (FR-2.4)
GET|POST /materials  GET|DELETE /materials/{id}  POST /materials/{id}/regenerate
POST   /materials/{id}/scores   GET /materials/{id}/leaderboard?scope=global|friends
GET|PUT /users/me/reminder-settings
GET    /notifications?page&size&unreadOnly    lấy danh sách thông báo
GET    /notifications/unread-count            lấy số lượng chưa đọc
PATCH  /notifications/{id}/read               đánh dấu đã đọc
POST   /notifications/read-all                đánh dấu tất cả đã đọc
DELETE /notifications/{id}                    xóa thông báo
POST   /notifications/trigger-today           sinh tóm tắt lịch hôm nay
POST   /internal/zalo/messages                chỉ cho bridge, header X-Internal-Api-Key
```

### 8.2 WebSocket (STOMP)

- Endpoint `/ws` (WebSocket thuần, chưa bật SockJS). Header `Authorization: Bearer <accessToken>` gửi trong frame CONNECT.
- Prefix: app `/app`, user `/user`, broker `/queue`.
- **Hiện có:** SEND `/app/chat.send` `{recipientId, content}`. SUBSCRIBE `/user/queue/messages`, `/user/queue/errors`, `/user/queue/schedule`, `/user/queue/notifications`.
- **Dự kiến:** `/user/queue/presence` (bạn bè online/offline). Chat có thêm `sharedMaterialId`.
- `WebSocketAuthChannelInterceptor` **whitelist cứng** các destination. Thêm destination mới thì phải sửa ở đó và viết test.
- Payload đẩy qua WS cũng bọc `ApiResponse`.

### 8.3 AI Engine (nội bộ)

- `POST /v1/zalo/parse-message`: input `{current_datetime, subject_name, default_room, sender_name, message_text}`. Output `{is_academic_announcement, confidence_score, detected_events[{event_type, title, start_datetime, end_datetime, room, note}]}`. Xem ví dụ chuẩn trong PRD §5.2.
- `POST /v1/materials/process` (multipart `file`, `subject_name`): output `{summary_markdown, speed_quiz[{question, options[4], correct_index, explanation}], memory_match_pairs[{pair_id, term, definition}]}`. Xem PRD §5.3. Quiz có 10–15 câu, memory match có 6 hoặc 8 cặp (12/16 thẻ).
- Lỗi trả `{error_code, message}` kèm HTTP status phù hợp. Backend ánh xạ sang `ErrorCode` (ví dụ `AI_ENGINE_UNAVAILABLE`, `MATERIAL_PARSE_FAILED`).
- Nếu không trích được chữ (PDF scan) thì trả lỗi rõ ràng, **không** để model bịa nội dung.

### 8.4 Zalo Bridge → Backend

```json
POST /api/v1/internal/zalo/messages
{ "ownerUserId": "uuid", "zaloGroupId": "string", "zaloGroupName": "string",
  "messageId": "string", "senderName": "string", "text": "string",
  "sentAt": "2026-10-21T23:40:00+07:00" }
```

Backend → Bridge: đồng bộ whitelist mỗi khi mapping thay đổi. Bridge hỗ trợ QR
login, lấy danh sách group và trạng thái session theo `userId`.

---

## 9. Mô hình dữ liệu

**Hiện có (V1–V7):**

- `users`: UUID, email unique, `password_hash`, `full_name`, avatar, profile, `pin_code` unique, `status` `PENDING|ACTIVE|BANNED`, `is_deleted`, timestamps.
- `friendships`: cặp không thứ tự `low_user_id/high_user_id`, `requester_id`, `PENDING|ACCEPTED`, `accepted_at`.
- `chat_messages`: `sender_id`, `recipient_id`, `content` ≤ 2000, `created_at`.

**Dự kiến (V8+):** bám PRD §4, có các điều chỉnh sau:

| Bảng | Ghi chú so với PRD |
| --- | --- |
| `users` + `zalo_connected` | — |
| `subjects` | + `semester_start_date`, `semester_end_date` để sinh buổi học định kỳ |
| `schedule_events` | + `status` (`CONFIRMED`, `PENDING_REVIEW`, `REJECTED`), `ai_confidence`, `note`, `source_message_id`. `event_type`: `REGULAR_CLASS`, `MAKEUP_CLASS`, `CANCELLED_CLASS`, `EXAM`, `DEADLINE`. `source`: `MANUAL`, `ZALO_AI` |
| `zalo_group_mappings` | unique (`user_id`, `zalo_group_id`); `is_active` mặc định **false** |
| `study_materials` | `quiz_data_json`, `memory_match_json` là **JSONB**; + `processing_status` |
| `game_scores` | `game_type`: `SPEED_QUIZ`, `MEMORY_MATCH` |
| `chat_messages` | giữ `recipient_id`; + `shared_material_id` (nullable FK) |
| `user_reminder_settings`, `reminder_logs` | thay cho `is_reminded`; unique (`event_id`, `offset_minutes`, `channel`) để không nhắc trùng |

Giữ schema `friendships`/`chat_messages` hiện có thay vì schema rút gọn trong
PRD. Thời gian lưu bằng `TIMESTAMP WITH TIME ZONE`. Kiểm tra migration trên
PostgreSQL thật vì H2 không đủ đối với JSONB, lock và constraint.

---

## 10. Quy tắc nghiệp vụ quan trọng

- **Múi giờ:** mọi tính toán dùng `Asia/Ho_Chi_Minh` và ISO 8601 có offset `+07:00`. Backend luôn gửi `current_datetime` thực cho AI.
- **Bảng giờ tiết học:** cấu hình ở **một nơi duy nhất** (config backend, truyền vào AI). Ví dụ trong PRD: "tiết 1-3" = 07:00–09:30. Giá trị chính thức do team chốt.
- **Màu sự kiện (FR-1.3):** `REGULAR_CLASS` xanh dương, `MAKEUP_CLASS` + đổi phòng cam, `EXAM`/`DEADLINE` đỏ, `CANCELLED_CLASS` xám gạch ngang. Định nghĩa trong 1 module dùng chung (token Tailwind + map `eventColors`).
- **Sự kiện AI:** có nhãn "✨ AI cập nhật từ Zalo", hiển thị tin nhắn gốc, có nút xác nhận/sửa/xóa 1 chạm. `CANCELLED_CLASS` phải liên kết với buổi học gốc thay vì tạo sự kiện trôi nổi.
- **Quyền riêng tư Zalo:** mapping mặc định OFF. Toggle OFF phải dừng xử lý **ngay lập tức** ở cả bridge và backend. Chỉ lưu `raw_zalo_message` của tin đã tạo sự kiện, không lưu tin tán gẫu.
- **Nhắc lịch mặc định:** lớp học trước 30 phút. Kiểm tra/deadline trước 24 giờ và 2 giờ. Email cho `EXAM`, `MAKEUP_CLASS` (và `DEADLINE`). Không nhắc buổi đã `CANCELLED_CLASS` hoặc sự kiện `REJECTED`.
- **Minigame:** Speed Quiz 15 giây/câu, combo streak, hiện giải thích sau mỗi câu. Memory Match 12/16 thẻ, xếp hạng theo thời gian. Điểm được backend validate (không tin hoàn toàn client).
- **Chat/chia sẻ:** chỉ bạn bè `ACCEPTED` mới nhắn tin hoặc chia sẻ được. Người nhận mở học liệu được chia sẻ thì có quyền đọc/chơi bộ đó.

---

## 11. Quy ước theo service

### Backend

- Controller chỉ binding HTTP + `@Valid` + envelope. Service chứa nghiệp vụ, transaction và mapping DTO. Repository dùng Spring Data/JPQL có tham số.
- Constructor injection (`@RequiredArgsConstructor`). Phần dùng chung đặt trong `core/`, phần riêng đặt trong `modules/<feature>/`, client ra ngoài đặt trong `integration/<name>/`.
- Gọi AI/Bridge bằng `RestClient` có timeout và xử lý lỗi. Tác vụ dài (xử lý đề cương) chạy async và cập nhật `processing_status`, không chặn request quá lâu.
- Việc cần làm ở P0: `@EnableAsync`, `@EnableScheduling`, CORS/WS origin lấy từ config, chuẩn hóa lỗi JWT về 401 envelope, bảo vệ `/internal/**` bằng API key filter.

### Frontend

- Feature mới đặt trong `src/features/<name>/` gồm `<name>Api.js` (`baseApi.injectEndpoints`), `pages/` (container giữ query/mutation) và `components/` (presentational, nhận props).
- Server state nằm trong RTK Query (tag dự kiến: `Subject`, `ScheduleEvent`, `ZaloGroup`, `ZaloMapping`, `Material`, `GameScore`, `ChatThread`). Auth nằm trong `authSlice`. State UI tạm nằm trong `useState`.
- Dùng một STOMP client duy nhất (`services/realtime.js`), kết nối sau khi có access token và reconnect khi token được refresh. Message WS chỉ làm `invalidateTags` hoặc cập nhật cache, không nhân bản state.
- Dùng `.unwrap()` trong handler. Xử lý riêng `FETCH_ERROR`. Viết copy tiếng Việt tự nhiên.
- Không dùng `dangerouslySetInnerHTML`; Markdown render bằng `react-markdown`. Giữ accessibility: dialog có focus trap/Escape, `aria-*`, tôn trọng reduced motion (animation của game cũng vậy).

### AI Engine (`ai/`)

- Cấu trúc gợi ý: `app/main.py`, `app/routers/`, `app/schemas/` (Pydantic, cũng là `response_schema`), `app/services/` (extractors, gemini client, prompts), `app/fixtures/` (mock), `tests/`.
- Prompt nằm trong file riêng, có từ điển viết tắt sinh viên VN (t7, cn, btl, ktr, k/ko học, tiết…) và bảng giờ tiết học.
- Validate output bằng Pydantic. Nếu output sai schema thì retry 1 lần rồi mới trả lỗi. Văn bản dài thì cắt/chunk có kiểm soát.

### Zalo Bridge (`zalo-bridge/`)

- `zca-js` là API không chính thức, có rủi ro khóa tài khoản. Dùng tài khoản phụ. Mock mode là mặc định khi demo.
- Session Zalo theo `userId`, không commit hoặc log cookie/credential. Dedupe theo `messageId`. Retry có backoff khi backend lỗi.

---

## 12. Definition of Done

- [ ] Hành vi khớp FR tương ứng trong `prd.md` (ghi rõ mã FR trong mô tả PR/bàn giao).
- [ ] Contract đồng bộ giữa migration, entity, DTO, API, FE và WS whitelist.
- [ ] Có test: unit (Mockito/pytest) cho nhánh nghiệp vụ; MockMvc cho binding, security, envelope; test parser thời gian và schema AI bằng fixture.
- [ ] `mvn clean verify` / `npm run lint && npm run build` / `pytest` của service đã chạm đều pass. Lỗi còn tồn tại được báo chính xác.
- [ ] Đường mock (AI/Zalo) vẫn chạy được cho demo.
- [ ] Không lộ secret, không có output build, không format lan ngoài phạm vi.
- [ ] Đã cập nhật `AGENT.md` (§2 trạng thái, §7 env, §8 contract) nếu có thay đổi.
- [ ] Không tuyên bố đã kiểm thử E2E/trình duyệt nếu thực tế chưa chạy.

---

## 13. Nợ kỹ thuật đã biết (không tự sửa nếu task không liên quan)

- `MailService` dùng `@Async` nhưng chưa bật `@EnableAsync`. Lỗi gửi mail bị nuốt.
- CORS và WS origin hard-code `http://localhost:5173`. CSRF tắt và cookie dùng credentials, nên mọi thay đổi origin đều nhạy cảm bảo mật.
- `application-local.yml`: bật cùng lúc `ddl-auto: update` và Flyway; Redis fallback 6379 lệch với compose 6380; logging package `com.hit.conflict` sai; fallback secret.
- Chỉ lưu 1 refresh token cho mỗi email, nên đăng nhập thiết bị thứ hai sẽ đá thiết bị đầu.
- Lỗi JWT trong filter chưa được chuẩn hóa về envelope.
- `RateLimiterService.isRegisterAllowed` không được gọi. Bộ đếm sai mật khẩu có lệch 1 lần.
- `SecurityConfig` có matcher trùng lặp.
- Frontend: OTP input, helper lỗi và logic focus của modal bị nhân bản. Trang recovery phụ thuộc router state (mất khi reload).
- `backend/Dockerfile` là placeholder. CI nằm trong `backend/.github/` nên GitHub không chạy.
- Chưa có test cho friendship/chat.
