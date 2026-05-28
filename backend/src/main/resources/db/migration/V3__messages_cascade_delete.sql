-- Add ON DELETE CASCADE to messages.offer_id so that deleting an offer
-- automatically deletes its messages (required for test cleanup ordering).
ALTER TABLE messages
    DROP CONSTRAINT messages_offer_id_fkey;

ALTER TABLE messages
    ADD CONSTRAINT messages_offer_id_fkey
        FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE CASCADE;
