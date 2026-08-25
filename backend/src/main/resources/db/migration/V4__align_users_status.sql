ALTER TABLE users
    ADD COLUMN IF NOT EXISTS status VARCHAR(16);

-- Existing rows predate account statuses and are treated as active accounts.
-- Rows already marked PENDING or BANNED are left unchanged.
UPDATE users
SET status = 'ACTIVE'
WHERE status IS NULL;

ALTER TABLE users
    ALTER COLUMN status TYPE VARCHAR(16) USING status::text::VARCHAR(16),
    ALTER COLUMN status SET DEFAULT 'PENDING',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_users_status;

ALTER TABLE users
    ADD CONSTRAINT chk_users_status
        CHECK (status IN ('PENDING', 'ACTIVE', 'BANNED'));
