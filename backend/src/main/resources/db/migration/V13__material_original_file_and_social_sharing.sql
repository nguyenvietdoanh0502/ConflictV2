-- Migration V13: Store original study material file binary and support sharing/challenging in chat_messages

CREATE TABLE study_material_files (
    material_id  UUID PRIMARY KEY REFERENCES study_materials(id) ON DELETE CASCADE,
    content_type VARCHAR(120) NOT NULL,
    file_data    BYTEA NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_messages
    ADD COLUMN shared_material_id UUID REFERENCES study_materials(id) ON DELETE SET NULL,
    ADD COLUMN message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
    ADD COLUMN challenge_game_type VARCHAR(30),
    ADD COLUMN challenger_score INT,
    ADD COLUMN challenger_time_seconds INT;

ALTER TABLE chat_messages
    ADD CONSTRAINT chk_chat_message_type
    CHECK (message_type IN ('TEXT', 'SHARE_MATERIAL', 'CHALLENGE_GAME'));

CREATE INDEX idx_chat_messages_shared_material
    ON chat_messages(shared_material_id, recipient_id)
    WHERE shared_material_id IS NOT NULL;

