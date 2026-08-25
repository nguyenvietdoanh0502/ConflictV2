CREATE TABLE friendships (
    id              UUID PRIMARY KEY,
    low_user_id     UUID NOT NULL,
    high_user_id    UUID NOT NULL,
    requested_by_id UUID NOT NULL,
    status          VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_friendships_low_user
        FOREIGN KEY (low_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_high_user
        FOREIGN KEY (high_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_requested_by
        FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_friendships_no_self
        CHECK (low_user_id <> high_user_id),
    CONSTRAINT chk_friendships_requester_is_member
        CHECK (requested_by_id IN (low_user_id, high_user_id)),
    CONSTRAINT chk_friendships_status
        CHECK (status IN ('PENDING', 'ACCEPTED')),
    CONSTRAINT chk_friendships_accepted_at
        CHECK (
            (status = 'PENDING' AND accepted_at IS NULL)
            OR
            (status = 'ACCEPTED' AND accepted_at IS NOT NULL)
        )
);

-- The service stores the user with the lower pinCode in low_user_id. The
-- expression index is still unordered so a reversed pair cannot be inserted
-- if application-level canonicalization is ever bypassed.
CREATE UNIQUE INDEX uq_friendships_unordered_pair
    ON friendships (
        LEAST(low_user_id, high_user_id),
        GREATEST(low_user_id, high_user_id)
    );

CREATE INDEX idx_friendships_low_user_status_created
    ON friendships(low_user_id, status, created_at DESC);

CREATE INDEX idx_friendships_high_user_status_created
    ON friendships(high_user_id, status, created_at DESC);

CREATE INDEX idx_friendships_requested_by_status_created
    ON friendships(requested_by_id, status, created_at DESC);
