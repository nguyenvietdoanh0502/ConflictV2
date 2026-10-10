CREATE TABLE chat_messages (
    id           UUID PRIMARY KEY,
    sender_id    UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content      VARCHAR(2000) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_chat_messages_sender
        FOREIGN KEY (sender_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chat_messages_recipient
        FOREIGN KEY (recipient_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_chat_messages_not_self
        CHECK (sender_id <> recipient_id),

    CONSTRAINT chk_chat_messages_content
        CHECK (CHAR_LENGTH(BTRIM(content)) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_chat_messages_sender_recipient_created
    ON chat_messages (
        sender_id,
        recipient_id,
        created_at DESC,
        id DESC
    );

CREATE INDEX idx_chat_messages_recipient_sender_created
    ON chat_messages (
        recipient_id,
        sender_id,
        created_at DESC,
        id DESC
    );