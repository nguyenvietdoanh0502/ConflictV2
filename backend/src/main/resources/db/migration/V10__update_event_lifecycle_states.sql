-- Migration V10: Add lifecycle fields for cancellation, room change, and reschedule tracking

-- 1. Thêm trường original_event_type để lưu loại sự kiện trước khi có thông báo nghỉ học (cho phép hoàn tác nếu từ chối)
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS original_event_type VARCHAR(50);

-- 2. Thêm trường original_room để lưu phòng học trước khi đổi phòng (cho phép hoàn tác nếu từ chối)
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS original_room VARCHAR(100);

-- 3. Cập nhật check constraint chk_schedule_events_type để hỗ trợ ROOM_CHANGE nếu AI phân loại
ALTER TABLE schedule_events DROP CONSTRAINT IF EXISTS chk_schedule_events_type;
ALTER TABLE schedule_events ADD CONSTRAINT chk_schedule_events_type 
    CHECK (event_type IN ('REGULAR_CLASS', 'MAKEUP_CLASS', 'CANCELLED_CLASS', 'EXAM', 'DEADLINE', 'ROOM_CHANGE'));
