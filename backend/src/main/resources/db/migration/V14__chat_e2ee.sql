-- Migration V14: End-to-End Encryption (E2EE) key storage and chat message encryption metadata

CREATE TABLE user_e2ee_keys (
    id                     UUID PRIMARY KEY,
    user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_version            INT  NOT NULL,
    public_key             VARCHAR(512)  NOT NULL,
    encrypted_private_key  VARCHAR(1024) NOT NULL,
    kdf_salt               VARCHAR(64)   NOT NULL,
    kdf_iterations         INT           NOT NULL,
    wrap_iv                VARCHAR(32)   NOT NULL,
    is_active              BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_e2ee_keys_version UNIQUE (user_id, key_version),
    CONSTRAINT chk_user_e2ee_kdf_iterations CHECK (kdf_iterations >= 100000)
);

CREATE UNIQUE INDEX uq_user_e2ee_keys_active ON user_e2ee_keys(user_id) WHERE is_active;
CREATE INDEX idx_user_e2ee_keys_user_version ON user_e2ee_keys(user_id, key_version DESC);

ALTER TABLE chat_messages ALTER COLUMN content TYPE VARCHAR(8192);
ALTER TABLE chat_messages DROP CONSTRAINT chk_chat_messages_content;
ALTER TABLE chat_messages ADD CONSTRAINT chk_chat_messages_content
    CHECK (CHAR_LENGTH(BTRIM(content)) BETWEEN 1 AND 8192);

ALTER TABLE chat_messages
    ADD COLUMN is_encrypted          BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN encryption_iv         VARCHAR(32),
    ADD COLUMN sender_key_version    INT,
    ADD COLUMN recipient_key_version INT;

ALTER TABLE chat_messages ADD CONSTRAINT chk_chat_messages_encryption CHECK (
    is_encrypted = FALSE OR (
        message_type = 'TEXT'
        AND encryption_iv IS NOT NULL
        AND sender_key_version IS NOT NULL
        AND recipient_key_version IS NOT NULL
    )
);

