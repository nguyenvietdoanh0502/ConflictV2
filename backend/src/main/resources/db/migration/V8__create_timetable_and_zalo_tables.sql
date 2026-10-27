-- Migration V8: Create subjects, zalo_group_mappings, and schedule_events tables

-- 1. Bổ sung cờ kết nối Zalo vào bảng users nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS zalo_connected BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Bảng Môn học (subjects)
CREATE TABLE subjects (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50),
    lecturer            VARCHAR(100),
    default_room        VARCHAR(100),
    color_hex           VARCHAR(20) DEFAULT '#7C6EE6',
    day_of_week         SMALLINT CHECK (day_of_week BETWEEN 1 AND 7), -- 1: Thứ 2, ..., 7: Chủ nhật
    start_time          TIME,
    end_time            TIME,
    semester            VARCHAR(50),
    semester_start_date DATE,
    semester_end_date   DATE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_subjects_name_not_blank CHECK (CHAR_LENGTH(BTRIM(name)) > 0)
);

CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_user_name ON subjects(user_id, name);

-- 3. Bảng Ghép nối Group Zalo với Môn học (zalo_group_mappings)
CREATE TABLE zalo_group_mappings (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id          UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    zalo_group_id       VARCHAR(100) NOT NULL,
    zalo_group_name     VARCHAR(255) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at      TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_zalo_group_mappings_user_group UNIQUE (user_id, zalo_group_id)
);

CREATE INDEX idx_zalo_mappings_group_active ON zalo_group_mappings(zalo_group_id, is_active);
CREATE INDEX idx_zalo_mappings_user_id ON zalo_group_mappings(user_id);
CREATE INDEX idx_zalo_mappings_subject_id ON zalo_group_mappings(subject_id);

-- 4. Bảng Sự kiện trên Thời khóa biểu (schedule_events)
CREATE TABLE schedule_events (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id          UUID REFERENCES subjects(id) ON DELETE SET NULL,
    title               VARCHAR(255) NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    start_datetime      TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime        TIMESTAMP WITH TIME ZONE NOT NULL,
    room                VARCHAR(100),
    source              VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    status              VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    ai_confidence       DOUBLE PRECISION,
    note                TEXT,
    raw_zalo_message    TEXT,
    sender_name         VARCHAR(100),
    source_message_id   VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_schedule_events_time CHECK (start_datetime <= end_datetime),
    CONSTRAINT chk_schedule_events_type CHECK (event_type IN ('REGULAR_CLASS', 'MAKEUP_CLASS', 'CANCELLED_CLASS', 'EXAM', 'DEADLINE')),
    CONSTRAINT chk_schedule_events_source CHECK (source IN ('MANUAL', 'ZALO_AI')),
    CONSTRAINT chk_schedule_events_status CHECK (status IN ('CONFIRMED', 'PENDING_REVIEW', 'REJECTED'))
);

CREATE INDEX idx_schedule_events_user_time ON schedule_events(user_id, start_datetime, end_datetime);
CREATE INDEX idx_schedule_events_subject ON schedule_events(subject_id);
CREATE INDEX idx_schedule_events_status ON schedule_events(status);
CREATE INDEX idx_schedule_events_source_msg ON schedule_events(source_message_id) WHERE source_message_id IS NOT NULL;
