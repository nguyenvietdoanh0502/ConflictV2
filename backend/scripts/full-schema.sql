-- Consolidated Database Schema for Conflict
-- Note: This is for reference. Use Flyway migrations for actual database updates.

-- 1. Users Table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    full_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    avatar_public_id VARCHAR(255),
    date_of_birth   DATE,
    address         VARCHAR(255),
    gender          VARCHAR(10),
    status          VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    pin_code        VARCHAR(10) UNIQUE NOT NULL,
    google_id       VARCHAR(255) UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_users_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_users_status CHECK (status IN ('PENDING', 'ACTIVE', 'BANNED'))
);

CREATE INDEX idx_users_email ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_pin_code ON users(pin_code);
CREATE INDEX idx_users_full_name ON users(full_name) WHERE is_deleted = FALSE;

-- 2. Friendships Table
CREATE TABLE friendships (
    id              UUID PRIMARY KEY,
    low_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    high_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_friendships_no_self CHECK (low_user_id <> high_user_id),
    CONSTRAINT chk_friendships_requester_is_member CHECK (
        requested_by_id IN (low_user_id, high_user_id)
    ),
    CONSTRAINT chk_friendships_status CHECK (status IN ('PENDING', 'ACCEPTED')),
    CONSTRAINT chk_friendships_accepted_at CHECK (
        (status = 'PENDING' AND accepted_at IS NULL)
        OR
        (status = 'ACCEPTED' AND accepted_at IS NOT NULL)
    )
);

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

-- 3. Groups Table
CREATE TABLE groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    cover_url       TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_groups_created_by ON groups(created_by) WHERE is_deleted = FALSE;

-- 4. Group Members Table
CREATE TABLE group_members (
    group_id        UUID NOT NULL REFERENCES groups(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    role            VARCHAR(10) NOT NULL DEFAULT 'MEMBER',
    joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    added_by        UUID REFERENCES users(id),
    
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- 5. Itineraries Table
CREATE TABLE itineraries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id),
    title           VARCHAR(200) NOT NULL,
    prompt_used     TEXT,
    destination     VARCHAR(200),
    num_days        INT,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_itineraries_group_id ON itineraries(group_id) WHERE is_deleted = FALSE;

-- 6. Itinerary Items Table
CREATE TABLE itinerary_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id    UUID NOT NULL REFERENCES itineraries(id),
    day_number      INT NOT NULL,
    time_of_day     VARCHAR(15) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    place_name      VARCHAR(255) NOT NULL,
    address         TEXT,
    google_place_id VARCHAR(255),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    opening_hours   TEXT,
    rating          DECIMAL(2, 1),
    expected_cost   DECIMAL(15, 2) DEFAULT 0,
    currency        VARCHAR(5) DEFAULT 'VND',
    note            TEXT,
    is_custom       BOOLEAN NOT NULL DEFAULT FALSE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);

-- 7. Messages Table
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES groups(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(10) NOT NULL DEFAULT 'TEXT',
    content         TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_group_created ON messages(group_id, created_at DESC);
