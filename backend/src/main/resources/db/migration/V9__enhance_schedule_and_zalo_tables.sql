-- Migration V9: Enhance timetable and zalo mappings schema

-- 1. Đổi mặc định is_active của zalo_group_mappings thành FALSE theo PRD FR-2.2 và AGENT.md §10
ALTER TABLE zalo_group_mappings ALTER COLUMN is_active SET DEFAULT FALSE;

-- 2. Bổ sung trường related_event_id để CANCELLED_CLASS có thể liên kết với buổi học gốc (AGENT.md §10)
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS related_event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL;

-- 3. Tạo index cho deduplication theo user_id và source_message_id
CREATE INDEX IF NOT EXISTS idx_schedule_events_user_source_msg ON schedule_events(user_id, source_message_id) WHERE source_message_id IS NOT NULL;
