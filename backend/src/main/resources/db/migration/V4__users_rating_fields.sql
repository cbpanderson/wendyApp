-- V4__users_rating_fields.sql
-- Add average_stars and rating_count to users for US-9 (ratings)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS average_stars DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS rating_count  INTEGER NOT NULL DEFAULT 0;
