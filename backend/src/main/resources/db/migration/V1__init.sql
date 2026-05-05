-- V1__init.sql
-- Initial schema for Sequim Barter v1
-- Mirrors entities defined in spec-docs/02-domain.md

-- Useful for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================== USERS =====================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    handle          VARCHAR(30)  NOT NULL UNIQUE,
    bio             TEXT,
    zip_code        VARCHAR(5)   NOT NULL,
    confirmed_adult BOOLEAN      NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT users_handle_format CHECK (handle ~ '^[a-zA-Z0-9_]{3,30}$'),
    CONSTRAINT users_must_be_adult CHECK (confirmed_adult = TRUE)
);
CREATE INDEX idx_users_handle ON users (handle);

-- ===================== CATEGORIES =====================
CREATE TABLE categories (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name   VARCHAR(100) NOT NULL UNIQUE,
    slug   VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ===================== LISTINGS =====================
CREATE TYPE listing_offer_type AS ENUM ('TRADE_ONLY', 'GIFT_ONLY', 'EITHER');
CREATE TYPE listing_status     AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

CREATE TABLE listings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id     UUID NOT NULL REFERENCES users (id),
    category_id  UUID NOT NULL REFERENCES categories (id),
    title        VARCHAR(100) NOT NULL,
    description  TEXT NOT NULL,
    offer_type   listing_offer_type NOT NULL,
    status       listing_status NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT listings_title_min_length CHECK (char_length(title) >= 5)
);
CREATE INDEX idx_listings_owner    ON listings (owner_id);
CREATE INDEX idx_listings_category ON listings (category_id);
CREATE INDEX idx_listings_status   ON listings (status);

-- ===================== LISTING PHOTOS (max 2 per listing) =====================
CREATE TABLE listing_photos (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    url        VARCHAR(1024) NOT NULL,
    position   SMALLINT NOT NULL,

    CONSTRAINT listing_photos_position_range CHECK (position IN (0, 1)),
    CONSTRAINT listing_photos_unique_position UNIQUE (listing_id, position)
);

-- ===================== OFFERS =====================
CREATE TYPE offer_type   AS ENUM ('TRADE', 'GIFT_REQUEST');
CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

CREATE TABLE offers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL REFERENCES listings (id),
    from_user_id        UUID NOT NULL REFERENCES users (id),
    to_user_id          UUID NOT NULL REFERENCES users (id),
    offer_type          offer_type NOT NULL,
    offered_listing_id  UUID REFERENCES listings (id),
    message             TEXT,
    status              offer_status NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at        TIMESTAMPTZ,

    CONSTRAINT offers_no_self CHECK (from_user_id <> to_user_id),
    CONSTRAINT offers_trade_requires_listing
        CHECK ((offer_type = 'TRADE'        AND offered_listing_id IS NOT NULL)
            OR (offer_type = 'GIFT_REQUEST' AND offered_listing_id IS NULL))
);
-- Only one PENDING offer per (fromUser, listing) pair
CREATE UNIQUE INDEX uq_offers_pending_per_user_listing
    ON offers (from_user_id, listing_id)
    WHERE status = 'PENDING';
CREATE INDEX idx_offers_listing  ON offers (listing_id);
CREATE INDEX idx_offers_to_user  ON offers (to_user_id);

-- ===================== DEALS =====================
CREATE TYPE deal_type   AS ENUM ('TRADE', 'GIFT');
CREATE TYPE deal_status AS ENUM (
    'ACCEPTED', 'COMPLETED_BY_A', 'COMPLETED_BY_B', 'COMPLETED', 'CANCELLED'
);

CREATE TABLE deals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id              UUID NOT NULL UNIQUE REFERENCES offers (id),
    deal_type             deal_type NOT NULL,
    participant_a_id      UUID NOT NULL REFERENCES users (id),
    participant_b_id      UUID NOT NULL REFERENCES users (id),
    listing_a_id          UUID NOT NULL REFERENCES listings (id),
    listing_b_id          UUID REFERENCES listings (id),
    status                deal_status NOT NULL DEFAULT 'ACCEPTED',
    accepted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at          TIMESTAMPTZ,
    cancelled_at          TIMESTAMPTZ,
    cancelled_by_user_id  UUID REFERENCES users (id),

    CONSTRAINT deals_no_self CHECK (participant_a_id <> participant_b_id),
    CONSTRAINT deals_gift_has_no_b_listing
        CHECK ((deal_type = 'GIFT'  AND listing_b_id IS NULL)
            OR (deal_type = 'TRADE' AND listing_b_id IS NOT NULL))
);
CREATE INDEX idx_deals_participant_a ON deals (participant_a_id);
CREATE INDEX idx_deals_participant_b ON deals (participant_b_id);
CREATE INDEX idx_deals_status        ON deals (status);

-- ===================== MESSAGES =====================
CREATE TABLE messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id   UUID NOT NULL REFERENCES offers (id),
    sender_id  UUID NOT NULL REFERENCES users (id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at    TIMESTAMPTZ,

    CONSTRAINT messages_body_max_length CHECK (char_length(body) <= 2000)
);
CREATE INDEX idx_messages_offer_created ON messages (offer_id, created_at);

-- ===================== RATINGS =====================
CREATE TABLE ratings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id    UUID NOT NULL REFERENCES deals (id),
    rater_id   UUID NOT NULL REFERENCES users (id),
    ratee_id   UUID NOT NULL REFERENCES users (id),
    stars      SMALLINT NOT NULL,
    review     TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ratings_stars_range CHECK (stars BETWEEN 1 AND 5),
    CONSTRAINT ratings_no_self     CHECK (rater_id <> ratee_id),
    CONSTRAINT ratings_unique_per_deal_rater UNIQUE (deal_id, rater_id)
);
CREATE INDEX idx_ratings_ratee ON ratings (ratee_id);
