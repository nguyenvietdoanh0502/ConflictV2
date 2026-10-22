ALTER TABLE users
    ADD COLUMN date_of_birth DATE,
    ADD COLUMN address VARCHAR(255),
    ADD COLUMN gender VARCHAR(10);

ALTER TABLE users
    ADD CONSTRAINT chk_users_gender
        CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));
