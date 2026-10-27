-- Migration V11: Create study_materials and game_scores tables

CREATE TABLE study_materials (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id          UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_type           VARCHAR(50) NOT NULL,
    file_size           BIGINT NOT NULL,
    file_url            VARCHAR(500),
    extracted_text      TEXT,
    ai_summary_markdown TEXT,
    quiz_data_json      JSONB,
    memory_match_json   JSONB,
    processing_status   VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message       TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_material_status CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_study_materials_user_subject ON study_materials(user_id, subject_id);
CREATE INDEX idx_study_materials_subject_id ON study_materials(subject_id);

CREATE TABLE game_scores (
    id                  UUID PRIMARY KEY,
    material_id         UUID NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type           VARCHAR(30) NOT NULL,
    score               INT NOT NULL,
    time_taken_seconds  INT NOT NULL,
    accuracy_rate       DOUBLE PRECISION,
    played_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_game_score_type CHECK (game_type IN ('SPEED_QUIZ', 'MEMORY_MATCH'))
);

CREATE INDEX idx_game_scores_leaderboard ON game_scores(material_id, game_type, score DESC, time_taken_seconds ASC);
CREATE INDEX idx_game_scores_user_id ON game_scores(user_id);
